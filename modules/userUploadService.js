const { validationResult, matchedData } = require("express-validator");
const { createWriteStream, statSync, rmSync, copyFileSync, copyFile } = require("node:fs");
const { join } = require('node:path');
const { info, error } = require("okayulogger");
const { QueryUserStorage } = require("./accountHandler");
const { VerifyToken, GetUsernameFromToken } = require(join(__dirname, 'accountHandler.js'));
const { cacheRes } = require(join(__dirname, '..', 'parts', 'cacheHelper', 'index.js'));

/**
 * Manages uploading a file while checking sanitization as well.
 * @param {Request} req Express Request object
 * @param {Response} res Express Response object
 * @param {Object} serverConfig the config loaded on boot
 * @param {string} dirname the dirname of the idnex file
 */
function POSTUpload(req, res, serverConfig, dirname) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        error('UUS', 'Upload failed due to sanitizier rejection');
        res.json({success:false,reason:"Sanitizer rejected request."});
        return;
    }

    if (serverConfig.start_flags['DISABLE_UPLOADING']) {
        error('UUS', 'Uploading is disabled, rejecting');
        const username = GetUsernameFromToken(data.token);
        cacheRes('uus', 'une', username);
        res.json({success:false,reason:"Uploading is disabled."});
        return;
    }

    const data = matchedData(req);

    // validate token
    if (!VerifyToken(data.token)) {
        console.log(data);
        error('UUS', 'Bad token, rejecting upload');
        res.json({success:false,reason:"Authentication failure."});
        return;
    }

    // TODO: Check filesize after upload to ensure its ok

    // get username...
    const username = GetUsernameFromToken(data.token);

    req.pipe(req.busboy);

    req.busboy.on('file', (_fieldname, file, filename) => {
        const temp_path = join(dirname, 'cache', 'uploads_temp', filename.filename);
        const stream = createWriteStream(temp_path);
        file.pipe(stream);

        // check if its finished...
        file.on('close', () => {
            stream.close();
            info('UUS', 'Upload success.');

            const stats = statSync(temp_path);
            if (stats.size == 0 || !filename.filename || filename.filename.includes(' ')) {
                cacheRes('UUS', 'BSN', username); // client-side handles cached results
                rmSync(temp_path);
                return;
            }
            // check size limits
            let userStorage = QueryUserStorage(username);
            if (userStorage.size + stats.size > userStorage.userTS) {
                cacheRes('UUS', 'NES', username);
                rmSync(temp_path);
                return;
            }

            // otherwise, success!
            // copy the file to their directory
            copyFile(temp_path, join(dirname, 'content', username, filename.filename), () => {
                // wait for copy to finish
                cacheRes('UUS', 'AOK', username);
                rmSync(temp_path);
            });
        });
    });
}

module.exports = {
    POSTUpload
}