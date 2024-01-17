// various utils used throughout

/**
 * hash a string, usually used for passwords
 * @param {string} the string to be hashed 
 * @returns the hashed string
 */
function UtilHash(string) {
    return require('node:crypto').createHash('sha256').update(string).digest('hex');
}

/**
 * get a new random 16-character token
 * @returns a random 16-character token
 */
function UtilNewToken() {
    return require('node:crypto').randomBytes(16).toString('hex');
}

module.exports = { UtilHash, UtilNewToken };