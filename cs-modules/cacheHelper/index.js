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
    fs.readdir('./cache', function (err, files) {
        files.forEach(file => {
            fs.rmSync(`./cache/${file}`);
        });
        info('cacheHelper', 'Finished cleaning cache.');
    });
}
function cleanTokens() {
    info('cacheHelper', 'Cleaning up tokens...')
    fs.readdir('./db/sessionStorage', function (err, files) {
        files.forEach(file => {
            fs.rmSync(`./db/sessionStorage/${file}`);
        });
        info('cacheHelper', 'Finished cleaning tokens.');
    });
}

function prepareDirectories() {
    if (!fs.existsSync('./db')) fs.mkdirSync('./db');
    if (!fs.existsSync('./db/sessionStorage')) fs.mkdirSync('./db/sessionStorage');
    if (!fs.existsSync('./db/userLoginData')) fs.mkdirSync('./db/userLoginData');
    if (!fs.existsSync('./content')) fs.mkdirSync('./content');
    if (!fs.existsSync('./content/anonymous')) fs.mkdirSync('./content/anonymous');
    if (!fs.existsSync('./cache')) fs.mkdirSync('./cache');
}

module.exports = {cacheRes, cleanCache, cleanTokens, prepareDirectories};