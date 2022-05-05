var okayuLogger = require('./cs-modules/okayuLogger/index.js');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var express = require('express.js');
var app = express();
app.use(express.static('/views'));
app.use(cookieParser());

var config = require('config.json');

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
});

app.get('/content', (req, res) => {
    var listing = ["listing-placeholder"];
    fs.readdirSync('./content/', (err, files) => {
        files.forEach(element => {
            listing.push(element);
        });
    });

    res.json({"content":listing});
    res.end();
});

app.get('/content/*', (req, res) => {
    let item = req.url.split('/')[2];
    let file = fs.readFileSync(`./content/${item}`);
    if (file) {
        res.send(file);
    } else res.status(404);
    res.end();
});


// User Viewable Pages

app.get('/manage/upload', (req, res) => {
    res.render('upload.ejs');
    res.end();
});

app.get('/login', (req, res) => {
    res.render('login.ejs');
    res.end();
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs');
    res.end();
});


// POST Request handlers

app.post('/cdnUpload', (req, res) => {
    // to be finished when i can figure out formidable
});

app.post('/login', (req, res) => {
    // tbf when i can figure out formidable
});

// Listen on port
var server = app.listen(config.port, () => {
    okayuLogger.info('express', `Listening on port ${config.port}`);
})