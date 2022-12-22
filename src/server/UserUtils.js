const uuid = require('uuid/v1');
const SHA256 = require("crypto-js/sha256");
const mysql = require('mysql');
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: '3306',
    database: 'project'
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
                    // 该用户在数据库中存在
                    // console.log(password, data);
                    let userPw = SHA256(SHA256(password) + data.salt).toString();
                    // 密码是否相同
                    userPw === data.password ? resolve() : reject();
                } else {
                    // 未注册
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