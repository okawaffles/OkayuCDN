let mysql = require('../../node_modules/mysql');
const {info, warn, error, Logger} = require('../../node_modules/okayulogger');
let path = require('path')
let config = require(path.join(__dirname + '../../../config.json'));
let process = require('process');
let fs = require('node:fs')

let con = mysql.createConnection({
    host:config.mysql.host,
    user:config.mysql.username,
    password:config.mysql.password,
    database:config.mysql.database
})

warn('migrator', 'WARNING: THIS WILL ATTEMPT TO DROP THE DATABASE "' + config.mysql.database + '"! YOU HAVE 10 SECONDS TO CTRL+C TO QUIT BEFORE THIS HAPPENS.');
warn('migrator', 'THIS IS TO CLEAN THE DATABASE TO ENSURE IT WILL WORK PROPERLY.');

setTimeout(async () => {
    let L = new Logger('MySQL Initial Setup')
    L.info('Connecting to MySQL...');
    await con.connect((err) => {
        if (err) {
            L.error(err);
            process.exit();
        }
    })

    L.info('Starting migration by dropping existing database.');
    await con.query(`DROP DATABASE ${config.mysql.database};`, (err, result) => {
        if (err) {
            L.error(err);
            L.info("Not exiting as this is likely not a critical error.");
        }
    });


    L.info('Creating new database...');
    await con.query(`CREATE DATABASE ${config.mysql.database};`, (err, result) => {
        if (err) {
            L.error(err);
            process.exit();
        } else {
            L.info(`Result: OK`)
        }
    });
    await con.query(`USE ${config.mysql.database}`, (err, result) => {
        if (err) throw err; // idgaf anymore
        L.info(`Result: OK`)
    });


    L.info('Creating tables...');
    await con.query(`CREATE TABLE accounts(accountId int, username varchar(128), password varchar(255), email varchar(128), realName varchar(128), enableTwoFactor bool, twoFactorKey varchar(128), storage bigint, premium bool, bugtester bool, admin bool);`, (err, result) => {
        if (err) {
            L.error(err);
            process.exit();
        } else {
            L.info(`Result: OK`)
        }
    });
    await con.query(`CREATE TABLE stats(accounts int, uploads int);`, (err, result) => {
        if (err) {
            L.error(err);
            process.exit();
        } else {
            L.info(`Result: OK`)
        }
    });
    await con.query(`CREATE TABLE tokens(token char(255), username char(255));`, (err, result) => {
        if (err) {
            L.error(err);
            process.exit();
        } else {
            L.info(`Result: OK`)
        }
    });

    L = new Logger('Accounts => MySQL Database');
    L.info('Read userLoginData directory...');
    files = fs.readdirSync(path.join(__dirname, '../../db/userLoginData/'));

    L.info('Begin copying info...');
    let i = -1;
    files.forEach(async file => {
        let p = path.join(__dirname, '../../db/userLoginData/' + file);
        let userData = JSON.parse(fs.readFileSync(p));
        i++;
        let query = `INSERT INTO accounts (accountid, username, password, email, realName, enableTwoFactor, twoFactorKey, storage, premium, bugtester, admin)` +
        `VALUES (${i}, "${path.parse(p).name}", "${userData.password}", "${userData.email}", "${userData.name}", ${userData.uses2FA ? 1 : 0}, "${userData.uses2FA ? userData["2fa_config"] : "NOT USED"}", ${userData.storage}, ${userData.premium ? 1 : 0}, ${userData.tags.bugtester ? 1 : 0}, ${userData.tags.admin ? 1 : 0});`
        
        await con.query(query, (err, result) => {
            if (err) {
                L.error(err);
                return;
            }
            L.info('Result: OK');
        });
    });

    L.info("\n\nThe program may freeze up. Wait roughly 60 seconds for all queries to finish, then you may CTRL+C the program.\n");
}, 10000); // CHANGE TO 10000 !!!!!!!!!