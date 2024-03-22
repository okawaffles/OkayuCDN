const { info, warn, error, Logger } = require('okayulogger');
const { existsSync, readFileSync, statSync } = require('node:fs');
const { param, validationResult, matchedData } = require('express-validator');
const path = require('node:path'), { join } = require('node:path');
const pjson = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json')));

/**
 * Handle a content request
 * @param {Request} req Express Request
 * @param {Response} res Express Response
 * @param {string} domain The domain that the server should be hosted on
 */
function ServeContent(req, res, domain) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).render('error_general.ejs', {error: 'Bad Content Request'});
        return;
    }

    const data = matchedData(req);
    const file_path = join(__dirname, `../content/${data.user}/${data.item}`);

    
    if (!existsSync(file_path)) {
        res.render('notfound.ejs', {version:6});
        return; 
    }
    
    let file;
    try {
        file = readFileSync(file_path); 
    } catch (e) {
        res.render('error_general.ejs', {error:'An error occurred while retrieving the file.'});
        return;
    }

    let file_extension = data.item.split('.').at('-1');

    if(file_extension != "mp4" || req.query.bypass == "true") {
        // standard file sending
        res.send(file);
    } else {
        res.render('watchpage.ejs', {filename: data.item, user: data.user, domain:domain});
    }
}

/**
 * Handle an embedded content request
 * @param {Request} req Express Request
 * @param {Response} res Express Response
 */
function ServeEmbeddedContent(req, res) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).render('error_general.ejs', {error: 'Bad Content Request'});
        return;
    }

    const data = matchedData(req);
    const file_path = join(__dirname, `../content/${data.user}/${data.item}`);

    
    if (!existsSync(file_path)) {
        res.render('notfound.ejs', {version:6});
        return; 
    }
    
    let file;
    try {
        file = readFileSync(file_path); 
    } catch (e) {
        res.status(500).render('error_general.ejs', {error:'An error occurred while retrieving the file.'});
        return;
    }

    let file_extension = data.item.split('.').at('-1');

    if(file_extension != "mp4") {
        // we only embed mp4 files right now
    } else {
        res.render('embeddedvideo.ejs', {filename: data.item, user: data.user});
    }
}

function GenerateSafeViewPage(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.status(400).send('Bad Request');
        return;
    }

    const params = matchedData(req);

    if (!existsSync(path.join(__dirname, `../content/${params.user}/${params.item}`))) {
        res.render('notfound.ejs', {version:pjson.version});
        return;
    }

    try {
        let data = statSync(path.join(__dirname, `../content/${params.user}/${params.item}`));
        res.render('view_info.ejs', {
            username: params.user,
            filename: params.item,
            filesize: data.size,
            filetype: params.item.split('.')[params.item.split('.').length - 1]
        });
    } catch (err) {
        error('view', err)
        res.render('err500.ejs');
        return;
    }
}

module.exports = { 
    ServeContent,
    ServeEmbeddedContent, 
    GenerateSafeViewPage 
};