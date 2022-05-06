var okayuLogger = require('./cs-modules/okayuLogger/index.js');

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

var fs = require('fs');
var cookieParser = require('cookie-parser');
var formidable = require('formidable');
var express = require('express');
var app = express();
app.use(express.static('/views'));
app.use('/assets', express.static(__dirname + '/views/assets'));
app.use(cookieParser());

var config = require('./config.json');

okayuLogger.info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
okayuLogger.info("boot", `Server must be restarted to change config.\nAccount Creation: ${config.enableAccountCreation}\nUploading: ${config.enableUploading}\nAnonymous Uploading (if available): ${config.enableAnonymousUploading}`);

// Additional Functions

function verifyToken(token) {
    if (fs.existsSync(`./db/tokens/${token}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/tokens/${token}.json`));
        var d = new Date();
        if (userData.expires > d.getMilliseconds()) return true; else return false;
    } else return false;
}

function verifyLogin(username, password) {
    if (fs.existsSync(`./db/userData/${username}.json`)) {
        var userData = JSON.parse(fs.readFileSync(`./db/userData/${username}.json`));
        if (username === userData.un && password === userData.pw) return true; else return false;
    } else return false;
}

function genNewToken(username) {
    var a = new Uint32Array(1);
    Crypto.getRandomValues(a);
    return a[0];
}


// Web pages

app.get('/', (req, res) => {
    res.render('landing.ejs');
    res.end();
});
app.get('/korone', (req, res) => {
    res.render('landing_korone.ejs');
    res.end();
});
app.get('/mira', (req, res) => {
    res.render('landing_mira.ejs');
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


app.get('/manage/upload', (req, res) => {
    res.render('upload.ejs');
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
});

// POST Request handlers

app.post('/cdnUpload', (req, res) => {
    // to be finished when i can figure out formidable
});

app.post('/login', (req, res) => {
    // tbf when i can figure out formidable
});


// KEEP LAST!!
app.get('./*', (req, res) => {
    res.render("404.ejs");
    res.end();
})


// Listen on port
var server = app.listen(config.port, () => {
    okayuLogger.info('express', `Listening on port ${config.port}`);
});
server.setTimeout(18000000);