const Component = require('../Component');
const THREE = require('three');
const GameObject = require('../GameObject');
const ENV_CLIENT = !(typeof window === 'undefined');

/**
 * 排序控制器
 */
@Component.serializedName('SortController')
class SortController extends Component {

    constructor() {
        super();

        this.props.cooldown = 10;   // 按钮冷却帧数
    }

    start() {
        this.cooldown = 0;

        // 描述当前状态的变量
        this.state = {
            content: [7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
            program: null,
            pointer_i: 0,
            pointer_j: 0,

            bubble_exchange_flag: false,
            
            //data structure for quick sort 
           
            pointerPairStack:[], //element pattern: [h,t,i,j] for head , tail of subsequence , index i ,j of subsequence respectively
            top : -1,
            direct : true 
        };

        if (ENV_CLIENT) {
            this.numberPool = new NumberPool(this.gameObject);
            this.children = [];
            for (let i = -7; i <= 7; i++) {
                this.children[i + 7] = this.numberPool.obtain(this.state.content[i + 7]);
                this.children[i + 7].visible = true;
                this.children[i + 7].position.x = i;
            }
        }

        // 是否在自动播放状态
        this.isAuto = false;
        this.program = null;  // 执行的程序
    }

    update() {
        if (!ENV_CLIENT && this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        // 执行一步程序
        if (!ENV_CLIENT && this.isAuto) {
            this.isAuto = this.execStep();
            if (!this.isAuto) { // 结束后处理
                this.props.cooldown = 10;
                this.state.program = null;
            }
        }

        // client根据server状态更新自己状态 repaint
        if (ENV_CLIENT && this.gameObject.peerState) {
            // console.log(this.gameObject.peerState);
            this.state = this.gameObject.peerState;
            this.repaint();
            this.gameObject.peerState = null;
        }
    }

    // 内部某个时刻所处的状态
    setSortState() {
        if (this.cooldown > 0) return;
        this.cooldown += this.props.cooldown;    }

    repaint() {
        // console.log("11111");
        //判断当前是否在客户端（浏览器）运行，如果不是，则将服务器状态设为当前状态
        if (!ENV_CLIENT) {
            // 服务端发送同步信息
            // console.log("2222");
            this.gameObject.serverState = this.state;
        } else {
            //如果是客户端，则循环判断每15个元素是否需要chagecolor
            for (let i = 0; i < 15; ++ i) {
                let changeColor=false;
                console.log('this.program=' + this.program);
                switch (this.state.program) {
                    case 'bubblesort':
                        changeColor=
                            ((i === 14 - this.state.pointer_i || i === this.state.pointer_j) && this.children[i]['changed'] === false)
                            ||
                            ((i !== 14 - this.state.pointer_i && i !== this.state.pointer_j) && this.children[i]['changed'] === true)
                        break;
                    case 'quicksort':
                    case 'insertsort':
                    case 'selectsort':
                        changeColor=
                            ((i === this.state.pointer_i || i === this.state.pointer_j) && this.children[i]['changed'] === false)
                            ||
                            ((i !== this.state.pointer_i && i !== this.state.pointer_j) && this.children[i]['changed'] === true)
                        break;
                    default:
                        break;
                }
                if (this.children[i]['value'] != this.state.content[i] || changeColor) {
                    this.gameObject.remove(this.children[i]);
                    this.children[i] = this.numberPool.obtain(this.state.content[i],
                        changeColor ? !this.children[i]['changed']:false);
                    this.children[i].position.x = i - 7;
                }
            }
        }
    }

    generateRandom() {
        if (this.cooldown > 0) return;
        this.cooldown += this.props.cooldown;

        for (let i = 0; i < 15; ++ i) {
            this.state.content[i] = Math.floor(Math.random() * 199 - 99);
        }
        this.repaint();
    }

    // 模拟执行一段程序
    exec(program) {
        this.program = program;
        this.state.program = program;
        this.isAuto = true;
        // 设置初始状态
        this.props.cooldown = 20;

        switch (this.program) {
            case 'bubblesort':
                this.state.bubble_exchange_flag = false;
                this.state.pointer_i = 0;
                this.state.pointer_j = 0;
                break;
            case 'quicksort':
                this.state.pointerPairStack=[[0,14,0,14]];
                this.state.top = 0;
                this.state.direct= true ;
                break;
            case 'insertsort':
                this.state.pointer_i = 1;
                this.state.pointer_j = 1;
                break;
            case 'selectsort':
                this.state.pointer_i = -1;
                this.state.pointer_j = 0;
                break;
        }
    }

    /**
     * 模拟执行一步
     * @returns {boolean} 是否继续执行
     */
    execStep() {
        if (!(this.isAuto && this.program)) {
            console.warn("execStep failed. isAuto:" + this.isAuto + ", program:" + !!this.program);
            return false;
        }

        switch (this.program) {
            case 'bubblesort':
                return this.bubblesort();
            case 'quicksort':
                return this.quicksort();
            case 'insertsort':
                return this.insertsort();
            case 'selectsort':
                return this.selectsort();
            default:
                return false;
        }

    }

    bubblesort() {
        // 内循环j
        if (this.state.pointer_j === 14 - this.state.pointer_i) {
            // 一趟中没有发生交换 程序终止条件
            if (! this.state.bubble_exchange_flag) {
                return false;
            }
            this.state.pointer_j = 0;
            this.state.bubble_exchange_flag = false;
            // 外循环i 程序终止条件
            if (++ this.state.pointer_i === 14) {
                return false;
            }
        }

        if (this.state.content[this.state.pointer_j] > this.state.content[this.state.pointer_j + 1]) {
            let temp = this.state.content[this.state.pointer_j];
            this.state.content[this.state.pointer_j] = this.state.content[this.state.pointer_j + 1];
            this.state.content[this.state.pointer_j + 1] = temp;
            this.state.bubble_exchange_flag = true;
        }
        ++ this.state.pointer_j;

        this.setSortState();
        return true;
    }

    quicksort() {
        let top=this.state.top;
        let pstack=this.state.pointerPairStack;
        let direct=this.state.direct;
        if(top ==-1)
            return false;

        let h=pstack[top][0]
        let t=pstack[top][1]
        let i=this.state.pointer_i=pstack[top][2];
        let j=this.state.pointer_j=pstack[top][3];
    
        if(i==j){
            --top;
            if (i+1<=t)
                pstack[++top]=[i+1,t,i+1,t];
            if (i-1>=h)
                pstack[++top]=[h,i-1,h,i-1];
        }
        else{
            if(direct){
                if(this.state.content[i]<=this.state.content[j]){
                    pstack[top][3]=--j;
                }
                else{
                    let tmp=this.state.content[j];
                    this.state.content[j]=this.state.content[i];
                    tmp=this.state.content[i]=tmp;
                    pstack[top][2]=++i;
                    direct=false;
                }
            }else{
                if(this.state.content[i]<=this.state.content[j]){
                    pstack[top][2]=++i;
                }
                else{
                    let tmp=this.state.content[j];
                    this.state.content[j]=this.state.content[i];
                    tmp=this.state.content[i]=tmp;
                    pstack[top][3]=--j;
                    direct=true;
                }
            }
        }

        this.state.top=top;
        this.state.direct=direct;
        
        this.setSortState();
        return true;
    }

    insertsort() {
        let i=this.state.pointer_i
        let j=this.state.pointer_j

        if(j==0 || this.state.content[j]>=this.state.content[j-1]){
            if( i+1>14)
                return false;
            ++ this.state.pointer_i;
            this.state.pointer_j=this.state.pointer_i;
        }
        else {
            let tmp=this.state.content[j];
            this.state.content[j]=this.state.content[j-1];
            this.state.content[j-1]=tmp;
            -- this.state.pointer_j
        }

        this.setSortState();
        return true;
    }

    selectsort() {
        ++ this.state.pointer_i;
        if (this.state.pointer_i>14)
            return false;
        let min_val=this.state.content[this.state.pointer_i];
        let min_ind=this.state.pointer_i;
        for(let i=this.state.pointer_i+1;i<=14;i++){
            let num=this.state.content[i];
            if (num<min_val){
                min_val=num;
                min_ind=i;
            }
        }
        
        let tmp=this.state.content[this.state.pointer_i];
        this.state.content[this.state.pointer_i]=min_val;
        this.state.content[min_ind]=tmp;
        this.state.pointer_j=min_ind;

        this.setSortState();
        return true;
    }
}

module.exports = SortController;

// 只用于 ENV_CLIENT
class NumberPool {
    constructor(container) {
        this.blue = 0x7FFFD4;
        this.red = 0xFF0000;
        this.container = container;
        this.normalCubeMaterial = new THREE.MeshLambertMaterial({ color: this.blue });
        this.changedCubeMaterial = new THREE.MeshLambertMaterial({ color: this.red });
        this.cubeGeometry = new THREE.BoxGeometry(0.8, 0.2, 1.2);
    }

    obtain(number, changeFlag = false) {
        let cubeMaterials = changeFlag  ?
        [
            this.changedCubeMaterial,
            this.changedCubeMaterial,
            this.changedCubeMaterial,
            new THREE.MeshLambertMaterial({
                map: new THREE.CanvasTexture(getTextCanvas(number, '#' + this.red.toString(16)))
            }),
            this.changedCubeMaterial,
            this.changedCubeMaterial,
        ] : [
            this.normalCubeMaterial,
            this.normalCubeMaterial,
            this.normalCubeMaterial,
            new THREE.MeshLambertMaterial({
                map: new THREE.CanvasTexture(getTextCanvas(number, '#' + this.blue.toString(16)))
            }),
            this.normalCubeMaterial,
            this.normalCubeMaterial,
        ];

        let cube = new THREE.Mesh(this.cubeGeometry, cubeMaterials);
        cube.position.set(0, 0.5, 0);
        cube.rotation.set(4.1888, 0, 0);

        let cubeObject = new GameObject(cube);
        cubeObject['value'] = number;
        cubeObject['changed'] = changeFlag;
        this.container.add(cubeObject);
        return cubeObject;

        function getTextCanvas(text, blockColor) {
            let width=60 * 1.5, height=100 * 1.5;
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            ctx.fillStyle = blockColor;
            ctx.fillRect(0, 0, width, height);
            ctx.font = 50 + 'px " bold';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width/2,height/2);
            return canvas;
        }
    }

}
