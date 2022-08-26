// By okawaffles
// v3 - 2022
// I'm so proud of how far I've come.

var okayuLogger = require('./cs-modules/okayuLogger/index.js');
let reqProcessor = require('./cs-modules/reqProcessor');
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
    okayuLogger.error('boot', "Missing dependencies! Please run 'npm ci'");
    okayuLogger.info('boot', "Exit...");
    process.exit(1);
}



// requirements and setup

var cookieParser = require('cookie-parser');
var formidable = require('formidable');
var express = require('express');
var cryplib = require('crypto');
var ytdl = require('ytdl-core');
let nodemailer, nmcfg; // nodemailer (if used)

var app = express();

app.use(express.static('/views'));
app.use('/assets', express.static(__dirname + '/views/assets'));
app.use(cookieParser());
app.set('view engine', 'ejs');

var siteStatus = 200;

// load config...

var config = require('./config.json');

if (config.useNodeMailer) {
    nodemailer = require('nodemailer');
    nmcfg = require('./nodemailer_config.json');
}

let asciiart = fs.readFileSync('./asciiart.txt', 'utf-8');
console.log(asciiart);
okayuLogger.info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
okayuLogger.info("boot", `Server must be restarted to change config.`);

// Check to be sure that template.json has been removed
// from /db/sessionStorage and /db/userLoginData
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
function getPremiumStat(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/sessionStorage/${token}.json`));
        return userData.premium;
    }
}

function verifyToken(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/sessionStorage/${token}.json`));
        var d = new Date();
        if (userData.expires > d.getTime()) return true; else return false;
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

        // Compare encryption (Unencrypted password is never stored in database) do they match?
        if (encryptedPasswd === userData.password) return true; else return false;
    } else return false;
}

const genNewToken = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');


app.use('*', (req, res, next) => {
    res.setHeader('X-Powered-By', "OkayuCDN");
    var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    ip = ip.split(':');
    let pip = ip[ip.length - 1]
    if (fs.existsSync(`./db/ip403/${pip}`)) {
        let reason = fs.readFileSync(`./db/ip403/${pip}`);
        res.render('forbidden.ejs', { "reason":reason });
        okayuLogger.info('RequestInfo', `[IP-BAN] ${pip} :: ${req.method} ${req.originalUrl}`);
    } else {
        okayuLogger.info('RequestInfo', `${pip} :: ${req.method} ${req.originalUrl}`);
        //reqProcessor.process(req.method, ip, req.originalUrl);
        if (!config.dev_mode) {
            next();
        } else {
            if ( pip == "192.168.1.229" || pip == "192.168.1.1" || pip == "127.0.0.1" ) next(); else res.render('forbidden.ejs', {'reason':'Server is in development mode.'} );
        }
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
    file = fs.readFileSync(`./views/assets/fonts/kfhimajimoco.otf`);
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
    res.send(fs.readFileSync('./views/assets/robots.txt'))
})
app.get('/favicon.ico', (req, res) => {
    res.send('/views/assets/favicon.ico');
})


// User Viewable Pages
app.get('/home', (req, res) => {
    if (req.query.useBetaSite != "true")
        res.render('home.ejs', {'version':config.version + config.buildType});
    else
        res.render('home_beta.ejs', {'version':config.version + config.buildType});
    res.end();
});
app.get('/ja', (req, res) => {
    res.render('japanese/home.ejs');
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
        res.render('upload.ejs', { USERNAME:getUsername(token) });
    } else {
        res.redirect('/login?redir=/manage/upload');
    }
});

app.get('/manage/content', (req, res) => {
    let token = req.cookies.token;
    if (!token) {
        res.redirect('/login?redir=/manage/content');
    } else if (verifyToken(token)) {
        res.render('manage.ejs', {USERNAME:getUsername(token)});
    } else {
        res.redirect('/login?redir=/manage/content');
    }
});

app.get('/login', (req, res) => {
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
        } else res.render('forbidden.ejs', { "reason":"No access." });
    } else {
        res.redirect('/login?redir=/admin');
    }
})

app.get('/success', (req, res) => {
    if(!req.query.f) {
        res.status(404);
        res.end();
        return;
    } else {
        res.render('upload_finish.ejs', {l:`https://okayu.okawaffles.com/content/${getUsername(req.cookies.token)}/${req.query.f}`});
    }
});

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

            if (!fs.existsSync(`./content/${getUsername(token)}/${files.file0.originalFilename}`)) {
                if (files.file0.originalFilename.includes(" ") || files.file0.size == 0) {
                    okayuLogger.info('upload', 'file is empty or bad name, return.')
                    return;
                }

                var oldPath = files.file0.filepath;
                var fExt = files.file0.originalFilename.split('.').at(-1);
                var newPath = `./content/${getUsername(token)}/${files.file0.originalFilename}`;
                console.log({newPath});
    
                okayuLogger.info('upload', `User ${getUsername(token)} is uploading ${files.file0.originalFilename} ...`);

                fs.rename(oldPath, newPath, function (err) {
                    if (err) {
                        okayuLogger.error('upload', err);
                    } else {
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
                expires: parseInt((d.getTime() + 604800))
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
                        storage: 26843545600,
                        premium:false
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

app.get('/wallpaper', (req, res) => {
    res.render('landing/okayu_noBar.ejs');
})


// New account things (file storage size)
app.get('/qus', (req, res) => {
    let user = req.query.user;
    let udat = JSON.parse(fs.readFileSync(`./db/userLoginData/${user}.json`, 'utf-8'));
    let totalUserStorage = udat.storage;
    let size = 0;
    fs.readdir(`./content/${user}`, (err, files) => {
        files.forEach(file => {
            size += fs.statSync(`./content/${user}/${file}`).size;
        });
        if (!udat.premium) res.json({size:size, userTS:totalUserStorage}); else res.json({size:size, userTS:1099511627776});
    })
})
function qus(user) {
    let udat = JSON.parse(fs.readFileSync(`./db/userLoginData/${user}.json`, 'utf-8'));
    let totalUserStorage = udat.storage;
    let size = 0;
    fs.readdir(`./content/${user}`, (err, files) => {
        files.forEach(file => {
            size += fs.statSync(`./content/${user}/${file}`).size;
        });
        if (!udat.premium) return {size:size, userTS:totalUserStorage}; else return {size:size, userTS:1099511627776};
    })
}

app.get('/quc', (req, res) => {
    let list = [];
    let sizelist = [];
    let usf = `./content/${req.query.user}`;
    fs.readdir(usf, (err, files) => {
        files.forEach(file => {
            list.push(file);
            sizelist.push(fs.statSync(`${usf}/${file}`).size);
        });
        res.json({listing:list,sizelist:sizelist});
    });
});

app.get('/cec', (req, res) => {
    let user = req.query.user;
    let file = req.query.file;
    if (!user || !file) {
        res.send("<h1>400</h1> <hr> <h3>Please append queries \"?user=USERNAME&file=FILENAME\" to your request!</h3>");
    } else {
        res.json({result:fs.existsSync(`./content/${user}/${file}`)});
    }
})


// Keep Last !! 404 handler
app.get('*', (req, res) => {
    res.render("404.ejs");
    res.end();
})


// Listen on port (use nginx to reverse proxy)
var server;
server = app.listen(config.port).on('error', function(err) {
    okayuLogger.error('express', `Failed to listen on port ${config.port}! It is already in use!`);
    process.exit(1);
});

setTimeout(() => {
    okayuLogger.info('express', `Listening on port ${config.port}`);
}, 1000);