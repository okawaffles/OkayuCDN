// this file handles routes for logging in/out, signing up, and account management

const fs = require('node:fs');
const { UtilHash, UtilNewToken, UtilHashSecureSalted } = require('./util.js');
const { info, warn, error, Logger } = require('okayulogger');
const { validationResult, matchedData } = require('express-validator');
const { join } = require('node:path');
const { verify } = require('argon2');

// want connection with neko-passki, better security + passkeys
// newer preferred way to log in. eventually migrate all accounts? 

// local functions:

function LoginVerify(username, password) {
    if (fs.existsSync(`./db/userLoginData/${username}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));

        // Encrypt field password (sha256)
        let encryptedPasswd = UtilHash(password);

        // Compare encryption (Unencrypted password is never stored in database) do they match?
        if (encryptedPasswd === userData.password) return true; else return false;
    } else return false;
}

async function LoginVerifySecure(username, raw_password) {
    // todo
    let path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    if (fs.existsSync(path)) {
        let userData = JSON.parse(fs.readFileSync(path));

        if (!userData.hashMethod == "argon2") {   
            // this might be able to be simplified but im not taking chances yet
            if (await verify(userData.password, raw_password+userData.password_salt)) {
                return true;
            } else return false;
        } else {
            // use legacy password method temporarily
            if (LoginVerify(username, raw_password)) {
                // rewrite the hash
                userData.password_salt = UtilNewToken();
                userData.password = await UtilHashSecureSalted(raw_password + userData.password_salt);
                userData.hashMethod = "argon2";

                // write out
                fs.writeFileSync(path, JSON.stringify(userData));
            }
        }
    } else return false;
}

function LoginCheck2FAStatus(username) {
    if (fs.existsSync(`./db/userLoginData/${username}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));
        return userData.uses2FA;
    } else return false;
}

function AccountCheckRestriction(username) {
    var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));
    if (userData.restricted) {
        info('login', `${username} is banned for ${userData.restricted}`);
        return userData.restricted;
    } else return false;
}

function VerifyToken(token) {
    if (fs.existsSync(join(__dirname, `../db/sessionStorage/${token}.json`))) {
        return true;
    } else return false;
}
function GetUsernameFromToken(token) {
    const path = join(__dirname, '..', 'db', 'sessionStorage', `${token}.json`);
    if (fs.existsSync(path)) {
        try {
            var userData = JSON.parse(fs.readFileSync(path));
            return userData.user;
        } catch (e) {
            error('Accounts', 'Failed to read token data: '+ e);
            return 'anonymous';
        }
    }
}
function QueryUserStorage(user) {
    try {
        let udat = JSON.parse(fs.readFileSync(`../db/userLoginData/${user}.json`, 'utf-8'));
        let totalUserStorage = udat.storage;
        let size = 0;
        fs.readdirSync(`./content/${user}`, (err, files) => {
            if (err) {
                return { size: 26843545600, userTS: 26843545600 };
            }
            files.forEach(file => {
                size += fs.statSync(`./content/${user}/${file}`).size;
            });
            if (!udat.premium) return { size: size, userTS: totalUserStorage }; else return { size: size, userTS: 1099511627776 };
        })
    }
    catch (e) {
        return { size: 0, userTS: 26843545600 };
    }
}

// exported functions:

function LoginGETHandler(req, res) {
    // we dont NEED to check whether theres a redir query in GET, only in POST
    res.render('login.ejs');
}

function LoginPOSTHandler(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(401).json({success:false,reason:"Sanitizer rejected request. Please try again.", errors:result.array()});
        return;
    }

    const data = matchedData(req);

    let username = data.username;
    let password = data.password;

    // new function will also handle algorithm changing
    if (LoginVerifySecure(username, password)) {
        let token = UtilNewToken(32);
        let session = {
            user: username
        };

        if (!AccountCheckRestriction(username)) {
            if (!LoginCheck2FAStatus(username))
                res.json({result:200,uses2FA:false,token:token})
            else
                res.json({result:200,uses2FA:true})

            res.end();
            fs.writeFileSync(`./db/sessionStorage/${token}.json`, JSON.stringify(session));
        } else res.render('forbidden.ejs', { reason: checkRestriction(username) });
    } else res.json({result:401});
}

function LogoutHandler(req, res) {
    if (fs.existsSync(`./db/sessionStorage/${req.cookies.token}.json`)) fs.rmSync(`./db/sessionStorage/${req.cookies.token}.json`);
    res.cookie("token", "logout", { expires: new Date(Date.now() + 604800000) });
    res.redirect('/home');
}

function SignupPOSTHandler(req, res) {
    (req, res) => {
        let form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (!config.start_flags['DISABLE_ACCOUNT_CREATION']) {
                if (!fs.existsSync(`./db/userLoginData/${fields.un}.json`)) {
                    // Encrypt password with SHA-256 hash
                    let encryptedPasswd = UtilHash(fields.pw);

                    let data = {
                        password: encryptedPasswd,
                        email: fields.em,
                        name: fields.nm,
                        storage: 26843545600,
                        premium: false,
                        tags: {
                            bugtester: false,
                            okasoft: false
                        }
                    };
                    fs.writeFileSync(path.join(__dirname, `/db/userLoginData/${fields.un}.json`), JSON.stringify(data));
                    fs.mkdirSync(path.join(__dirname, `/content/${fields.un}`));
                    stats('w', 'accounts'); // increase acc statistic (write, accounts)
                    res.redirect(`/login?redir=/home`);
                } else {
                    res.render(`error_general`, { 'error': "Username already exists!" });
                }
            } else {
                res.render(`error_general`, { 'error': "Account registration is currently unavailable." });
            }
        });
    }
}

async function POSTPasswordChange(req, res) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).json({result:400});
        return;
    }
    const data = matchedData(req);
    const username = GetUsernameFromToken(data.token);

    if (!(VerifyToken(data.token) || await LoginVerifySecure(username, data.currentPassword))) {
        res.status(403).json({result:403});
        return;
    }

    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    let userdata = JSON.parse(fs.readFileSync(userdata_path));

    const salt = UtilNewToken();
    const hash = await UtilHashSecureSalted(data.newPassword, salt);

    userdata.hashMethod = "argon2";
    userdata.password = hash;
    userdata.password_salt = salt;

    res.json({result:200});
}

// -- Desktop App Handlers --

function POSTDesktopAuth(req, res) {
    let result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(401).json({success:false,code:'DESKTOP_LOGIN_FAIL',reason:'Bad login'});
        return;
    }

    const data = matchedData(req);

    if (!LoginVerify(data.username, data.password)) {
        res.status(401).json({success:false,code:'DESKTOP_LOGIN_FAIL',reason:'Bad login'});
        return;
    }

    if (AccountCheckRestriction(data.username)) {
        res.status(403).json({success:false,code:'ACCOUNT_RESTRICTED',reason:'Account restricted'});
        return;
    }

    if (LoginCheck2FAStatus(data.username)) {
        res.status(501).json({success:false,code:'TWO_FACTOR_IS_ON',reason:'Desktop Client doesn\'t support 2FA yet. We\'ll update it to support it soon!'});
        return;
    }

    let token = UtilNewToken(32);
    let session = {
        user: data.username
    };

    fs.writeFileSync(`./db/sessionStorage/${token}.json`, JSON.stringify(session));
    res.status(200).json({success:true,token:token,code:'LOGIN_SUCCESSFUL',reason:'Desktop login was successful'});
}

function POSTDesktopVerifyToken(req, res) {
    let result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({success:false,code:'BAD_REQUEST',reason:'Bad request'});
        return;
    }

    const data = matchedData(req);

    if (VerifyToken(data.token)) {
        res.json({success:true,code:'TOKEN_OK',reason:'Token is good'});
    } else {
        res.status(401).json({success:false,code:'TOKEN_VERIFY_FAIL',reason:'Token is expired/invalid'});
    }
}
// --

function NekoPasskiHandler(req, res) {
    // later :3
}

module.exports = { 
    LoginGETHandler, 
    LoginPOSTHandler, 
    LogoutHandler, 
    SignupPOSTHandler, 
    POSTDesktopAuth, 
    POSTDesktopVerifyToken,
    POSTPasswordChange,
    VerifyToken,
    GetUsernameFromToken,
    QueryUserStorage
}