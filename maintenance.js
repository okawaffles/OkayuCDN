var okayuLogger = require('okayulogger');
var config = require('./config.json');
okayuLogger.info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
okayuLogger.info("boot", `Starting in Maintenance Mode! Server must be restarted to change config.`);

var express = require('express');
var fs = require('fs');

var app = express();

app.use(express.static('/views'));
app.use('/assets', express.static(__dirname + '/views/assets'));
app.set('view engine', 'ejs');


app.get('/content/:user/:item', (req, res) => {
    let user = req.params.user;
    let item = req.params.item;
    let file = "none";
    try {
        file = fs.readFileSync(`./content/${user}/${item}`);
        if (file == "none") {
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
    res.status(503);
    res.json({'status':'503','description':'Server is down for maintenance.'})
})

app.get('*', (req, res) => {
    res.render('maintenance.ejs', { 'version':config.version + config.buildType});
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