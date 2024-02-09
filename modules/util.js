// various utils used throughout

const { hash } = require('argon2');
const { info, warn, error } = require('okayulogger');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { red, green, blue, bold } = require('chalk');

/**
 * hash a string, usually used for passwords
 * @param {string} the string to be hashed 
 * @returns the hashed string
 */
function UtilHash(string) {
    return require('node:crypto').createHash('sha256').update(string).digest('hex');
}

async function UtilHashSecureSaltless(string) {
    return await hash(string);
}
async function UtilHashSecureSalted(string, salt) {

    return await hash(string+salt);
}

/**
 * get a new random 16-character token
 * @returns a random 16-character token
 */
function UtilNewToken() {
    return require('node:crypto').randomBytes(16).toString('hex');
}

let BLOCKED_IPS = JSON.parse(readFileSync(join(__dirname, '..', 'blocked_ips.json')))['blocked_ips'];
function ReloadBlockedIPs() { BLOCKED_IPS = JSON.parse(readFileSync(join(__dirname, '..', 'blocked_ips.json')))['blocked_ips']; }

function UtilLogRequest(req, res, next) {
    res.setHeader('X-Powered-By', 'OkayuCDN 6');
    res.header('Access-Control-Allow-Credentials', 'true');

    // get IP address
    let ip_addr;
    if (req.headers && req.headers['x-forwarded-for'])
        ip_addr = req.headers['x-forwarded-for'];
    else if (req.socket.remoteAddress)
        ip_addr = req.socket.remoteAddress;
    else ip_addr = "IP Unknown";

    // log the request
    info('RequestInfo', `${bold(red(ip_addr))} ${bold(blue(req.method))} ${green(req.originalUrl)}`);

    // IP ban check
    if (BLOCKED_IPS && BLOCKED_IPS[ip_addr]) {
        info('RequestInfo', `Blocked request from ${ip_addr} due to inclusion in blocked_ips.json.`);
        res.status(403).send('403 Forbidden');
    }

    next();
}


module.exports = { 
    UtilHash,
    UtilHashSecureSalted,
    UtilHashSecureSaltless,
    UtilNewToken,
    UtilLogRequest,
};