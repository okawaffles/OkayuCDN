var okayuLogger = require('./cs-modules/okayuLogger/index.js');
var fs = require('fs');

try {
    require('express');
    require('cookie-parser');
    require('ejs');
    require('formidable');
} catch(err) {
    okayuLogger.error('boot', "Missing dependencies! Please install express, cookie-parser, formidable, and ejs");
    okayuLogger.info('boot', "Exit...");
    process.exit(-1);
}

var cookieParser = require('cookie-parser');
var formidable = require('formidable');
var express = require('express');
var app = express();
app.use(express.static('/views'));
app.use('/assets', express.static(__dirname + '/views/assets'));
app.use(cookieParser());
app.set('view engine', 'ejs');
// app.use((req, res, next) => { res.status(404).render("404.ejs"); })

var config = require('./config.json');

okayuLogger.info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
okayuLogger.info("boot", `Server must be restarted to change config.\nAccount Creation: ${config.enableAccountCreation}\nUploading: ${config.enableUploading}\nAnonymous Uploading (not implemented): ${config.enableAnonymousUploading}`);

// Check to be sure that template.json has been removed
// From /db/sessionStorage and /db/userLoginData
if (fs.existsSync(`./db/sessionStorage/template.json`) || fs.existsSync(`./db/userLoginData/template.json`)) okayuLogger.warn('auth', "Template JSONs have not been deleted! Please delete them from the database!");

// Additional Functions

function verifyToken(token) {
    if (fs.existsSync(`./db/sessionStorage/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/sessionStorage/${token}.json`));
        var d = new Date();
        if (userData.expires > d.getMilliseconds()) return true; else return false;
    } else return false;
}

function verifyLogin(username, password) {
    if (fs.existsSync(`./db/userLoginData/${username}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userLoginData/${username}.json`));
        if (password === userData.password) return true; else return false;
    } else return false;
}

const genNewToken = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');


// Web pages

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

app.get('/content/*', (req, res) => {
    let user = req.url.split('/')[2];
    let item = req.url.split('/')[3];
    let file = "none"; 
    try {
        file = fs.readFileSync(`./content/${user}/${item}`);
        if (file != "none") {
            res.send(file);
        }
    } catch(err) {
        res.render('404.ejs');
    }
    res.end();
});


// User Viewable Pages
app.get('/home', (req, res) => {
    res.render('home.ejs');
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


app.get('/manage/upload', (req, res) => {
    let token = req.cookies.token;
    if (!token) { 
        res.redirect('/login');
    } else if (verifyToken(token)) {
        res.render('upload.ejs');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

// POST Request handlers

app.post('/cdnUpload', (req, res) => {
    if (config.enableUploading) {
        // to be finished when i can figure out formidable
    } else res.render('upload_failed.ejs', { 'error':'Uploading is currently disabled.' })
});

app.post('/login', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (verifyLogin(fields.un, fields.pw)) { 
            let token = genNewToken(32);
            let d = new Date();
            let session = {
                user:fields.un,
                expires:parseInt((d.getMilliseconds() + 604800000))
            };
            fs.writeFileSync(`./db/sessionStorage/${token}.json`, JSON.stringify(session));
            res.cookie(`token`, token);
            res.redirect(`/manage/upload`);
        } else res.render('login_failed.ejs');
    });
});
app.post('/signup', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (config.enableAccountCreation) {
            if (!fs.existsSync(`./db/userLoginData/${fields.un}.json`)) {
                let data = {
                    password:fields.pw,
                    email:fields.em,
                    name:fields.nm,
                };
                fs.writeFileSync(`./db/sessionStorage/${fields.un}.json`, JSON.stringify(data));
                res.redirect(`/login`);
            } else {
                res.render(`signup_failed`, { 'error':"Username already exists!" });
            }
        } else {
            res.render(`signup_failed`, { 'error':"Account registration is currently unavailable." });
        }
    });
});

// KEEP LAST!!
app.get('*', (req, res) => {
    res.render("404.ejs");
    res.end();
})


// Listen on port
var server = app.listen(config.port, () => {
    okayuLogger.info('express', `Listening on port ${config.port}`);
});
server.setTimeout(18000000);