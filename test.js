// const mysql = require('mysql');
// const config = {
//     host: 'lxp.ink',
//     user: 'root',
//     password: '1169979871',
//     port: '3306',
//     database: 'project'
// };
//
// let connection = mysql.createConnection(config);
//
// connection.query('SELECT id, nickname FROM users WHERE ?', ['username=wefawfew'], (error, results) => {
//     if (error) {
//         console.log('error', error);
//     } else {
//         console.log('results', results[0]);
//         console.log('typeof results', typeof results);
//     }
// });
//
// connection.end();
const fs = require("fs");
let data = fs.readFileSync('./public/data/stars.csv');
let config_string =  data.toString();

let stars = new Map();
let lines = config_string.trimEnd().split('\n');
let items = lines[0].trim().split(',');
for (let line of lines.slice(1)) {
    let values = line.trim().split(',');

    let this_star = new Map();
    for (let i = 0; i < items.length; ++ i) {
        this_star.set(items[i], values[i]);
    }
    stars.set(values[0], this_star);
}

console.log(stars);