var okayuLogger = require('./cs-modules/okayuLogger/index.js');
var config = require('./config.json');
okayuLogger.info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
okayuLogger.info("boot", `Starting in Offline Mode! Server must be restarted to change config.`);

var express = require('express');
var fs = require('fs');

var app = express();

app.use(express.static('/views'));
app.use('/assets', express.static(__dirname + '/views/assets'));
app.set('view engine', 'ejs');

app.get('/status', (req, res) => {
    res.setHeader('X-Powered-By', "OkayuCDN");
    res.json({'status':'503','description':'Server is down for maintenance.'})
})

app.get('*', (req, res) => {
    res.setHeader('X-Powered-By', "OkayuCDN");
    //res.render('offline.ejs', { 'version':config.version + config.buildType});
    res.send("<h1>503 Service Unavailable</h1><hr><h2>Please try again later</h2>");
    res.end();
})

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