const { validationResult, matchedData } = require('express-validator');
const { LoginVerifySecure } = require('./accountHandler.js');
const { info, warn, error } = require('okayulogger');

function POSTAdminLoginAs(req, res) {
    if (!validationResult(req).isEmpty()) {
        res.status(400).json({status:400,error:'Bad request'});
        return;
    }

    const data = matchedData(req);

    if (!LoginVerifySecure(data.admin_un, data.admin_pw)) {
        res.status(403).json({status:403,error:'Unauthorized'});
        return;
    }

    warn('admin', `An admin is logging in as ${data.user_un}!`);
    
}