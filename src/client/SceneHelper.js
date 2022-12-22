const Synchronizer = require('../common/components/Synchronizer');
const FirstPersonController = require('../common/components/FirstPersonController');
const MouseControlRotation = require('../common/components/MouseControlRotation');
const GameObject = require('../common/GameObject');
const Client = require('./Client');

const THREE = require('three');
const TrackballControls = require('../common/TrackballControls');

module.exports = {

    createSelfPlayer: function (scene, playerType) {
        let me = scene.spawn(playerType);
        me.networkId = Client.current.socket.id;

        if (playerType === 'player') {
            // TODO 这里都是加载缓存
            me.getComponent(Synchronizer).isLocalPlayer = true;
            me.addComponent(new FirstPersonController());
            me.add(createMouseControlCamera());
        } else if (playerType === 'lxp') {
            // me.add(createMouseControlCamera());
            me.add(createSolarSystemCamera());
        }


        //const StepTrigger = require('../common/components/StepTrigger');
        /*scene.getObjectByName('btn0').getComponent(StepTrigger).authPlayers.push(me);
        scene.getObjectByName('btn1').getComponent(StepTrigger).authPlayers.push(me);
        scene.getObjectByName('moveLeft').getComponent(StepTrigger).authPlayers.push(me);
        scene.getObjectByName('moveRight').getComponent(StepTrigger).authPlayers.push(me);
        scene.getObjectByName('btne').getComponent(StepTrigger).authPlayers.push(me);*/
        scene.onlinePlayers.push(me);
    },

    createOtherPlayer: function (scene, networkId, name, playerType) {
        let other = scene.spawn(playerType);
        other.networkId = networkId;
        if (playerType === 'player') {
            other._obj3d.add(createSpriteText(name));
        }
    },

    createSkyBox: function (scene, urls, size) {
        let skyboxCubemap = new THREE.CubeTextureLoader().load(urls);
        skyboxCubemap.format = THREE.RGBFormat;

        let skyboxShader = THREE.ShaderLib['cube'];
        skyboxShader.uniforms['tCube'].value = skyboxCubemap;

        scene._scene.add(new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.ShaderMaterial({
                fragmentShader : skyboxShader.fragmentShader,
                vertexShader : skyboxShader.vertexShader,
                uniforms : skyboxShader.uniforms,
                depthWrite : false,
                side : THREE.BackSide
            })
        ));
    },

    

    initTrackballControls: function (camera, renderer) {
        // console.log('before trackballControls constructor');
        // console.log('renderer.domElement is null?', renderer.domElement == undefined);
        // console.log('camera =', camera);
        // console.log('camera.position =', camera.position);
        let trackballControls = new TrackballControls.TrackballControls(camera, renderer.domElement);
        // console.log('after trackballControls constructor');
        trackballControls.rotateSpeed = 1.0;
        trackballControls.zoomSpeed = 1.2;
        trackballControls.panSpeed = 0.8;
        trackballControls.noZoom = false;
        trackballControls.noPan = false;
        trackballControls.staticMoving = true;
        trackballControls.dynamicDampingFactor = 0.3;
        trackballControls.keys = [65, 83, 68];

        return trackballControls;
    },

    getRandomArbitrary: function (min, max) {
        return Math.random() * (max - min) + min;
    }

};

// TODO 在这里建立camera
function createMouseControlCamera() {
    let camera = new THREE.PerspectiveCamera(75, /*window.innerWidth / window.innerHeight - 64*/1, 0.1, 1000);
    camera.position.y = 2.5;
    camera.position.z = 8;
    let pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    camera.name = 'camera';
    //camera.lookAt(0, 0, -4);
    let pitch = new GameObject(new THREE.Object3D());
    pitch.add(new GameObject(camera));
    let yaw = new GameObject(new THREE.Object3D());
    yaw.name = 'yaw';
    pitch.name = 'pitch';
    yaw.add(pitch);

    let mouseControlObj = yaw;
    mouseControlObj.addComponent(new MouseControlRotation());
    return mouseControlObj;
}

function createSolarSystemCamera(scene) {
    //设置相机为 角度60度，宽高比，最近端Z轴为1,最远端Z轴为10000
    let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);

    camera.position.z = 2000;   //调整相机位置
    camera.position.y = 500;
    camera.lookAt(0, 0, 0);

    camera.name = 'solarsystemcamera';
    return new GameObject(camera);
}

function createSpriteText(text) {
    //先用画布将文字画出
    let canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 128;
    //let canvas = createHiDPICanvas(256, 128);
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.font = "Bold 60px Arial";
    let textWidth = ctx.measureText(text).width;
    ctx.fillText(text, (canvas.width/2) - (textWidth / 2), canvas.height / 2);

    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    //使用Sprite显示文字
    let material = new THREE.SpriteMaterial({map:texture});
    let textObj = new THREE.Sprite(material);
    //textObj.scale.set(0.5 * 100, 0.25 * 100, 0.75 * 100);
    textObj.position.y = 1.4;
    //console.log(textObj);
    return textObj;
}
