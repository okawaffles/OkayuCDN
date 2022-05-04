var okayuLogger = require('./cs-modules/okayuLogger/index.js')
var express = require('express.js');
var app = express();
app.use(express.static('/views'));

var config = require('config.json');

okayuLogger.info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
okayuLogger.info("boot", `Server must be restarted to change config.\nAccount Creation: ${config.enableAccountCreation}\nUploading: ${config.enableUploading}\nAnonymous Uploading (if available): ${config.enableAnonymousUploading}`);

