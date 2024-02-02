const { validationResult, matchedData } = require("express-validator");
const { createWriteStream } = require("node:fs");
const { join } = require('node:path');
const { error } = require("okayulogger");
const { VerifyToken } = require(join(__dirname, 'accountHandler.js'));
const { cacheRes } = require(join(__dirname, '..', 'parts', 'cacheHelper', 'index.js'));

function POSTUpload(req, res, serverConfig) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        error('UUS', 'Upload failed due to sanitizier rejection');
        res.json({success:false,reason:"Sanitizer rejected request"});
        return;
    }

    if (!serverConfig.flags['DISABLE_UPLOADING']) {
        error('UUS', 'Uploading is disabled, rejecting');
        return;
    }

    const data = matchedData(req);

    // validate token
    if (!VerifyToken(data.token)) {
        error('UUS', 'Bad token, rejecting upload');
        return;
    }

    req.pipe(req.busboy);

    req.busboy.on('file', (_fieldname, file, filename) => {
        const stream = createWriteStream(join(__dirname, '..', 'cache', 'uploads_temp', filename));
        file.pipe(stream);
    })
}