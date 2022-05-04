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


// POST Request handlers

app.post('/cdnUpload', (req, res) => {
    // to be finished when i can figure out formidable
})