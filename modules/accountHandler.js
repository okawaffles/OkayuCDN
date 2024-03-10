"use strict";

// this file handles routes for logging in/out, signing up, and account management

const fs = require('node:fs');
const { UtilHash, UtilNewToken, UtilHashSecureSalted } = require('./util.js');
const { info, warn, error, Logger } = require('okayulogger');
const { validationResult, matchedData } = require('express-validator');
const { join } = require('node:path');
const { verify } = require('argon2');
const { IncomingForm } = require('formidable');

// want connection with neko-passki, better security + passkeys
// newer preferred way to log in. eventually migrate all accounts? 

// local functions:

function LoginVerify(username, password) {
    if (fs.existsSync(`./db/userLoginData/${username}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));

        // Encrypt field password (sha256)
        let encryptedPasswd = UtilHash(password);

        // Compare encryption (Unencrypted password is never stored in database) do they match?
        return (encryptedPasswd === userData.password);
    } else return false;
}

async function LoginVerifySecure(username, raw_password) {
    // todo
    let path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    if (fs.existsSync(path)) {
        let userData = JSON.parse(fs.readFileSync(path));

        if (userData.hashMethod == "argon2") {   
            // this might be able to be simplified but im not taking chances yet
            return (await verify(userData.password, raw_password+userData.password_salt));
        } else {
            // use legacy password method temporarily
            if (LoginVerify(username, raw_password)) {
                warn('LoginSecure', 'Notice: Upgrading sha256 (pre-6.0) password to argon2!');
                // rewrite the hash
                const salt = UtilNewToken();
                userData.password_salt = salt;
                userData.password = await UtilHashSecureSalted(raw_password, salt);
                userData.hashMethod = "argon2";

                // write out
                fs.writeFileSync(path, JSON.stringify(userData));
                return true;
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
    if (!fs.existsSync(`./db/userLoginData/${username}.json`)) return false;
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
async function QueryUserStorage(user) {
    return new Promise((resolve) => {
        try {
            let udat = JSON.parse(fs.readFileSync(`./db/userLoginData/${user}.json`, 'utf-8'));
            let totalUserStorage = udat.storage;
            let size = 0;
            fs.readdirSync(`./content/${user}`, (err, files) => {
                if (err) {
                    error('QueryUserStorage', err);
                    resolve({ size: 26843545600, userTS: 26843545600 });
                }
                files.forEach(file => {
                    size += fs.statSync(`./content/${user}/${file}`).size;
                    //info('QUS', `Queried ${file}`);
                });
                //info('QueryUserStorage', `got all files correctly, user size: ${size}, userTS: ${totalUserStorage}`);
                if (!udat.premium) 
                    resolve({ size: size, userTS: totalUserStorage }); 
                else 
                    resolve({ size: size, userTS: 1099511627776 }); //1tb
            })
        } catch (e) {
            error('QueryUserStorage', e);
            resolve({ size: 0, userTS: 0 });
        }
    })
}

// exported functions:

function LoginGETHandler(req, res) {
    // we dont NEED to check whether theres a redir query in GET, only in POST
    res.render('login.ejs');
}

async function LoginPOSTHandler(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).json({success:false,reason:"Sanitizer rejected request. Please try again."});
        return;
    }

    const data = matchedData(req);

    let username = data.username;
    let password = data.password;

    // new function will also handle algorithm changing
    if (await LoginVerifySecure(username, password)) {
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
    } else res.json({result:401,reason:'invalid login'});
}

function LogoutHandler(req, res) {
    if (fs.existsSync(`./db/sessionStorage/${req.cookies.token}.json`)) fs.rmSync(`./db/sessionStorage/${req.cookies.token}.json`);
    res.cookie("token", "logout", { expires: new Date(Date.now() + 604800000) });
    res.redirect('/home');
}

function SignupPOSTHandler(req, res, config) {
    try {
        let form = new IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (!config.start_flags['DISABLE_ACCOUNT_CREATION']) {
                if (!fs.existsSync(`../db/userLoginData/${fields.un}.json`)) {
                    // Encrypt password with SHA-256 hash
                    let salt = UtilNewToken();
                    let encryptedPasswd = UtilHashSecureSalted(fields.pw, salt);

                    let data = {
                        hashMethod:"argon2",
                        password: encryptedPasswd,
                        password_salt: salt,
                        email: fields.em,
                        name: fields.nm,
                        storage: 26843545600,
                        premium: false,
                        tags: {
                            bugtester: false,
                            okasoft: false
                        }
                    };

                    if (fs.existsSync(join(__dirname, `../db/userLoginData/${fields.un}.json`))) {
                        res.status(500).send('Username already exists. Please choose a different one.');
                        error('Signup', 'Username already exists.');
                        return;
                    }

                    fs.writeFileSync(join(__dirname, `../db/userLoginData/${fields.un}.json`), JSON.stringify(data));
                    fs.mkdirSync(join(__dirname, `../content/${fields.un}`));
                    //stats('w', 'accounts'); // increase acc statistic (write, accounts)
                    res.redirect(`/login?redir=/home`);
                } else {
                    res.render(`error_general`, { 'error': "Username already exists!" });
                }
            } else {
                res.render(`error_general`, { 'error': "Account registration is currently unavailable." });
            }
        });
    } catch (e) {
        res.status(500).send('Internal Server Error');
        error('Signup', e);
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

function GETAccountPageData(req, res) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).json({result:400});
        return;
    }
    const data = matchedData(req);
    const username = GetUsernameFromToken(data.token);
    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    let userdata = JSON.parse(fs.readFileSync(userdata_path, 'utf-8'));

    res.json({
        uses2FA: userdata.uses2FA,
        usesPasskey: userdata.usesPasskey
    })
}

// -- OTP 2FA --
function POSTDisableOTP(req, res) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).json({result:400});
        return;
    }
    const data = matchedData(req);
    const username = GetUsernameFromToken(data.token);
    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    let userdata = JSON.parse(fs.readFileSync(userdata_path, 'utf-8'));

    userdata.uses2FA = false;

    fs.writeFileSync(userdata_path, JSON.stringify(userdata), 'utf-8');
    res.json({success:true});
}

// -- Passkey registration/login helpers --
function SetPasskeyRegisterInfo(username, options) {
    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    let userdata = JSON.parse(fs.readFileSync(userdata_path, 'utf-8'));
    userdata.passkey_registration = options;
    fs.writeFileSync(userdata_path, JSON.stringify(userdata), 'utf-8');
}
function GetPasskeyRegisterInfo(username) {
    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    const userdata = JSON.parse(fs.readFileSync(userdata_path, 'utf-8'));
    return userdata.passkey_registration;
}
function SetFinalPasskeyInfo(username, options) {
    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    let userdata = JSON.parse(fs.readFileSync(userdata_path, 'utf-8'));
    userdata.passkey_registration = undefined;
    userdata.passkey_final = options;
    userdata.usesPasskey = true;
    fs.writeFileSync(userdata_path, JSON.stringify(userdata), 'utf-8');
}
function GetFinalPasskeyInfo(username) {
    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    const userdata = JSON.parse(fs.readFileSync(userdata_path, 'utf-8'));
    return {
        usesPasskey: userdata.usesPasskey,
        options: userdata.passkey_final
    };
}
function SetUserPasskeyChallenge(username, options) {
    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    let userdata = JSON.parse(fs.readFileSync(userdata_path, 'utf-8'));
    userdata.passkey_challenge = options;
    fs.writeFileSync(userdata_path, JSON.stringify(userdata), 'utf-8');
}
function GetUserPasskeyChallenge(username) {
    const userdata_path = join(__dirname, '..', 'db', 'userLoginData', `${username}.json`);
    const userdata = JSON.parse(fs.readFileSync(userdata_path, 'utf-8'));
    return userdata.passkey_challenge;
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
    QueryUserStorage,
    GETAccountPageData,

    POSTDisableOTP,

    SetPasskeyRegisterInfo,
    GetPasskeyRegisterInfo,
    SetFinalPasskeyInfo,
    GetFinalPasskeyInfo,
    SetUserPasskeyChallenge,
    GetUserPasskeyChallenge
}