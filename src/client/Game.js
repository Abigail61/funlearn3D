const Renderer = require('./Renderer');
const BaseGame = require('../common/BaseGame');
const SceneHelper = require('./SceneHelper');

const REVOLUTION_SPEED_FOR_EARTH = 0.02;
const SELF_REVOLUTION_SPEED_FOR_EARTH = 0.10;


class Game extends BaseGame {

    constructor() {
        super();

        /**
         * 真实 fps （平均）
         * @type {number}
         */
        this.fps = 60;

        /**
         * 真实 fps （一秒内）
         * @type {number}
         */
        this.framesThisSecond = 0;

        /**
         * 上次更新 fps 的时间
         * @type {number}
         * @private
         */
        this.lastFPSUpdate = 0;

        /**
         * 游戏渲染器
         * @type {Renderer}
         */
        this.renderer = new Renderer();

        /**
         * 额外的信息
         * 例如太阳系 有各天体数据
         * @type {undefined}
         */
        this.data = undefined;
    }

    /**
     * start the main loop
     */
    start(data) {
        super.start();

        if (data !== undefined) {
            this.data = data;
        }

        // console.log('before initTrackballControls()');
        // console.log('renderer is null?', this.renderer._renderer == undefined);
        // console.log('camera is null?', this.scene._camera == undefined);
        this.trackballControls = SceneHelper.initTrackballControls(this.scene._camera, this.renderer._renderer);
        // console.log('after initTrackballControls()');

        this.raf = requestAnimationFrame((timestamp) => {
            // 初始化变量
            this.lastFrameTime = timestamp;
            this.lastFPSUpdate = timestamp;
            this.framesThisSecond = 0;

            //this.renderer = new Renderer();
            this.raf = requestAnimationFrame(this.loop.bind(this));
        });

        if (this.data !== undefined) {
            this.revolutionSpeeds = this.initRevolutionSpeed();
            this.selfRevolutionSpeeds = this.initSelfRevolutionSpeed();
            console.log(this.revolutionSpeeds);
            console.log(this.selfRevolutionSpeeds);
        }
    }

    /**
     * stop the main loop
     */
    stop() {
        cancelAnimationFrame(this.raf);
        super.stop();
    }

    /**
     * the game loop
     * @param timestamp 调用时刻时间戳
     */
    loop(timestamp) {
        // 在开始时立即设置下一次循环，这样可以在本次 update 中取消下一帧执行
        this.raf = requestAnimationFrame(this.loop.bind(this));


        // 控制帧率，不让循环过快调用
        // fps+1 :否则因为太过接近，导致虽然调用都是 16ms，但一半被扔掉了
        if (timestamp < this.lastFrameTime + 1000 / (this.maxFPS + 1)) {
            return;
        }

        // 计算尚未被模拟的时间
        this.delta += timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;


        if (timestamp > this.lastFPSUpdate + 1000) {
            // 计算 FPS
            this.fps = 0.25 * this.framesThisSecond + 0.75 * this.fps;
            this.lastFPSUpdate = timestamp;
            this.framesThisSecond = 0;
        }
        this.framesThisSecond++;

        // 根据尚未被模拟的时间，分次模拟游戏状态更新
        // 防止帧率低时单帧时间长，造成穿墙、浮点误差造成各端状态不一致等问题
        let updateTimes = 0;
        while (this.delta >= this.updateTimeStep) {
            this.update(this.updateTimeStep);
            this.delta -= this.updateTimeStep;
            // 记录单次循环调用 update() 的次数
            // 如果次数太大，说明单帧耗时过久，需要处理
            // 虽然，大多数时候掉帧会更早出现
            if (++updateTimes >= 240) {
                this.panic();
                break;
            }
        }

        // console.log('this.data !== undefined?', this.data !== undefined);
        if (this.data !== undefined) {
            // let sunObject = this.scene.getObjectByName('SunRevolutionGroup');
            // sunObject._obj3d.rotation.y += 0.05;

            // let saturnRevolutionGroupObject = this.scene.getObjectByName('JupiterRevolutionGroup');
            // let saturnSelfRevolutionGroupObject = this.scene.getObjectByName('JupiterSelfRevolutionGroup');
            //
            // saturnRevolutionGroupObject._obj3d.rotation.y += 0.01;
            // saturnSelfRevolutionGroupObject._obj3d.rotation.y -= 0.03;

            this.data.forEach((value, key, map) => {
                let revolutionGroupObject = this.scene.getObjectByName(key + 'RevolutionGroup');
                let selfRevolutionGroupObject = this.scene.getObjectByName(key + 'SelfRevolutionGroup');

                revolutionGroupObject._obj3d.rotation.y += this.revolutionSpeeds.get(key);
                selfRevolutionGroupObject._obj3d.rotation.y += this.selfRevolutionSpeeds.get(key);
            });
        }


        // console.log('trackballControls.update(' + (this.delta / 1000) + ')');
        this.trackballControls.update(this.delta / 1000);

        // console.log('render()');
        this.render();
    }

    /**
     * render screen
     */
    render() {
        this.renderer.render(this.scene);
        //document.getElementById("fps").innerText = this.fps.toFixed(2) + " FPS";
    }

    /**
     * on game run too slowly
     */
    panic() {
        console.warn("WARNING: panic!");
        // 丢弃未模拟的时间，等待下次权威服务器同步
        this.delta = 0;
    }

    // network
    onPlayerState(state) {
        //console.log(state);
        this.scene.serverState = state;
    }


    initSelfRevolutionSpeed(data) {
        let speeds = new Map();
        this.data.forEach((value, key, map) => {
            speeds.set(key, SELF_REVOLUTION_SPEED_FOR_EARTH / value.get('selfrevolution_cycle'));
        });
        return speeds;
    }

    initRevolutionSpeed(data) {
        let speeds = new Map();
        this.data.forEach((value, key, map) => {
            if (value.get('revolution_cycle') == 0) {
                speeds.set(key, 0);
            } else {
                speeds.set(key, REVOLUTION_SPEED_FOR_EARTH / value.get('revolution_cycle'));
            }
        });
        return speeds;
    }
}

module.exports = Game;