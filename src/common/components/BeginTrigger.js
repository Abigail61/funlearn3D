const Component = require('../Component');
const MachineController = require('./MachineController');
const ENV_CLIENT = !(typeof window === 'undefined');
const Input = require('../../client/Input');
/**
 * 按钮触发器
 * 服务端权威判断按钮是否被触发
 * 客户端同步状态
 */
@Component.serializedName('BeginTrigger')
class BeginTrigger extends Component {

    constructor() {
        super();
        //triggerRadius 触发半径
        this.props.triggerRadius = 0.3;
        //高度
        this.props.selfHeight = 0.08;
        //this.authPlayers = [];  // gameobjs // 暂时
        this.cooldown;  // 按钮冷却时间

    }

    start() {
        this.isTrigger = false;
        //this.authPlayers = [];  // gameobjs
    }
//在 update() 函数中，会遍历当前场景中的所有在线玩家，并检查它们的位置。
//如果某个玩家的水平位置（x 坐标和 z 坐标）与该组件的位置相差不超过 props.triggerRadius，
//则会调用 setTrigger(true) 来将 isTrigger 变量设置为 true。
    update() {
        for (let i = 0, len = this.gameObject.scene.onlinePlayers.length; i < len; i++) {
            let pp = this.gameObject.scene.onlinePlayers[i].position;  // player position
            if (Math.abs(pp.x - this.gameObject.position.x) <= this.props.triggerRadius &&
                Math.abs(pp.z - this.gameObject.position.z) <= this.props.triggerRadius){
                if(!this.cooldown){//如果没有冷却时间
                    this.setTrigger(true);//启动按钮，按钮进入冷却期
                    //设置冷却时间
                    this.cooldown = true;
                    this.gameObject.position.y -= this.props.selfHeight;
                    setTimeout(()=>{
                        this.cooldown = false;
                        this.setTrigger(false);
                    },5000);

                }
                return;
            }
        }
       // this.setTrigger(false,false);
    }

    setTrigger(isTrigger) {
        if (isTrigger === this.isTrigger) return;
        this.isTrigger = isTrigger;
        if (isTrigger) {
            this.broadcast("onTriggerEnter");
        }
        else {
            this.broadcast("onTriggerExit");
            this.gameObject.position.y += this.props.selfHeight;
        }
    }

}

module.exports = BeginTrigger;