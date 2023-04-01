let mysql = require('mysql')
let config = require('../../../config.json')
const {info, warn, error, Logger} = require('okayulogger')

function CheckRegex(input, mode) {
    switch (mode) {
        case "username":
            let ure = new RegExp("[a-zA-Z0-9]{6,25}");
            return ure.test(input);
        case "filename":
            let fre = new RegExp("[a-zA-Z0-9_-]{50}");
            return fre.test(input);
    }
}

async function GetLoginDetails(username, hashedPassword) {
    let L = new Logger("MySQL");
    con = mysql.createConnection({
        host:config.mysql.host,
        user:config.mysql.username,
        password:config.mysql.password,
        database:config.mysql.database
    })
    await con.connect((err) => {
        if (err) {
            L.error("Could not connect to MySQL Database.");
            L.error(err)
            return {code:500};
        }
    });
}