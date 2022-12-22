const Component = require('../Component');
const MachineController = require('./MachineController');
const ENV_CLIENT = !(typeof window === 'undefined');

@Component.serializedName("MachineTrigger")
class MachineTrigger extends Component {

    constructor() {
        super();

        this.props.triggerType = 0;
    }

    start() {
        this.machineController = this.gameObject.scene.getObjectByName('TuringMachine').getComponent(MachineController);
    }

    onReceive(sender, ...args) {
        this[args[0]]();
    }

    onTriggerEnter() {
        if (ENV_CLIENT) {
            if (this.props.triggerType === 6) {
                MachineTrigger.getClientIntro().innerText = xorIntro;
                MachineTrigger.getClientIntro().style.display = 'block';
            }
        } else {
            // server
            if (this.machineController.isAuto) return;
            switch (this.props.triggerType) {
                case 0:
                    this.machineController.setChar('0');
                    break;
                case 1:
                    this.machineController.setChar('1');
                    break;
                case 2:
                    this.machineController.moveLeft();
                    break;
                case 3:
                    this.machineController.moveRight();
                    break;
                case 4:
                    this.machineController.setChar('e');
                    //this.machineController.exec(xorProgram);
                    break;
                case 5:
                    this.machineController.exec(xorProgram);
                    break;
            }
        }
    }

    onTriggerExit() {
        if (ENV_CLIENT) {
            MachineTrigger.getClientIntro().style.display = 'none';
        }
    }

    //设置客户端的游戏提示
    static getClientIntro() {
        if (!MachineTrigger.clientIntro) {
            MachineTrigger.clientIntro = document.createElement('div');
            MachineTrigger.clientIntro.style.position = 'absolute';
            MachineTrigger.clientIntro.style.height = '190px';
            MachineTrigger.clientIntro.style.width = '310px';
            MachineTrigger.clientIntro.style.left = '37.5%';
            MachineTrigger.clientIntro.style.top = '5%';
            MachineTrigger.clientIntro.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            //MachineTrigger.clientIntro.style.transform = translate('-50%','-30%');
            //MachineTrigger.clientIntro.style.top = '10px';
            //MachineTrigger.clientIntro.style.left = '10px';

            MachineTrigger.clientIntro.style.color = 'white';
            MachineTrigger.clientIntro.style.display = 'none';
            document.getElementById('gamePanel').appendChild(MachineTrigger.clientIntro);
        }
        return MachineTrigger.clientIntro;
    }
}

module.exports = MachineTrigger;

const xorProgram = {
    "title": "按位取反",
    "description": "二进制数按位取反。请把指针头指向最右边的数字。",
    "commands": {
        "start": {
            "0": ["start", "1", "<"],
            "1": ["start", "0", "<"]
        }
    }
};


const xorIntro = "【按位取反】\n" +
    "通过按钮操作，将完成二进制数按位取反\n" +
    "\n" +
    "(1)通过控制< > 按钮左右移动\n"+
    "(2)通过控制0 1 按钮进行输入\n" +
    "(3)将数字输入完成后，调整<>将绿色箭头对准最右边的数字\n"+
    "(4)按下右边的按钮，开始执行"


