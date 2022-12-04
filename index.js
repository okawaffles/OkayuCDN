// By okawaffles
// v5 - 2022
// I'm so proud of how far I've come.


const fs = require('fs');
const cache = require('./cs-modules/cacheHelper');

// Check+Load dependencies
let express, cookieParser, formidable, cryplib, ytdl, chalk, path;
const { info, warn, error } = require('okayulogger');
try {
    require('okayulogger');
    express = require('express');
    cookieParser = require('cookie-parser');
    formidable = require('formidable');
    if (parseInt(process.version.split('v')[1].split('.')[0]) < 15)
        error('boot', 'Your node version does not support crypto!');
    cryplib = require('crypto'); // switched away from npm crypto to built-in crypto
    ytdl = require('ytdl-core');
    chalk = require('chalk');
    path = require('path');

    require('ejs'); // do not assign ejs to a variable as we don't need to
} catch (e) {
    console.log('Error: Missing dependencies. Please run "npm ci"!');
    console.log(e);
    process.exit(1);
}

// Check+Load config
let config;
try {
    config = require('./config.json');
} catch (e) {
    error('boot', 'Could not load server config (config.json)');
    error('boot', e);
    // write new config later
    process.exit(1);
}

// Prepare express
let app = express();
app.set('view engine', 'ejs');
app.use(express.static('/views'));
app.use('/assets', express.static(__dirname + '/views/assets'));
app.use(cookieParser());
// this function shows the IP of every request:
app.use('*', (req, res, next) => {
    res.setHeader('X-Powered-By', `OkayuCDN ${config.version}${config.build_type}`);
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    let pip = ip;
    if (fs.existsSync(`./db/ip403/${pip}`)) {
        res.render('forbidden.ejs', { "reason": fs.readFileSync(`./db/ip403/${pip}`) });
        info('RequestInfo', `[IP-BAN] ${pip} :: ${req.method} ${req.originalUrl}`);
    } else {
        info('RequestInfo', `${chalk.red(pip)} :: ${chalk.green(req.method)} ${chalk.green(req.originalUrl)}`);
        if (!config.dev_mode)
            next();
        else if (pip == "::1" || pip == "192.168.1.1" || pip == "127.0.0.1")
            next();
        else res.render('forbidden.ejs', { 'reason': 'Server is in development mode.' });
    }
})

// Global variables for something I honestly don't know (likely status, etc?)
let siteStatus = 200;

// Ascii art is no longer required to boot
let asciiart = fs.readFileSync('./asciiart.txt', 'utf-8');
if (!asciiart || config.start_flags["DISABLE_ASCII_ART"]) asciiart = "";
console.log(asciiart);

// end of new index start

info("boot", `Starting OkayuCDN Server ${config.version}${config.build_type}`);
info("boot", `Server must be restarted to change config.`);

// Check to be sure that template.json has been removed
// from /db/sessionStorage and /db/userLoginData
if (fs.existsSync(`./db/sessionStorage/template.json`) || fs.existsSync(`./db/userLoginData/template.json`))
    warn('auth', "template.json is present in either/both /db/sessionStorage or /db/userLoginData. Please remove it.");

// Clean cache and tokens
cache.prepareDirectories();
cache.cleanCache();
if (!config.start_flags.includes("DEV_MODE")) cache.cleanTokens(); // dont clean tokens on devmode boot

// Additional Functions

function hash(string) {
    return cryplib.createHash('sha256').update(string).digest('hex');
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
    let values = JSON.parse(fs.readFileSync('./stats.json'));
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
        fs.writeFileSync('stats.json', JSON.stringify(finalstats));
    }
}

const genNewToken = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');





// Web pages //
// Landing
app.get('/', (req, res) => {
    res.render('landing/okayu.ejs');
    res.end();
});
app.get('/korone', (req, res) => {
    res.render('landing/korone.ejs');
    res.end();
});
app.get('/mira', (req, res) => {
    res.render('landing/mira.ejs');
    res.end();
});

// Main

app.get('/content/:user/:item', (req, res) => {
    let user = req.params.user;
    let item = req.params.item;
    let file = "none";
    try {
        file = fs.readFileSync(`./content/${user}/${item}`);
        if (file != "none") {
            res.send(file);
        } else {
            res.json(
                {
                    'response': '500',
                    'error': 'CDS-FF (DELIVERY_SERVICE_CANNOT_READ)',
                    'description': 'Content found but was unable to be read. Contact support@okawaffles.com if you encounter this error.'
                }
            )
        }
    } catch (err) {
        res.render('404.ejs');
    }
    res.end();
});
app.get('/status', (req, res) => {
    res.json({ 'status': siteStatus });
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
    if (req.query.useBetaSite != "true")
        res.render('home.ejs', { 'version': config.version + config.build_type });
    else
        res.render('./new/home.ejs', { 'version': config.version + config.build_type });
    res.end();
});

app.get('/info', (req, res) => {
    let values = stats('r');
    res.render('info.ejs', { uploads: values.uploads, accounts: values.accounts });
    res.end();
})

app.get('/terms', (req, res) => {
    res.render('terms.ejs');
    res.end();
})
app.get('/account', (req, res) => {
    res.render('myAccount.ejs');
    res.end();
})


app.get('/manage/upload', (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/manage/upload');
    } else if (verifyToken(token)) {
        let isBT = false;
        try {
            isBT = getUserData(token).tags.bugtester;
        } catch (err) {
            isBT = false;
        }
        res.render('upload.ejs', { USERNAME: getUsername(token), isBT: isBT, premium: getPremiumStat(token) });
    } else {
        res.redirect('/login?redir=/manage/upload');
    }
});

app.get('/manage/content', (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/manage/content');
    } else if (verifyToken(token)) {
        res.render('manage.ejs', { USERNAME: getUsername(token) });
    } else {
        res.redirect('/login?redir=/manage/content');
    }
});
app.get('/mybox', (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/mybox');
    } else if (verifyToken(token)) {
        res.render('mybox.ejs', { USERNAME: getUsername(token) });
    } else {
        res.redirect('/login?redir=/mybox');
    }
});

app.get('/login', (req, res) => {
    if (!req.query.redir)
        res.redirect('/login?redir=/home');
    else
        res.render('login.ejs', { redir: req.query.redir });
});
app.get('/logout', (req, res) => {
    if (fs.existsSync(`./db/sessionStorage/${req.cookies.token}.json`)) fs.rmSync(`./db/sessionStorage/${req.cookies.token}.json`);
    res.cookie("token", "logout", { expires: new Date(Date.now() + 604800000) });
    res.redirect('/home');
})

app.get('/signup', (req, res) => {
    if (req.query.useBetaSite) res.render('new/signup.ejs'); else res.render('signup.ejs');
});

app.get('/admin', (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/admin');
    } else if (verifyToken(token)) {
        if (getUsername(token) === "okawaffles" || getUsername(token) === "shears") {
            res.render('admin.ejs');
        } else res.render('forbidden.ejs', { "reason": "No access." });
    } else {
        res.redirect('/login?redir=/admin');
    }
})

app.get('/success', (req, res) => {
    if (!req.query.f) {
        res.status(404);
        res.end();
        return;
    } else {
        res.render('upload_finish.ejs', { l: `https://okayu.okawaffles.com/content/${getUsername(req.cookies.token)}/${req.query.f}` });
    }
});

// POST Request handlers

app.post('/manage/cdnUpload', async (req, res) => {
    info('UserUploadService', 'Got upload-is-done request!');
    const token = req.cookies.token;
    if (!verifyToken(token)) { error('login', 'Token is invalid. Abort.'); return; }
    if (config.start_flags['DISABLE_UPLOADING']) { warn('UserUploadService', 'Uploading is disabled. Abort.'); return; }

    const username = getUsername(token);

    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) { error('formidable', err); return; }
        if (!fs.existsSync(`./content/${username}`))
            fs.mkdirSync(`./content/${username}`);

        const newName = files.file0.originalFilename;
        const newPath = path.join(__dirname, `/content/${username}/${newName}`);
        const oldName = files.file0.filepath;
        // If the user has already uploaded with this filename.
        if (fs.existsSync(`./content/${username}/${newName}`)) {
            error('UserUploadService', 'File already exists, abort.');
            cache.cacheRes('uus', 'nau', username);
            return;
        }
        if (files.file0.size == 0 || !newName || newName.includes(" ")) {
            error('UserUploadService', 'File is either empty or has a non-valid name, abort.');
            cache.cacheRes('uus', 'bsn', username);
            return;
        }
        qus(username, (data) => {
            if (files.file0.size > (data.userTS - data.size)) {
                error('UserUploadService', 'File is too large for user\'s upload limit, abort.');
                cache.cacheRes('uus', 'nes', username);
                return;
            }
        });
        // User passed all checks so far...
        info('UserUploadService', 'User has passed all checks, finish upload.');
        fs.copyFileSync(oldName, newPath, fs.constants.COPYFILE_EXCL, function (err) {
            if (err) {
                error('fs.copyFileSync', err);
                error('UserUploadService', 'Failed to copy file. Caching UUS-ISE for the user.');
                cache.cacheRes('uus', 'ise', username);
            } else {
                info('UserUploadService', 'File upload finished successfully!');
                cache.cacheRes('uus', 'aok', username);

                info('UserUploadService', 'Cleaning temp file...');
                fs.rmSync(oldName, function (err) {
                    if (err) {
                        error('fs.rmSync', err);
                        error('UserUploadService', 'Could not delete the temp file.');
                        return;
                    }
                });
                return;
            }
        });
    });
})

app.post('/login', (req, res) => {
    let redir = req.query.redir;
    let form = new formidable.IncomingForm();
    let username;
    form.parse(req, (err, fields, files) => {
        username = fields.un;
        if (verifyLogin(fields.un, fields.pw)) {
            let token = genNewToken(32);
            let d = new Date();
            let session = {
                user: fields.un
            };

            if (checkRestriction(fields.un) == false) {
                res.cookie(`token`, token, { expires: new Date(Date.now() + 604800000) });
                res.redirect(redir);
                fs.writeFileSync(`./db/sessionStorage/${token}.json`, JSON.stringify(session));
            } else res.render('forbidden.ejs', { reason: checkRestriction(username) });
        } else res.render('error_general', { error: 'Username or password incorrect!' });
    });
});

app.post('/signup', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (!config.start_flags['DISABLE_ACCOUNT_CREATION']) {
            if (!fs.existsSync(`./db/userLoginData/${fields.un}.json`)) {
                if (!(fields.un === "2.otf")) {
                    // Encrypt password with SHA-256 hash
                    let encryptedPasswd = hash(fields.pw);

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
                    fs.writeFileSync(`./db/userLoginData/${fields.un}.json`, JSON.stringify(data));
                    res.redirect(`/login?redir=/home`);
                } else {
                    res.render(`error_general`, { 'error': "This name cannot be used." });
                }
            } else {
                res.render(`error_general`, { 'error': "Username already exists!" });
            }
        } else {
            res.render(`error_general`, { 'error': "Account registration is currently unavailable." });
        }
    });
});

app.post('/manage/delFile', (req, res) => {
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

app.post('/admin/delFile', (req, res) => {
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

app.post('/admin/resUser', (req, res) => {
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
app.post('/admin/loginAs', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields) => {
        if (verifyLogin(fields.un, fields.pw)) {
            warn('admin', `An admin is logging in as user '${fields.user}'`)
            let token = genNewToken(32);
            let d = new Date();
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

app.get('/view/:user/:item', (req, res) => {
    let data;
    try { data = fs.statSync(`./content/${req.params.user}/${req.params.item}`); } catch (err) {
        res.render('404.ejs');
        res.end();
        return;
    }

    res.render('view_info.ejs', {
        username: req.params.user,
        filename: req.params.item,
        filesize: data.size / 1024 / 1024,
        filetype: req.params.item.split('.')[req.params.item.split('.').length - 1]
    });
});

app.get('/wallpaper', (req, res) => {
    if (req.query.moe == "true") {
        res.render('landing/okayu_noBar.ejs', { pagetitle: "waffle.moe", desc: "not much is here yet" });
    } else res.render('landing/okayu_noBar.ejs', { pagetitle: "OkayuCDN Wallpaper", desc: "Landing page without the navbar!" });
})


// New account things (file storage size)
app.get('/qus', (req, res) => {
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
            files.forEach(file => {
                size += fs.statSync(`./content/${user}/${file}`).size;
            });
            if (!udat.premium) res.json({ size: size, userTS: totalUserStorage }); else res.json({ size: size, userTS: 1099511627776 });
        });
    } catch (err) {
        res.json({ size: 0, userTS: 26843545600 });
    }
})
function qus(user) {
    try {
        let udat = JSON.parse(fs.readFileSync(`./db/userLoginData/${user}.json`, 'utf-8'));
        let totalUserStorage = udat.storage;
        let size = 0;
        fs.readdirSync(`./content/${user}`, (err, files) => {
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

app.get('/quc', (req, res) => {
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

app.get('/cec', (req, res) => {
    let user = req.query.user;
    let file = req.query.file;
    if (!user || !file) {
        res.send("<h1>400</h1> <hr> <h3>Please append queries \"?user=USERNAME&file=FILENAME\" to your request!</h3>");
    } else {
        res.json({ result: fs.existsSync(`./content/${user}/${file}`) });
    }
});

app.get('/getres', (req, res) => {
    let user = req.query.user;
    let service = req.query.service;
    if (!user || !service) {
        res.send("<h1>400</h1> <hr> <h3>Please append queries \"?user=USERNAME&service=SERVICE\" to your request!</h3>");
    } else {
        if (!fs.existsSync(`./cache/${user}.${service}.json`)) {
            res.status(404);
            res.end();
            return;
        }
        res.json(JSON.parse(fs.readFileSync(`./cache/${user}.${service}.json`, 'utf-8')));
    }
});

app.get('/devel', (req, res) => {
    res.render(`new/${req.query.p}.ejs`);
})

// Keep Last !! 404 handler
app.get('*', (req, res) => {
    res.render("notfound.ejs", {'version':config.version + config.build_type});
    res.end();
})


// Listen on port (use nginx to reverse proxy)
if (process.argv[2] != "GITHUB_ACTIONS_TEST") {
    if (!config.start_flags.includes("DEV_MODE")) {
        app.listen(config.port).on('error', function (err) {
            error('express', `Failed to listen on port ${config.port}! Is it already in use?`);
            process.exit(1);
        });
    } else {
        app.listen(config.dev_port).on('error', function (err) {
            error('express', `Failed to listen on port ${config.dev_port}! Is it already in use?`);
            process.exit(1);
        });
    }
}

setTimeout(() => {
    info('express', `Listening on port ${config.start_flags.includes("DEV_MODE") ? config.dev_port : config.port}`);
    if (config.start_flags.includes("DEV_MODE")) warn('dev_mode', 'Server is in development mode. Some security features are disabled and non local users cannot access the website.');
}, 1000);