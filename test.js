var config = require('./config.json');
const {info, error, warn} = require('okayulogger');

info("boot", `Starting OkayuCDN Server ${config.version}${config.buildType}`);
info("boot", `Server must be restarted to change config.\nAccount Creation: ${config.enableAccountCreation}\nUploading: ${config.enableUploading}\nAnonymous Uploading (not implemented): ${config.enableAnonymousUploading}`);
warn("test", "Server is starting in TEST MODE!");

require('express');
require('cookie-parser');
require('ejs');
require('formidable');
require('crypto');
require('ytdl-core');

info('test', "Test pass!");
info('server', "Exit...");