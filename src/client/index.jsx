const React = require('react');
const ReactDOM = require('react-dom');
const MuiThemeProvider = require('material-ui/styles/MuiThemeProvider')['default'];
const TitleBar = require('./ui/TitleBar.js');
const RoomList = require('./ui/RoomList.js');
const CreateRoomButton = require('./ui/CreateRoomButton.js');
const LoginPanel = require('./ui/LoginPanel.js');
const GamePanel = require('./ui/GamePanel.js');
const Client = require('./Client');
const Game = require('./Game');
const SceneHelper = require('./SceneHelper');
const loadScene = require('../common/loadScene');
const GameConfig = require('../common/GameConfig');
const GameObject = require('../common/GameObject');
const Path = require('path');
const fs =  require('fs');

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            login: false,
            username: '',
            room: null,
            progress: 0   // 加载进度
        };
        this.onLogin.bind(this);
        this.onLogout.bind(this);
        this.onLeaveRoom.bind(this);
    }

    onLogin(data) {
        Client.init(data.token);
        this.setState({login: true, username: data.username});
        console.log('check index.jsx onLogin');
        console.log(this);
    }

    onLogout() {
        Client.current.logout();
        this.setState({login: false, username: '', room: null});
    }

    onJoinRoom(room) {
        // 同时生成renderer
        this.game = new Game();
        this.setState({room: room, progress: 0});

        let sceneName = GameConfig.GAME_TYPE[room.type];
        if (!sceneName) {
            console.log('lxp', GameConfig.GAME_TYPE);
            throw new TypeError('no this game type: ' + room.type);
        }

        let playerType;
        if (room.type === 1 || room.type === 2 || room.type === 4) {
            playerType = 'player';
        } else if (room.type === 3) {
            playerType = 'lxp';
        } else {
            throw new TypeError('No this type ' + room.type);
        }
        this.room_type = room.type;

        console.log('index.jsx onJoinRoom resource.loadScene()');
        console.log(this);
        require('../common/Resource').loadScene(sceneName).then(scene => {

            if (room.type === 1 || room.type === 2 || room.type === 4) {
                SceneHelper.createSkyBox(scene, ['images/galaxy+X.jpg', 'images/galaxy-X.jpg', 'images/galaxy+Y.jpg',
                    'images/galaxy-Y.jpg', 'images/galaxy-Z.jpg', 'images/galaxy+Z.jpg'], 75);

                // 生成自身 同时生成camera
                SceneHelper.createSelfPlayer(scene, playerType);
                // 其余玩家
                room.existPlayers.forEach((data) => SceneHelper.createOtherPlayer(scene, data.networkId, data.name, playerType));

                this.game.scene = scene;
                this.game.start();
                this.setState({progress: 100});

            } else if (room.type === 3) {
                const MILKY_WAY_SIZE = 15000;

                // 环的信息
                let ringConfig = new Map();
                ringConfig.set('Saturn', [1.1, 3, 'jpg']);
                ringConfig.set('Uranus', [1.25, 3, 'png']);

                // 读取配置文件
                const configLoader = new THREE.FileLoader();
                configLoader.oldLoad = configLoader.load;
                configLoader.load = function (path, callback) {
                    configLoader.oldLoad(path, (data) => {
                        callback(data);
                    });
                };

                // 材质 纹理加载器
                const loader = new THREE.TextureLoader();

                loader.load('images/solar-system/milky-way.jpg', (texture) => {
                    console.log('load texture success');
                    //the Milky Way
                    let milkyMaterial = new THREE.MeshBasicMaterial({
                        map: texture,
                        side: THREE.DoubleSide
                    });
                    let milkyWay = new THREE.Mesh(new THREE.SphereGeometry(MILKY_WAY_SIZE, 35, 35), milkyMaterial);
                    scene._scene.add(milkyWay);
                });

                // ambient light
                scene._scene.add(new THREE.AmbientLight(0x222222));

                // sunlight
                let light = new THREE.PointLight(0xffffff, 1, 0);
                light.position.set(0, 0, 0);
                scene._scene.add(light);

                configLoader.load('data/stars.csv', (data) => {
                    let starsConfig = new Map();
                    let lines = data.trimEnd().split('\n');
                    let items = lines[0].trim().split(',');
                    for (let line of lines.slice(1)) {
                        let values = line.trim().split(',');

                        let this_star = new Map();
                        for (let i = 0; i < items.length; ++i) {
                            this_star.set(items[i], values[i]);
                        }
                        starsConfig.set(values[0], this_star);
                    }
                    // console.log(stars);

                    starsConfig.forEach((value, key, map) => {
                        // 画出轨道
                        let orbitMaterial = new THREE.LineBasicMaterial({
                            color: 0x666666,
                            opacity: 0.5
                        });
                        let orbitGeometry = new THREE.CircleGeometry(value.get('draw_distance'), 200, 0, 2 * Math.PI);
                        // 去掉圆环中的点
                        orbitGeometry.vertices.shift();
                        let orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
                        orbit.rotation.x = 90 / 180 * Math.PI;
                        scene._scene.add(orbit);


                        // 保存自转与公转组
                        let revolutionGroup = new THREE.Group();
                        revolutionGroup.name = key + 'RevolutionGroup';
                        let selfRevolutionGroup = new THREE.Group();
                        selfRevolutionGroup.name = key + 'SelfRevolutionGroup';

                        scene.add(new GameObject(revolutionGroup));
                        scene.add(new GameObject(selfRevolutionGroup));


                        loader.load('images/solar-system/' + key + '.jpg', function (texture) {
                            let geometry = new THREE.SphereBufferGeometry(value.get('draw_radius'), 20, 20);
                            let material;
                            if (key == "Sun") {
                                material = new THREE.MeshBasicMaterial({
                                    map: texture,
                                    side: THREE.DoubleSide
                                });
                            } else {
                                material = new THREE.MeshLambertMaterial({
                                    map: texture,
                                    shading: THREE.SmoothShading
                                });
                            }
                            // console.log(key);

                            let this_star = new THREE.Mesh(geometry, material);
                            this_star.name = key;

                            let randomAngle = SceneHelper.getRandomArbitrary(0, 360) / 180 * Math.PI;
                            selfRevolutionGroup.position.x = value.get('draw_distance') * Math.cos(randomAngle);
                            selfRevolutionGroup.position.z = value.get('draw_distance') * Math.sin(randomAngle);
                            selfRevolutionGroup.rotation.x = value.get('obliquity') * Math.PI / 180;
                            selfRevolutionGroup.add(this_star);

                            revolutionGroup.add(selfRevolutionGroup);

                            // this_star.position.x = value.get('draw_distance') * Math.cos(randomAngle);
                            // this_star.position.z = value.get('draw_distance') * Math.sin(randomAngle);
                            // //- value.distance * scaling_distance;
                            // this_star.rotation.x = value.get('obliquity') * Math.PI / 180;
                            //
                            // // scene._scene.add(this_star)
                            // scene.add(new GameObject(this_star));

                            if (ringConfig.has(key)) {
                                loader.load('images/solar-system/' + key + '-Ring.' + ringConfig.get(key)[2], (texture) => {
                                    let ringMaterial = new THREE.MeshLambertMaterial({
                                        map: texture,
                                        shading: THREE.SmoothShading,
                                        side: THREE.DoubleSide
                                    });

                                    let ringGeometry = new THREE.RingBufferGeometry(
                                        starsConfig.get(key).get('draw_radius') * ringConfig.get(key)[0],
                                        starsConfig.get(key).get('draw_radius') * ringConfig.get(key)[1],
                                        30);

                                    let uvs = ringGeometry.attributes.uv.array;
                                    let phiSegments = ringGeometry.parameters.phiSegments || 0;
                                    let thetaSegments = ringGeometry.parameters.thetaSegments || 0;
                                    phiSegments = phiSegments !== undefined ? Math.max( 1, phiSegments ) : 1;
                                    thetaSegments = thetaSegments !== undefined ? Math.max( 3, thetaSegments ) : 8;
                                    for ( let c = 0, j = 0; j <= phiSegments; j ++ ) {
                                        for ( let i = 0; i <= thetaSegments; i ++ ) {
                                            uvs[c++] = i / thetaSegments;
                                            uvs[c++] = j / phiSegments;
                                        }
                                    }

                                    let ring = new THREE.Mesh(ringGeometry, ringMaterial);
                                    ring.rotation.x = 90 * Math.PI / 180;

                                    this_star.add(ring);
                                });
                            }
                        });

                    });


                    // 生成自身 同时生成camera
                    SceneHelper.createSelfPlayer(scene, playerType);
                    // 其余玩家
                    room.existPlayers.forEach((data) => SceneHelper.createOtherPlayer(scene, data.networkId, data.name, playerType));

                    this.game.scene = scene;
                    this.game.start(starsConfig);
                    this.setState({progress: 100});
                });
            }
        });
    }

    onLeaveRoom(data) {
        this.setState({room: null});
        if (data === 0) {
            this.game = null;
            console.log(this);
        }

    }

    render() {
        return (
            <MuiThemeProvider>
                <div>
                    <TitleBar user={this.state} onLogout={this.onLogout.bind(this)} onLeaveRoom={this.onLeaveRoom.bind(this)}/>
                    { this.state.login ?
                        ( this.state.room ?
                            ( this.state.progress < 100 ? <p>loading</p>
                                : <GamePanel game={this.game} room_type={this.room_type} /> )
                            : <RoomList onJoinRoom={this.onJoinRoom.bind(this)} /> )
                        : <LoginPanel onLogin={this.onLogin.bind(this)}/> }
                    { this.state.room ? null : <CreateRoomButton onJoinRoom={this.onJoinRoom.bind(this)}/> }
                </div>
            </MuiThemeProvider>
        );
    }
}

ReactDOM.render(<App/>, document.body);
