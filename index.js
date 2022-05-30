// By okawaffles
// v3 - 2022
// I'm so proud of how far I've come.

var okayuLogger = require('./cs-modules/okayuLogger/index.js');
var fs = require('fs');

// Check dependencies

try {
    require('express');
    require('cookie-parser');
    require('ejs');
    require('formidable');
    require('crypto');
    require('ytdl-core');
    require('cors')
} catch (err) { // exit if fail
    okayuLogger.error('boot', "Missing dependencies! Please install express, cookie-parser, formidable, crypto, ytdl-core, cors, and ejs");
    okayuLogger.info('boot', "Exit...");
    process.exit(-1);
}



// requirements and setup

var cookieParser = require('cookie-parser');
var formidable = require('formidable');
var express = require('express');
var cryplib = require('crypto');
var ytdl = require('ytdl-core');

var app = express();

app.use(express.static('/views'));
app.use('/assets', express.static(__dirname + '/views/assets'));
app.use(cookieParser());
app.set('view engine', 'ejs');

var siteStatus = 200;

// load config...

var config = require('./config.json');

okayuLogger.info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
okayuLogger.info("boot", `Server must be restarted to change config.\nAccount Creation: ${config.enableAccountCreation}\nUploading: ${config.enableUploading}\nAnonymous Uploading (not implemented): ${config.enableAnonymousUploading}`);

// Check to be sure that template.json has been removed
// From /db/sessionStorage and /db/userLoginData
if (fs.existsSync(`./db/sessionStorage/template.json`) || fs.existsSync(`./db/userLoginData/template.json`)) okayuLogger.warn('auth', "Template JSONs have not been deleted! Please delete them from the database!");

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

function verifyToken(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/sessionStorage/${token}.json`));
        var d = new Date();
        if (userData.expires > d.getMilliseconds()) return true; else return false;
    } else return false;
}
function checkRestriction(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${getUsername(token)}.json`));
        if (userData.restricted) {
            okayuLogger.info('login', `${getUsername(token)} is banned for ${userData.restricted}`);
            return userData.restricted;
        } else return false;
    } else return false;
}

function verifyLogin(username, password) {
    if (fs.existsSync(`./db/userLoginData/${username}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));

        // Encrypt field password (sha256)
        let encryptedPasswd = hash(password);

        // Compare encryption (Unencrypted password is never stored in memory) do they match?
        if (encryptedPasswd === userData.password) return true; else return false;
    } else return false;
}

const genNewToken = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');


app.use('*', (req, res, next) => {
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    ip = ip.split(':');
    let pip = ip[ip.length - 1]
    if (fs.existsSync(`./db/ip403/${pip}`)) {
        let reason = fs.readFileSync(`./db/ip403/${pip}`);
        res.render('forbidden.ejs', { "reason":reason });
        okayuLogger.info('RequestInfo', `[IP-BAN] ${pip} :: ${req.method} ${req.originalUrl}`);
    } else {
        okayuLogger.info('RequestInfo', `${pip} :: ${req.method} ${req.originalUrl}`);
        next();
    }
})


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

// user-viewable

app.get('/content/2.otf', (req, res) => {
    file = fs.readFileSync(`./content/okawaffles/kfhimajimoco.otf`);
    res.send(file);
});

app.get('/content/:user/:item', (req, res) => {
    let user = req.params.user;
    let item = req.params.item;
    let file = "none";
    try {
        file = fs.readFileSync(`./content/${user}/${item}`);
        if (file != "none") {
            res.send(file);
        } else {
            res.jsonp({ 'error':'500','description':'content found but was unable to be read. contact okawaffles#0001 on discord for more information.' })
        }
    } catch (err) {
        res.render('404.ejs');
    }
    res.end();
});
app.get('/status', (req, res) => {
    res.json({'status':siteStatus});
})
app.get('/robots.txt', (req, res) => {
    res.send('./views/assets/robots.txt')
})


// User Viewable Pages
app.get('/home', (req, res) => {
    res.render('home.ejs', { 'version':config.version + config.buildType});
    res.end();
});
app.get('/ja', (req, res) => {
    res.render('home_ja.ejs');
    res.end();
});

app.get('/info', (req, res) => {
    res.render('info.ejs');
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
        res.render('upload.ejs');
    } else {
        res.redirect('/login?redir=/manage/upload');
    }
});

app.get('/manage/content', (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/manage/content');
    } else if (verifyToken(token)) {
        res.render('manage.ejs');
    } else {
        res.redirect('/login?redir=/manage/content');
    }
});

app.get('/login*', (req, res) => {
    let args, redir;
    try {
        args = req.url.split('?')[1];
        redir = args.split('&')[0].split('=')[1];
        res.render('login.ejs', { redir:redir });
    } catch (err) {
        res.redirect('/login?redir=/home')
    }
});
app.get('/logout', (req, res) => {
    if (fs.existsSync(`./db/sessionStorage/${req.cookies.token}.json`)) fs.rmSync(`./db/sessionStorage/${req.cookies.token}.json`);
    res.cookie("token", "logout");
    res.redirect('/home');
})

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

app.get('/admin', (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/admin');
    } else if (verifyToken(token)) {
        if (getUsername(token) === "okawaffles" || getUsername(token) === "shears") {
            res.render('admin.ejs');
        } else res.render('forbidden.ejs', { "reason":"admin-panel-denied-message" });
    } else {
        res.redirect('/login?redir=/admin');
    }
})

// POST Request handlers

app.post('/manage/cdnUpload', (req, res) => {
    okayuLogger.info('upload', 'Recieved upload POST... working...');
    if (config.enableUploading) {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            okayuLogger.info('upload', 'Parsing form and files...');
            var token = req.cookies.token;

            if (!fs.existsSync(`./content/${getUsername(token)}`)) // when uploading on a new account
                fs.mkdirSync(`./content/${getUsername(token)}`);

            if (!fs.existsSync(`./content/${getUsername(token)}/${fields.filename}`)) {
                var oldPath = files.uploaded.filepath;
                var fExt = files.uploaded.originalFilename.split('.').at(-1);
                var newPath = `./content/${getUsername(token)}/${fields.filename}.${fExt}`

                okayuLogger.info('upload', `User ${getUsername(token)} is uploading ${fields.filename}.${fExt} ...`);

                fs.rename(oldPath, newPath, function (err) {
                    if (err) {
                        okayuLogger.error('upload', err);
                        res.render('upload_failed.ejs', { 'error': 'Unknown Internal Server Error' });
                    } else {
                        res.render('upload_success.ejs', { 'link': `https://okayu.okawaffles.com/content/${getUsername(token)}/${fields.filename}.${fExt}` });
                        okayuLogger.info('upload', 'Finished!');
                    }
                })
            } else res.render('upload_failed.ejs', { 'error': "You already have a file uploaded with that name!" })
        })
    } else res.render('upload_failed.ejs', { 'error': 'Uploading is currently disabled.' })
});

app.post('/login?*', (req, res) => {
    let args = req.url.split('?')[1];
    let redir = args.split('&')[0].split('=')[1];
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (verifyLogin(fields.un, fields.pw)) {
            let token = genNewToken(32);
            let d = new Date();
            let session = {
                user: fields.un,
                expires: parseInt((d.getMilliseconds() + 604800000))
            };
            
            if (checkRestriction(token) === false) {
                res.cookie(`token`, token); 
                res.redirect(redir); 
                fs.writeFileSync(`./db/sessionStorage/${token}.json`, JSON.stringify(session));
            } else res.render('forbidden.ejs', { reason:checkRestriction(token) });
        } else res.render('login_failed.ejs', { redir:redir });
    });
});

app.post('/signup', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (config.enableAccountCreation) {
            if (!fs.existsSync(`./db/userLoginData/${fields.un}.json`)) {
                if (!(fields.un === "2.otf")) {
                    // Encrypt password with SHA-256 hash
                    let encryptedPasswd = hash(fields.pw);

                    let data = {
                        password: encryptedPasswd,
                        email: fields.em,
                        name: fields.nm,
                    };
                    fs.writeFileSync(`./db/userLoginData/${fields.un}.json`, JSON.stringify(data));
                    res.redirect(`/login?redir=/home`);
                } else {
                    res.render(`signup_failed`, { 'error': "This name cannot be used." });
                }
            } else {
                res.render(`signup_failed`, { 'error': "Username already exists!" });
            }
        } else {
            res.render(`signup_failed`, { 'error': "Account registration is currently unavailable." });
        }
    });
});

app.post('/manage/delFile', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        let token = req.cookies.token;
        if (fs.existsSync(`./content/${getUsername(token)}/${fields.filename}`)) {
            fs.rmSync(`./db/content/${getUsername(token)}/${fields.filename}`);
            res.redirect(`/manage/content`);
        } else {
            res.render('manage_failed.ejs', { 'error': 'File does not exist in your profile.' });
        }
    })
})

app.post('/admin/delFile', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (fs.existsSync(`./content/${fields.username}/${fields.filename}`)) {
            fs.rmSync(`./db/content/${fields.username}/${fields.filename}`);
            res.json({'code':'200'});
        } else res.redirect('/admin');
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
            res.json({'code':'200'});
        } else res.redirect('/admin');
    })
})
app.post('/admin/loginAs', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields) => {
        if(verifyLogin(fields.un, fields.pw)) {
            let token = genNewToken(32);
            let d = new Date();
            let session = {
                user: fields.user,
                expires: parseInt((d.getMilliseconds() + 604800000))
            };
            
            if (checkRestriction(token) === false) {
                res.cookie(`token`, token); 
                res.redirect('/home'); 
                fs.writeFileSync(`./db/sessionStorage/${token}.json`, JSON.stringify(session));
            } else res.render('forbidden.ejs', { reason:checkRestriction(token) });
        } else {
            res.render('forbidden.ejs', {'reason':'Invalid Administrator Credentials'})
        }
    });
});

// extra sites for friends
app.get(`/ytdl_mp3`, (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/ytdl_mp3');
    } else if (verifyToken(token)) {
        res.render('hosted/ytdl.ejs');
    } else {
        res.redirect('/login?redir=/ytdl_mp3');
    }
});
app.post(`/ytdl3`, (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        let token = req.cookies.token;

        if (!fs.existsSync(`./content/${getUsername(token)}`)) // when uploading on a new account
            fs.mkdirSync(`./content/${getUsername(token)}`);

        if (fields.link.includes('watch?v=')) {
            let dest = fs.createWriteStream(`./content/${getUsername(token)}/${hash(fields.link)}.mp3`);
            ytdl(fields.link, { filter: 'audioonly' }).pipe(dest);
            dest.on('finish', () => {
                res.redirect(`/content/${getUsername(token)}/${hash(fields.link)}.mp3`);
                res.end();
            })
        } else {
            res.json({
                'error': '404', 'desc': 'Link is invalid'
            });
            res.end();
        }
    })
})


// Keep Last !! 404 handler
app.get('*', (req, res) => {
    res.render("404.ejs");
    res.end();
})


// Listen on port (use nginx to reverse proxy)
var server;
try {
    server = app.listen(config.port, () => {
        okayuLogger.info('express', `Listening on port ${config.port}`);
    });
    server.setTimeout(18000000);
} catch (err) {
    okayuLogger.error('express', "Failed to start server. Port is already in use!");
    process.exit(-1);
}