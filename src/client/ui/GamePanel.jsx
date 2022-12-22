const React = require('react');
const Client = require('../Client');
const Event = require('../../common/Event');

class GamePanel extends React.Component {

    /**
     * 客户端游戏开始时调用
     */
    componentDidMount() {
        // 处理 dom 事件
        this.onWindowResize();
        this.mount.appendChild(this.props.game.renderer.domElement);
        addWindowResizeListener(this.onWindowResize.bind(this));

        console.log('room_type:', this.props.room_type);
        // console.log('props:', this.props);

        if (this.props.room_type === 1 || this.props.room_type === 2 || this.props.room_type === 4) {
            // 处理 pointer lock
            this.instruction.addEventListener('click', () => {
                console.log('GamePanel.jsx clickListener');
                this.instruction.style.display = 'none';
                requestPointerLock();
            }, false);
            this.onPointerLockChange = this.onPointerLockChange.bind(this);
            document.addEventListener('pointerlockchange', this.onPointerLockChange, false);
        } else if (this.props.room_type === 3) {
            this.instruction.style.display = 'none';
        }


        // 订阅服务端的消息
        Client.current.subscribe(Event.SERVER_SPAWN, (data) => {
            console.log('GamePanel.jsx componentDidMount() subscribe(server_spawn)');
            if (data.ext2) {    // spawn other player
                // TODO 未验证data.prefab 可能出错
                require('../SceneHelper').createOtherPlayer(this.props.game.scene, data.id, data.ext2, data.prefab);
            } else {
                this.props.game.scene.spawn(data.prefab).networkId = data.id;
            }
        });
        Client.current.subscribe(Event.SERVER_SEND_STATE, (data) => {
            //console.log(data);
            this.props.game.onPlayerState(JSON.parse(data));
        });
        Client.current.subscribe(Event.SERVER_DESTROY, (data) => {
            let playerObj = this.props.game.scene.getObjectByProperty('networkId', data.networkId);
            this.props.game.scene.remove(playerObj);
        });
    }

    componentWillUnmount() {
        this.mount.removeChild(this.props.game.renderer.domElement);
        removeWindowResizeListener(this.onWindowResize.bind(this));
        if (this.props.room_type === 1 || this.props.room_type === 2) {
            document.removeEventListener('pointerlockchange', this.onPointerLockChange, false);
        }  else if (this.props.room_type === 3) {

        }
    }

    onWindowResize() {
        const width = this.mount.clientWidth;
        const height = this.mount.clientHeight;
        this.props.game.renderer.onWindowResize(width, height);
        this.props.game.scene._camera.aspect = width / height;
        this.props.game.scene._camera.updateProjectionMatrix();
    }

    onPointerLockChange() {
        if (getPointerLockElement() === document.body) {
            this.instruction.style.display = 'none';
        } else {
            this.instruction.style.display = 'flex';
        }
    }

    render() {
        return (
            <div
                style={{position: 'absolute', bottom: 0, top: '64px', left: 0, right: 0}}
                ref={(mount) => { this.mount = mount }} id={'gamePanel'}> {
                    <div style={{position: 'absolute', background: 'rgba(0,0,0,0.5)',
                        width: '100%', height: '100%', color: '#fff', textAlign: 'center',
                        display: 'flex', alignItems: 'center'}}
                         ref={(mount) => { this.instruction = mount }}>
                        <span style={{width: '100%', cursor: 'pointer'}}>START开始<br/>鼠标移动控制视角，WASD移动，按回车对话</span>
                    </div>
                }
                <div style={{display: 'flex', flexDirection: 'column-reverse', width: 200, height: 100,
                    position: 'absolute', left: 10, bottom: 40}} id={'chatPanel'}>
                </div>
                <input type="text" id={'chatInput'} style={{position: 'absolute', left: 10, bottom: 10,
                    backgroundColor: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)', color: 'white'}} />
            </div>
        )
    }
}

module.exports = GamePanel;
