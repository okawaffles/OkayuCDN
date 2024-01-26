const { info, warn, error, Logger } = require('okayulogger');
const { existsSync, readFileSync, statSync } = require('node:fs');
const { param, validationResult, matchedData } = require('express-validator');
const path = require('node:path');
const pjson = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json')));

function ServeContent(req, res) {

}

function GenerateSafeViewPage(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        res.send('<h3>error: bad request</h3>');
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
            filesize: data.size / 1024 / 1024,
            filetype: params.item.split('.')[params.item.split('.').length - 1]
        });
    } catch (err) {
        error('view', err)
        res.render('err500.ejs');
        return;
    }
}

module.exports = { ServeContent, GenerateSafeViewPage };