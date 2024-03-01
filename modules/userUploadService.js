const { validationResult, matchedData } = require("express-validator");
const { createWriteStream, statSync, rmSync, copyFileSync, copyFile, existsSync } = require("node:fs");
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
 * @param {string} dirname the dirname of the index file
 */
function POSTUpload(req, res, serverConfig, dirname, use_header = false, is_anonymous = false) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        if (use_header || is_anonymous) {
            error('UUS', 'Upload failed due to sanitizier rejection');
            res.status(400).json({success:false,reason:"Sanitizer rejected request.",reason:result.array()});
            return;
        }

        // if the user doesnt provide a cookie auth token
        // but there is an authorization override, we can
        // assume that they are POSTing via the desktop app.
    }

    const data = matchedData(req);

    if (serverConfig.start_flags['DISABLE_UPLOADING']) {
        error('UUS', 'Uploading is disabled, rejecting');
        const username = is_anonymous ? 'anonymous' : GetUsernameFromToken(use_header ? data.authorization : data.token);
        cacheRes('uus', 'une', username);
        res.status(401).json({success:false,reason:"Uploading is disabled."});
        return;
    }

    // validate token
    if (!VerifyToken(use_header ? data.authorization : data.token)) {
        if (!is_anonymous) {
            error('UUS', 'Bad token, rejecting upload');
            res.json({success:false,reason:"Authentication failure."});
            return;
        }
    }

    // TODO: Check filesize after upload to ensure its ok
    // ^ i think this is done but i'm sleepy rn so im not going to delete this

    // get username...
    const username = is_anonymous ? 'anonymous' : GetUsernameFromToken(use_header ? data.authorization : data.token);

    req.pipe(req.busboy);

    req.busboy.on('file', async (_fieldname, file, filename) => {
        const temp_path = join(dirname, 'cache', 'uploads_temp', filename.filename);
        const stream = createWriteStream(temp_path);
        file.pipe(stream);

        // check if its finished...
        file.on('close', async () => {
            stream.close();
            info('UUS', 'Temp. upload success.');

            const stats = statSync(temp_path);
            if (stats.size == 0 || !filename.filename || filename.filename.includes(' ')) {
                cacheRes('UUS', 'BSN', username); // client-side handles cached results
                rmSync(temp_path);
                return;
            }
            // check size limits (anonymous is max size 1/2 gb)
            let userStorage = is_anonymous ? {size:0,userTS:512*1024*1024} : await QueryUserStorage(username);
            //console.log(`${userStorage.size} + ${stats.size} (is_anonymous? ${is_anonymous}) of ${userStorage.userTS}`);
            if (userStorage.size + stats.size > userStorage.userTS) {
                // if its too big for the user to upload
                error('UUS', `File is too big for user's storage, abort!`);
                cacheRes('UUS', 'NES', username);
                rmSync(temp_path);
                return;
            }

            // otherwise, success!
            // copy the file to their directory
            copyFile(temp_path, join(dirname, 'content', username, filename.filename), () => {
                // wait for copy to finish
                info('UUS', 'File upload is complete!');
                cacheRes('UUS', 'AOK', username);
                rmSync(temp_path);
            });
        });
    });
}

/**
 * Remove an item from a user's content
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
function POSTRemoveMyBoxContent(req, res) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).send('Bad request');
        return;
    }

    const data = matchedData(req);
    if (!VerifyToken(data.token)) {
        res.status(403).send({status:403,error:'Unauthorized.'});
        return;
    }

    const file_path = join(__dirname, '..', 'content', GetUsernameFromToken(data.token), data.id);

    if (!existsSync(file_path)) {
        res.status(404).json({status:404,error:'File not found.'});
        return;
    }

    try {
        rmSync(file_path);
    } catch (err) {
        error('UUS', 'Error deleting content: ' + err);
        res.status(500).json({status:500,error:'Internal Server Error.'});
        return;
    }
}

/**
 * Alias of POSTUpload that uses `req.headers['authorization']`
 * as the authoriation override for POSTUpload 
 * @param {Request} req Express Request object
 * @param {Response} res Express Response object
 * @param {Object} serverConfig the config loaded on boot
 * @param {string} dirname the dirname of the index file
 */
function POSTDesktopUpload(req, res, serverConfig, dirname) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).json({success:false,error:'Sanitizer rejection.'});
        return;
    }

    const data = matchedData(req);
    POSTUpload(req, res, serverConfig, dirname, true);
}

/**
 * Alias of POSTUpload that disables authorization
 * and instead uses the anonymous user
 * @param {Request} req Express Request object
 * @param {Response} res Express Response object
 * @param {Object} serverConfig the config loaded on boot
 * @param {string} dirname the dirname of the index file
 */
function POSTAnonymousUpload(req, res, serverConfig, dirname) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).send('Bad request');
        return;
    }

    POSTUpload(req, res, serverConfig, dirname, 'anonymousdoesnthaveatoken', true);
}

module.exports = {
    POSTUpload,
    POSTDesktopUpload,
    POSTAnonymousUpload,
    POSTRemoveMyBoxContent
}