const React = require('react');
const AppBar = require('material-ui/AppBar')['default'];
const Button = require("material-ui/FlatButton")['default'];
const Popover = require("material-ui/Popover")['default'];
const Menu = require("material-ui/Menu")['default'];
const MenuItem = require("material-ui/MenuItem")['default'];
const Client = require('../Client');

class TitleBar extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <AppBar
                title={'教学平台'}
                showMenuIconButton={false}
                iconElementRight={<Info user={this.props.user} onLogout={this.props.onLogout} onLeaveRoom={this.props.onLeaveRoom}/>}
            />
        );
    }
}

class Info extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        };
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleLeaveRoom = this.handleLeaveRoom.bind(this);
    }
    handleClick(event) {
        event.preventDefault();
        this.setState({open: true, anchorEl: event.currentTarget});
    };

    handleClose() {
        this.setState({open: false});
    };

    handleLeaveRoom(){
        this.handleClose();
        Client.current.leaveRoom((data) => {
            this.props.onLeaveRoom(data);
        });
    }

    render() {
        const { anchorEl } = this.state;
        if (!this.props.user.login) return null;
        return (
            <div style={{display: 'flex'}}>
                <p style={{color: 'white', marginRight: '7px'}}>Hello,&nbsp;{this.props.user.username}!</p>
                <Button
                    label={'选'}
                    style={{color: 'white', marginTop: '7px'}}
                    onClick={this.handleClick}>
                </Button>
                <Popover
                    open={this.state.open}
                    anchorEl={this.state.anchorEl}
                    // anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
                    // targetOrigin={{horizontal: 'left', vertical: 'top'}}
                    onRequestClose={this.handleClose}>
                    <Menu>
                        <MenuItem onClick={this.handleLeaveRoom}>退出房间</MenuItem>
                    </Menu>
                    <Menu>
                        <MenuItem onClick={this.props.onLogout}>登出</MenuItem>
                    </Menu>

                </Popover>
            </div>
        );
    }
}

module.exports = TitleBar;