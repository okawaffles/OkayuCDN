const {info, error, warn} = require('okayulogger');

const fs = require('fs');
const path = require('path');

function cacheRes(process, _code, username, id = 0) {
    let code = _code.toLowerCase();
    let object;
    switch (process.toLowerCase()) {
        case "uus":
            if (code == "nau") object = {success:false,details:"You have already uploaded a file by this name",code:"UUS-NAU"};
            if (code == "nes") object = {success:false,details:"You do not have enough storage for this file to be uploaded.",code:"UUS-NES"};
            if (code == "bsn") object = {success:false,details:"File is either empty or has a non-valid name.",code:"UUS-BSN"};
            if (code == "ise") object = {success:false,details:"Internal Server Error.",code:"UUS-ISE"};

            if (code == "aok") object = {success:true,details:"File upload succeeded.",code:"UUS-AOK"};
            break;

        case "qus":
            if (code == "ise") object = {success:false,details:"Internal Server Error.",code:"UUS-ISE"};
            // we need to also pass the ID to the anonymous user since they aren't naming their file.
            if (code == "aok") object = {success:true,details:"File upload succeeded.",code:"UUS-AOK",id:id};
            break;
    
        default:
            break;
    }
    data = JSON.stringify(object);
    fs.writeFileSync(path.join(__dirname, `../../cache/${username}.${process}.json`), data);
}

function cleanCache() {
    info('cacheHelper', 'Cleaning up cache...')
    fs.readdir(path.join(__dirname, '/cache'), function (err, files) {
        files.forEach(file => {
            fs.rmSync(path.join(__dirname, `/cache/${file}`));
        });
        info('cacheHelper', 'Finished cleaning cache.');
    });
}
function cleanTokens() {
    info('cacheHelper', 'Cleaning up tokens...')
    fs.readdir(path.join(__dirname, '/db/sessionStorage'), function (err, files) {
        files.forEach(file => {
            fs.rmSync(path.join(__dirname, `/db/sessionStorage/${file}`));
        });
        info('cacheHelper', 'Finished cleaning tokens.');
    });
}

function prepareDirectories() {
    if (!fs.existsSync(path.join(__dirname, '/db'))) fs.mkdirSync(path.join(__dirname, '/db'));
    if (!fs.existsSync(path.join(__dirname, '/db/sessionStorage'))) fs.mkdirSync(path.join(__dirname, '/db/sessionStorage'));
    if (!fs.existsSync(path.join(__dirname, '/db/userLoginData'))) fs.mkdirSync(path.join(__dirname, '/db/userLoginData'));
    if (!fs.existsSync(path.join(__dirname, '/content'))) fs.mkdirSync(path.join(__dirname, '/content'));
    if (!fs.existsSync(path.join(__dirname, '/content/anonymous'))) fs.mkdirSync(path.join(__dirname, '/content/anonymous'));
    if (!fs.existsSync(path.join(__dirname, '/cache'))) fs.mkdirSync(path.join(__dirname, '/cache'));
    
    if (!fs.existsSync(path.join(__dirname, '/db/stats.json'))) fs.writeFileSync(path.join(__dirname, '/db/stats.json'), '{"accounts":0,"uploads":0"}');
}

module.exports = {cacheRes, cleanCache, cleanTokens, prepareDirectories};