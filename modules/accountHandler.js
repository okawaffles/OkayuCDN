// this file handles routes for logging in/out, signing up, and account management

const fs = require('node:fs');

const { UtilHash, UtilNewToken } = require('./util.js');
const { info, warn, error, Logger } = require('okayulogger');
const { validationResult } = require('express-validator');

// want connection with neko-passki, better security + passkeys
// newer preferred way to log in. eventually migrate all accounts? 

// local functions:

function LoginVerify(username, password) {
    if (fs.existsSync(`./db/userLoginData/${username}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));

        // Encrypt field password (sha256)
        let encryptedPasswd = hash(password);

        // Compare encryption (Unencrypted password is never stored in database) do they match?
        if (encryptedPasswd === userData.password) return true; else return false;
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


// exported functions:

function LoginGETHandler(req, res) {
    // we dont NEED to check whether theres a redir query in GET, only in POST
    res.render('login.ejs');
}

function LoginPOSTHandler(req, res) {
    let username = req.body.username;
    let password = req.body.password;

    if (LoginVerify(username, password)) {
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


// --

function NekoPasskiHandler(req, res) {
    // later :3
}

module.exports = { LoginGETHandler, LoginPOSTHandler, LogoutHandler }