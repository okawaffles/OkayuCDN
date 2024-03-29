/* eslint-disable */

// By okawaffles
// v5 - 2022-2024
// I'm so proud of how far I've come.



const fs = require('fs');
const path = require('node:path');
let cache;

// Check+Load dependencies
let express, cookieParser, formidable, crypto, chalk, urlencodedparser, speakeasy, qrcode, ffmpeg, busboy;
const { info, warn, error, Logger } = require('okayulogger');
// for sanitization:
const { validationResult, matchedData, query, param, body, cookie, header } = require('express-validator');    
// routes in separate files:
const { LoginGETHandler, LoginPOSTHandler, LogoutHandler, POSTPasswordChange, SignupPOSTHandler, POSTDesktopVerifyToken, POSTDesktopAuth, GETAccountPageData, POSTDisableOTP } = require('./modules/accountHandler.js')
const { ServeContent, ServeEmbeddedContent, GenerateSafeViewPage } = require('./modules/contentServing.js');
const { POSTUpload, POSTAnonymousUpload, POSTDesktopUpload, POSTRemoveMyBoxContent } = require('./modules/userUploadService');
const { UtilLogRequest, UtilNewToken } = require('./modules/util.js');
const lusca = require('lusca');
const session = require('express-session');
const { RegisterStart, RegisterFinish, LoginStart, LoginFinish } = require('./modules/passkey.js');
const bodyParser = require('body-parser');
// TODO: change all relative paths to use path.join(__dirname, 'etc/etc')
try {
    // load env variables
    require('dotenv').config({path:path.join(__dirname, ".ENV")});
    if (!process.env.NODE_ENV) {
        warn('dotenv', 'Failed to load .ENV file. Creating one...'); // check for dotenv success
        fs.writeFileSync(path.join(__dirname, '.ENV'), `NODE_ENV=production\nSESSION_SECRET=${UtilNewToken()}`);
        require('dotenv').config({path:path.join(__dirname, ".ENV")});
    }

    // don't default to debug mode!
    if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";
    express = require('express');

    // for parsing incoming forms and cookies
    cookieParser = require('cookie-parser');
    formidable = require('formidable');

    // used for encrypting passwords
    if (parseInt(process.version.split('v')[1].split('.')[0]) < 15) {
        error('boot', 'Unsupported node version. Please use Node.JS>=v15');
        process.exit();
    }
    crypto = require('node:crypto'); // switched away from npm crypto to built-in crypto

    // terminal styling
    chalk = require('chalk');

    // built in cache manager and file-checker
    cache = require(path.join(__dirname, '/parts/cacheHelper'));

    // other random things we need
    urlencodedparser = require('body-parser').urlencoded({extended:false})
    ffmpeg = require('fluent-ffmpeg')
    require('ffmpeg')

    // 2fa setup
    speakeasy = require('speakeasy');
    qrcode = require('qrcode');

    busboy = require("connect-busboy");

    require('ejs'); // do not assign ejs to a variable as we don't need to
} catch (e) {
    // only should trigger if a dependency fails to require
    console.log('Error: Missing dependencies. Please run "npm ci"!\n');
    console.log(e);
    process.exit(1);
}

// Check+Load config
let config, pjson;
try {
    config = require('./config.json');
    pjson = require('./package.json');

    if (config.version_include_git_commit) {
        const git_commit = require('node:child_process').execSync('git rev-parse HEAD').toString().trim().slice(0,7);
        pjson.version = `${pjson.version} (commit ${git_commit})`;
    }
} catch (e) {
    // self-explanatory
    error('boot', 'Could not load server config (config.json)\n');
    error('boot', e);
    // write new config later
    process.exit(1);
}

// Prepare express
let app = express();
app.set('view engine', 'ejs');
//app.use(express.static('/views'));
app.use('/assets', express.static(__dirname + '/views/assets'));
app.use(cookieParser());
app.use(session({secret: process.env['SESSION_SECRET'],resave:true,saveUninitialized:true}));
/*app.use(lusca.csrf({
    cookie:'.okayu_csrf',
    secret:process.env['SESSION_SECRET']
}));*/

// this function shows the IP of every request as well as blocking reqs from banned IPs:
app.use('*', UtilLogRequest);

// Ascii art is no longer required to boot
let asciiart = fs.readFileSync('./asciiart.txt', 'utf-8');
if (!asciiart || config.start_flags["DISABLE_ASCII_ART"]) asciiart = "";
console.log(asciiart);

// end of new index start

info("boot", `Starting OkayuCDN Server ${pjson.version}`);
info("boot", `Thanks for using OkayuCDN! Report bugs at ${pjson.bugs.url}`);

// Clean cache and tokens
cache.prepareDirectories();
if (!config.start_flags.includes("DISABLE_CACHE_CLEAN")) cache.cleanCache();
if (!config.start_flags.includes("DISABLE_TOKEN_CLEAN")) cache.cleanTokens(); // dont clean tokens on devmode boot

// Additional Functions

function hash(string) {
    return crypto.createHash('sha256').update(string).digest('hex');
}

function getUsername(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/sessionStorage/${token}.json`));
        return userData.user;
    }
}
function getUserData(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${getUsername(token)}.json`));
        return userData;
    }
}
function getPremiumStat(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${getUsername(token)}.json`));
        return userData.premium;
    }
}

function verifyToken(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        return true;
    } else return false;
}
function checkRestriction(username) {
    var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));
    if (userData.restricted) {
        info('login', `${username} is banned for ${userData.restricted}`);
        return userData.restricted;
    } else return false;
}

function verifyLogin(username, password) {
    if (fs.existsSync(`./db/userLoginData/${username}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));

        // Encrypt field password (sha256)
        let encryptedPasswd = hash(password);

        // Compare encryption (Unencrypted password is never stored in database) do they match?
        if (encryptedPasswd === userData.password) return true; else return false;
    } else return false;
}

/* stats */

function stats(mode, stat) {
    let values = JSON.parse(fs.readFileSync(path.join(__dirname, '/db/stats.json')));
    if (mode == 'r') {
        // read stats
        return {
            uploads: values.uploads,
            accounts: values.accounts
        };
    } else if (mode == 'w') {
        // increase value of stat
        let u = values.uploads;
        let a = values.accounts;
        switch (stat) {
            case "uploads":
                u = values.uploads + 1;
                break;
            case "accounts":
                a = values.accounts + 1;
                break;
            default:
                info('stats', 'Invalid option');
                break;
        }
        let finalstats = {
            uploads: u,
            accounts: a
        }
        fs.writeFileSync(path.join(__dirname, '/db/stats.json'), JSON.stringify(finalstats));
    }
}

function genNewToken() {
    return crypto.randomBytes(16).toString('hex');
}





// Web pages //
// Landing
app.get('/', (req, res) => {
    // skip the PIXI.js landing page as it doesnt appear correctly on mobile devices
    // plus its just a hassle for mobile users tbh
    if (req.headers && req.headers['user-agent'] && (req.headers['user-agent'].includes('Android') || req.headers['user-agent'].includes('iPhone'))) res.redirect('/home');
    else res.render('landing/okayu.ejs');
});
app.get('/mira', (req, res) => {
    res.render('landing/mira.ejs');
});

// Main

app.get('/content/:user/:item', (req, res)=>{
    res.redirect(`/@${req.params.user}/${req.params.item}`)
});

app.get('/@:user/:item', [
    param('user').notEmpty().escape(),
    param('item').notEmpty().escape()
], (req, res)=>ServeContent(req, res, config.domain));

app.get('/content/:user/:item/embed', [
    param('user').notEmpty().escape(),
    param('item').notEmpty().escape()
], ServeEmbeddedContent);

app.get('/api/mp4/:user/:item', [
    param('user').notEmpty().escape(),
    param('item').notEmpty().escape(),
    header('range').notEmpty().escape()
], (req, res) => {
    if (!validationResult(req).isEmpty()) {
        //res.status(400).end();
        //return;
    }

    const data = matchedData(req);

    let user = data.user;
    let item = data.item;
    let fpath = path.join(__dirname, `/content/${user}/${item}`);
    let size = fs.statSync(fpath).size;

    // followed a guide on this so idk ???
    const range = data.range;
    if (!range) { 
        res.status(404).send('Requires Range Header!'); 
        error('mp4stream', 'Needs range header, rejecting.');
        return;
    }
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, size - 1);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(fpath, { start, end });
    videoStream.pipe(res);
});

app.get('/api/thumbnail/:user/:item', [
    param('user').notEmpty().escape(),
    param('item').notEmpty().escape(),
], (req, res) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).send('bad request');
        return;
    }

    const data = matchedData(req);

    videoPath = path.join(__dirname, `/content/${data.user}/${data.item}`)
    if (!fs.existsSync(videoPath)) { res.status(404).send({"error":"File not found."}); return }
    ffmpeg(videoPath)
    .takeScreenshots({
        count: 1,
        timemarks: ['1'] // number of seconds
    }, path.join(__dirname, '/cache'))
    .on('end', () => {
        const thumbnailPath = path.join(__dirname, '/cache/tn.png')
        res.send(fs.readFileSync(thumbnailPath));
    })
    .on('error', (err) => {
        error('thumbnail', err);
    });
});


app.get('/status', (req, res) => {
    res.redirect('/api/health');
})
app.get('/robots.txt', (req, res) => {
    res.send(fs.readFileSync('./views/assets/robots.txt'))
})

// dont forget to specify the root, lol
app.get('/favicon.ico', (req, res) => {
    res.send(fs.readFileSync('./views/assets/images/favicon.ico'));
})


// User Viewable Pages
app.get('/home', (req, res) => {
    res.render(req.query.useBetaSite?'home_beta.ejs':'home.ejs', { 'version': pjson.version });
    res.end();
});

app.get('/info', (req, res) => {
    let values = stats('r');
    res.render('info.ejs', { uploads: values.uploads, accounts: values.accounts });
})

app.get('/terms', (req, res) => {
    res.render('terms.ejs');
})
app.get('/account', [
    cookie('token').notEmpty().escape().isLength({min:32,max:32})
], (req, res) => {
    if (!validationResult(req).isEmpty()) {
        res.redirect('/login?redir=/account');
        return;
    }

    const token = matchedData(req).token;
    if (!verifyToken(token)) {res.redirect('/login?redir=/account'); return;}

    res.render('account.ejs', {username:getUsername(token)});
});


app.get('/manage/upload', [
    cookie('token').notEmpty().escape().isLength({min:32,max:32})
], (req, res) => {
    if (!validationResult(req).isEmpty()) {
        // this is important, because we will always get a 'bad request' error if we don't have a token
        // instead of being redirected to login as we expect
        res.redirect('/login?redir=/manage/upload');
        return;
    }

    let token = matchedData(req).token;
    if (verifyToken(token)) {
        let isBT = false;
        try {
            isBT = getUserData(token).tags.bugtester;
        } catch (err) {
            isBT = false;
        }
        res.render('upload.ejs', { USERNAME: getUsername(token), isBT: isBT, premium: getPremiumStat(token),datecode: pjson.datecode });
    } else {
        res.redirect('/login?redir=/manage/upload');
    }
});

app.get('/mybox', [
    cookie('token').isLength({min:32,max:32}).notEmpty().escape()
], (req, res) => {
    if (!validationResult(req).isEmpty()) {
        // just redirect to login if its a bad token,
        // no reason to show a bad request error
        res.redirect('/login?redir=/mybox');
        return;
    }

    let token = matchedData(req).token;

    if (verifyToken(token)) res.render('mybox.ejs', { USERNAME: getUsername(token),domain:config.domain });
    else res.redirect('/login?redir=/mybox');
});

app.get('/login', LoginGETHandler);

app.get('/logout', LogoutHandler);

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

app.get('/admin', (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/admin');
    } else if (verifyToken(token)) {
        if (getUserData(token)['tags']['admin']) {
            res.render('admin.ejs');
        } else res.render('forbidden.ejs', { "reason": "No access. If you need help getting access, please follow these instructions:" });
    } else {
        res.redirect('/login?redir=/admin');
    }
});

app.get('/success', [
    query('f').notEmpty().escape(),
    cookie('token').notEmpty().escape().isLength({min:32,max:32})
], (req, res) => {
    let result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).send('400 Bad Request');
        return;
    }

    let data = matchedData(req);

    if (!data.f) {
        res.status(404);
        res.end();
        return;
    } else {
        res.render('upload_finish.ejs', {
            l: `${config.domain}/content/${data.anon ? "anonymous" : getUsername(data.token)}/${data.f}`, 
            vl: `${config.domain}/view/${data.anon ? "anonymous" : getUsername(data.token)}/${data.f}`
        });
    }
});

app.post('/api/mybox/deleteItem', urlencodedparser, [
    cookie('token').isLength({min:32,max:32}).notEmpty().escape(),
    body('id').notEmpty().isString().escape()
], POSTRemoveMyBoxContent)

// POST Request handlers

// use busboy 5mb buffer
// new handler :3
app.post('/api/upload', 
[
    // sanitizations
    body('filename').notEmpty().escape().isLength({min:1,max:50}),
    cookie('token').notEmpty().escape().isLength({min:32,max:32}),
],
busboy({highWaterMark: 5*1024*1024}),
(req, res)=>POSTUpload(req, res, config, __dirname)); // we have to do (req,res) cuz it has more than just the req res args

// same as above, just uses authorization header instead of cookies for token
// pray it works ?
app.post('/api/desktop/upload', 
[
    // sanitizations
    body('filename').notEmpty().escape().isLength({min:1,max:50}),
    header('authorization').notEmpty().escape().isLength({min:32,max:32}),
], busboy({highWaterMark: 5 * 1024 * 1024}), POSTDesktopUpload);

app.get('/quickupload', (req, res) => {
    if (config.start_flags["DISABLE_ANONYMOUS_UPLOADING"])
        res.status(403).render('error_general.ejs', {error:'Anonymous uploading is disabled'});
    else
        res.render('quickupload.ejs', {domain:config.domain,datecode:config.datecode});
});

app.post('/api/quickUpload', [
    body('filename').notEmpty().escape().isAlphanumeric().isLength({min:1,max:50})
], urlencodedparser, POSTAnonymousUpload);

app.post('/api/login', urlencodedparser, [
    body('username').notEmpty().escape(),
    body('password').notEmpty().escape()
], LoginPOSTHandler);

app.get('/api/myAccountData', [
    cookie('token').notEmpty().escape().isLength({min:32,max:32})
], GETAccountPageData)

app.post('/api/desktop/authenticate', [query('username').notEmpty().escape(), query('password').notEmpty().escape()], POSTDesktopAuth);
app.post('/api/desktop/token', [query('token').notEmpty().escape()], POSTDesktopVerifyToken);

app.get('/account/2fa/setup', (req, res) => {
    if (!verifyToken(req.cookies.token)) { res.redirect('/login?redir=/account/2fa/setup'); return; }

    if (getUserData(req.cookies.token).uses2FA) {
        res.render('error_general.ejs', {error:"You already have 2FA on your account!"})
        //res.end();
        return;
    }

    let secret = speakeasy.generateSecret({name:`OkayuCDN (${getUsername(req.cookies.token)})`});

    qrcode.toDataURL(secret.otpauth_url, function(err, data_url) {
        if (err) { res.render('error_general.ejs', {error:`An error occurred while creating the QR code. See here:\n${error}`}); return; }

        fs.writeFileSync(path.join(__dirname, `/cache/${getUsername(req.cookies.token)}.2fa`), JSON.stringify(secret));
        res.render('setup2fa.ejs', {qrc: data_url});
    });
})

app.post('/api/2fa/setupUser', urlencodedparser, (req, res) => {
    if (!verifyToken(req.cookies.token)) { res.status(403); return; }

    let secret = JSON.parse(fs.readFileSync(path.join(__dirname, `/cache/${getUsername(req.cookies.token)}.2fa`)));

    // delete the secret cache
    fs.rmSync(path.join(__dirname, `/cache/${getUsername(req.cookies.token)}.2fa`));

    let userdata = getUserData(req.cookies.token);
    userdata.uses2FA = true;
    userdata['2fa_config'] = secret.base32; 

    fs.writeFileSync(`./db/userLoginData/${getUsername(req.cookies.token)}.json`, JSON.stringify(newUserdata));

    res.json({success:true});
})

app.post('/api/2fa/setup/verify', urlencodedparser, (req, res) => {
    let secret = JSON.parse(fs.readFileSync(path.join(__dirname, `/cache/${getUsername(req.cookies.token)}.2fa`)));
    let b32 = secret.base32;

    if (speakeasy.totp.verify({secret: b32, encoding: 'base32', token: req.body.userToken})) {
        res.json({result:200})
    } else {
        error('2FA', `${req.body.userToken} != valid`)
        res.json({result:401})
    }
})
app.post('/api/2fa/verify', urlencodedparser, (req, res) => {
    // remember: 2fa validators don't have a token.
    let userdata = JSON.parse(fs.readFileSync(path.join(__dirname, `/db/userLoginData/${req.body.username}.json`)));

    let b32 = userdata['2fa_config'];
    if (speakeasy.totp.verify({secret: b32, encoding: 'base32', token: req.body.userToken})) {
        // write session
        let token = genNewToken(32);
        let session = {
            user: req.body.username
        };
        fs.writeFileSync(`./db/sessionStorage/${token}.json`, JSON.stringify(session));

        res.json({result:200,token})
    } else {
        res.json({result:401})
    }
})

app.post('/api/2fa/otp/disable', [
    cookie('token').notEmpty().escape().isLength({min:32,max:32})
], POSTDisableOTP)

// passkeys
// register
app.post('/api/2fa/pkreg/start', [
    cookie('token').notEmpty().escape().isLength({min:32,max:32})
], RegisterStart);
app.post('/api/2fa/pkreg/finish', bodyParser.json(), [
    cookie('token').notEmpty().escape().isLength({min:32,max:32})
], RegisterFinish);
// login/challenge
app.post('/api/2fa/pklogin/start', urlencodedparser, [
    body('username').notEmpty().escape()
], LoginStart);
app.post('/api/2fa/pklogin/finish', bodyParser.json(), [
    body('username').notEmpty().escape()
], LoginFinish);

app.post('/api/signup', [
    // critical vulnerability before this!!
    body('un').isLength({min:6,max:25}).isAlphanumeric('en-US').notEmpty().escape().not().contains('anonymous'),
    body('pw').isStrongPassword({minLength:8,minNumbers:2,minSymbols:2,minUppercase:2}).notEmpty().escape(),
    body('em').notEmpty().isEmail().escape(),
    body('nm').notEmpty().escape(),
], (req,res)=>SignupPOSTHandler(req, res, config));

app.post('/api/account/changePassword', urlencodedparser, [
    cookie('token').notEmpty().escape(),
    body('currentPassword').notEmpty().escape(),
    body('newPassword').isStrongPassword({minLength:8,minNumbers:2,minSymbols:2,minUppercase:2}).notEmpty().escape()
], POSTPasswordChange);

app.post('/api/user/delFile', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        let token = req.cookies.token;
        if (fs.existsSync(`./content/${getUsername(token)}/${fields.filename}`)) {
            fs.rmSync(`./content/${getUsername(token)}/${fields.filename}`);
            res.redirect(`/manage/content`);
        } else {
            res.render('manage_failed.ejs', { 'error': 'File does not exist in your profile.' });
        }
    })
})

app.post('/api/admin/delFile', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        try {
            fs.rmSync(`./content/${fields.username}/${fields.filename}`);
            res.json({ 'code': '200' });
        } catch (e) {
            res.json({ 'code': '404', 'e': e });
        }
    })
})
app.post('/api/admin/resUser', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (fs.existsSync(`./db/userLoginData/${fields.username}.json`)) {
            let userdata = JSON.parse(fs.readFileSync(`./db/userLoginData/${fields.username}.json`));
            let newdata = {
                password: userdata.password,
                email: userdata.email,
                name: userdata.name,
                restricted: fields.reason
            };
            fs.writeFileSync(`./db/userLoginData/${fields.username}.json`, JSON.stringify(newdata));
            res.json({ 'code': '200' });
        } else res.redirect('/admin');
    })
})
app.post('/api/admin/loginAs', urlencodedparser, [
    body('admin_un').notEmpty().isAlphanumeric().escape(),
    body('admin_pw').notEmpty().isAlphanumeric().escape(),
    body('user_un').notEmpty().isAlphanumeric().escape(),
], (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields) => {
        if (verifyLogin(fields.un, fields.pw)) {
            warn('admin', `An admin is logging in as user '${fields.user}'`)
            let token = genNewToken(32);
            let session = {
                user: fields.user,
            };

            if (checkRestriction(token) === false) {
                res.cookie(`token`, token, { expires: new Date(Date.now() + 604800000) });
                res.redirect('/home');
                fs.writeFileSync(`./db/sessionStorage/${token}.json`, JSON.stringify(session));
            } else res.render('forbidden.ejs', { reason: checkRestriction(token) });
        } else {
            res.render('forbidden.ejs', { 'reason': 'Invalid Administrator Credentials' })
        }
    });
});

app.get('/view/:user/:item', [
    param('user').notEmpty().escape(),
    param('item').notEmpty().escape(),
], GenerateSafeViewPage);

app.get('/wallpaper', (req, res) => {
    if (req.query.moe == "true") {
        res.render('landing/okayu_noBar.ejs', { pagetitle: "waffle.moe", desc: "not much is here yet" });
    } else res.render('landing/okayu_noBar.ejs', { pagetitle: "OkayuCDN Wallpaper", desc: "Landing page without the navbar!" });
})


// New account things (file storage size)
app.get('/api/qus', (req, res) => {
    let user = req.query.user;
    let size = 0;
    if (!fs.existsSync(`./content/${req.query.user}`)) {
        res.json({ size: 0, userTS: 26843545600 });
        return;
    }
    try {
        let udat = JSON.parse(fs.readFileSync(`./db/userLoginData/${user}.json`, 'utf-8'));
        let totalUserStorage = udat.storage;
        fs.readdir(`./content/${user}`, (err, files) => {
            if (err) {
                error('QueryUserStorage (index)', err);
                res.json({size:0,userTS:0});
                return;
            }
            files.forEach(file => {
                //info('QUS', `Queried ${file}`);
                size += fs.statSync(`./content/${user}/${file}`).size;
            });
            if (!udat.premium) res.json({ size: size, userTS: totalUserStorage }); else res.json({ size: size, userTS: 1099511627776 });
        });
    } catch (err) {
        error('QueryUserStorage (index)', err);
        res.json({ size: 0, userTS: 26843545600 });
    }
})
function qus(user) {
    try {
        let udat = JSON.parse(fs.readFileSync(`./db/userLoginData/${user}.json`, 'utf-8'));
        let totalUserStorage = udat.storage;
        let size = 0;
        fs.readdirSync(`./content/${user}`, (err, files) => {
            if (err) {
                error('QueryUserStorage (index)', err);
                return {size:0,userTS:0};
            }
            files.forEach(file => {
                size += fs.statSync(`./content/${user}/${file}`).size;
            });
            if (!udat.premium) return { size: size, userTS: totalUserStorage }; else return { size: size, userTS: 1099511627776 };
        })
    }
    catch (e) {
        error('QueryUserStorage (index)', e);
        return { size: 0, userTS: 26843545600 };
    }
}

app.get('/api/quc', (req, res) => {
    let list = [];
    let sizelist = [];
    let usf = `./content/${req.query.user}`;
    if (!fs.existsSync(usf)) {
        res.json({ listing: { 0: "You haven't uploaded anything." }, sizelist: { 0: 0 } });
        return;
    }
    fs.readdir(usf, (err, files) => {
        files.forEach(file => {
            list.push(file);
            sizelist.push(fs.statSync(`${usf}/${file}`).size);
        });
        res.json({ listing: list, sizelist: sizelist });
    });
});

app.get('/api/cec', (req, res) => {
    let user = req.query.user;
    let file = req.query.file;
    if (!user || !file) {
        res.send("<h1>400</h1> <hr> <h3>Please append queries \"?user=USERNAME&file=FILENAME\" to your request!</h3>");
    } else {
        res.json({ result: fs.existsSync(`./content/${user}/${file}`) });
    }
});

app.get('/api/getres', (req, res) => {
    let user = req.query.user;
    let service = req.query.service;
    if (!user || !service) {
        res.send("<h1>400</h1> <hr> <h3>Please append queries \"?user=USERNAME&service=SERVICE\" to your request!</h3>");
    } else {
        if (!fs.existsSync(`./cache/${user}.${service}.json`)) {
            res.json({
                code:"SCH-RNF",
                details:"Upload verification failed. Try refreshing and trying again."
            });
            res.end();
            return;
        }
        res.json(JSON.parse(fs.readFileSync(`./cache/${user}.${service}.json`, 'utf-8')));
        fs.rmSync(path.join(__dirname, `/cache/${user}.${service}.json`));
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        health:"OK",
        version: pjson.version,
        datecode: pjson.datecode,
        config:{
            start_flags: config.start_flags,
            port: config.port,
            domain: config.domain,
            announcement: {
                active: config.announcement.active,
                content: config.announcement.active?config.announcement.content:'No announcement at this time.'
            }
        },
        system:{
            platform:process.platform,
            cpu:"NOINFO",
            mem:{
                systotal:Math.ceil((require('os').totalmem() / 1000000)*100)/100+'MB',
                malloc:Math.ceil((process.memoryUsage().rss / 1000000)*100)/100+'MB',
                used:Math.ceil((process.memoryUsage().heapUsed / 1000000)*100)/100+'MB',
            }
        },
        desktop_supported:true,
        desktop_min_version:'1.0.0'
    });
});


// for testing
app.get('/test', (req, res) => {
    res.render('test.ejs');
})


app.use((err, req, res, next) => { // 500 error handler
    error('500 Request', `${req.method} ${req.originalUrl}`);
    error('express', err.stack);
    if (req.method == 'GET') {
        res.status(500).render('err500.ejs');
    } else {
        res.status(500).json({status:500,error:'Internal Server Error'});
    }
})

// Keep Last !! 404 handler
app.get('*', (req, res) => {
    res.render("notfound.ejs", {'version': pjson.version});
})


// warning as anonymous uploading is unsafe unless youre using a private server
if (config.start_flags.indexOf('DISABLE_ANONYMOUS_UPLOADING') == -1) {
    warn('OkayuCDN', 'You have anonymous uploading enabled. It is not recommended to use anonymous uploading unless you are running a private server. You can disable anonymous uploading by adding "DISABLE_ANONYMOUS_UPLOADING" in the "start_flags" section of your config.json')
}

// Listen on port (use nginx to reverse proxy)
app.listen(config.port)
    .on('error', (err) => {
        error('boot', `Failed to listen on ${config.port}! Is it already in use?`);
        error('express', err);
        process.exit(1);
    })
    .on('listening', () => {
        info('express', `Listening on port ${config.port}`);
    });