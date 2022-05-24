var config = require('./config.json');
var okayuLogger = require('./cs-modules/okayuLogger/index.js');

okayuLogger.info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
okayuLogger.info("boot", `Server must be restarted to change config.\nAccount Creation: ${config.enableAccountCreation}\nUploading: ${config.enableUploading}\nAnonymous Uploading (not implemented): ${config.enableAnonymousUploading}`);
okayuLogger.warn("test", "Server is starting in TEST MODE!");

require('express');
require('cookie-parser');
require('ejs');
require('formidable');
require('crypto');
require('ytdl-core');

okayuLogger.info('test', "Test pass!");
okayuLogger.info('server', "Exit...");