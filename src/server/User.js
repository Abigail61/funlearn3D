const uuid = require('uuid/v1');
const SHA256 = require("crypto-js/sha256");
const mysql = require('mysql');
//const connection = mysql.createConnection('mysql://root@localhost:3306/project');
let connection = mysql.createConnection({
	host : '127.0.0.1',
	user : 'root',
	password: '123456',
	port : '3306',
	//云上的数据库
	//port :'33333',
	database : 'project'
});

module.exports = {

    new: function(username, password) {
        return new Promise((resolve, reject) => {
            getUser(username).then((user) => {
                if (user) {
                    reject({message: '用户名已被占用！'});
                    return;
                }

                let salt = uuid();
                let data = {
                    username: username,
                    nickname: username,
                    salt: salt,
                    password: SHA256(SHA256(password) + salt).toString()
                };
                connection.query('INSERT INTO users SET ?', data, (error, results) => {
                    error ? reject(error) : resolve(results);
                });
            });

        });
    },

    validate: function(username, password) {
        return new Promise((resolve, reject) => {
            getUser(username).then((data) => {
                if (data) {
                    console.log(password, data);
                    let userPw = SHA256(SHA256(password) + data.salt).toString();
                    userPw === data.password ? resolve() : reject();
                } else {
                    reject();
                }
            });
        });
    }
};

function getUser(username) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
            error ? reject(error) : resolve(results[0]);
        });
    });
}