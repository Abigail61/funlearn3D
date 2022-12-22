const Component = require('../Component');
const SortController = require('./SortController');
const ENV_CLIENT = !(typeof window === 'undefined');

@Component.serializedName("SortTrigger")
class SortTrigger extends Component {

    constructor() {
        super();

        this.props.triggerType = 0;
    }

    start() {
        this.sortController = this.gameObject.scene.getObjectByName('Sort').getComponent(SortController);
    }

    onReceive(sender, ...args) {
        this[args[0]]();
    }

    onTriggerEnter() {
        if (ENV_CLIENT) {
            if (this.props.triggerType === 5) {
                SortTrigger.getClientIntro().innerText = sortIntro;
                SortTrigger.getClientIntro().style.display = 'block';
            }
        } else {
            // server
            if (this.sortController.isAuto) return;
            switch (this.props.triggerType) {
                case 0:
                    console.log("产生随机数");
                    this.sortController.generateRandom();
                    break;
                case 1:
                    console.log("冒泡排序");
                    this.sortController.exec("bubblesort");
                    break;
                case 2:
                    console.log("快速排序");
                    this.sortController.exec("quicksort");
                    break;
                case 3:
                    console.log("插入排序");
                    this.sortController.exec("insertsort");
                    break;
                case 4:
                    console.log("选择排序");
                    this.sortController.exec("selectsort");
                    break;
                case 5:
                    console.log("显示提示");
                    break;
            }
        }
    }

    onTriggerExit() {
        if (ENV_CLIENT) {
            SortTrigger.getClientIntro().style.display = 'none';
        }
    }

    // static getClientIntro() {
    //     if (!SortTrigger.clientIntro) {
    //         SortTrigger.clientIntro = document.createElement('div');
    //         SortTrigger.clientIntro.style.position = 'absolute';
    //         SortTrigger.clientIntro.style.top = '10px';
    //         SortTrigger.clientIntro.style.left = '10px';
    //         SortTrigger.clientIntro.style.width = '200px';
    //         SortTrigger.clientIntro.style.color = 'white';
    //         SortTrigger.clientIntro.style.display = 'none';
    //         document.getElementById('gamePanel').appendChild(SortTrigger.clientIntro);
    //     }
    //     return SortTrigger.clientIntro;
    // }
    static getClientIntro() {
        if (!SortTrigger.clientIntro) {
            SortTrigger.clientIntro = document.createElement('div');
            SortTrigger.clientIntro.style.position = 'absolute';
            SortTrigger.clientIntro.style.height = '190px';
            SortTrigger.clientIntro.style.width = '310px';
            SortTrigger.clientIntro.style.left = '37.5%';
            SortTrigger.clientIntro.style.top = '5%';
            SortTrigger.clientIntro.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            //SortTrigger.clientIntro.style.transform = translate('-50%','-30%');
            //SortTrigger.clientIntro.style.top = '10px';
            //SortTrigger.clientIntro.style.left = '10px';

            SortTrigger.clientIntro.style.color = 'white';
            SortTrigger.clientIntro.style.display = 'none';
            document.getElementById('gamePanel').appendChild(SortTrigger.clientIntro);
        }
        return SortTrigger.clientIntro;
    }
}

module.exports = SortTrigger;

const sortIntro = "【排序】\n" +
    "排序的演示\n" +
    "从左到右分别为\n" +
    "冒泡排序\n" +
    "快速排序\n" +
    "插入排序\n" +
    "选择排序\n" +
    "中间为生成-99 ~ 99的随机数";