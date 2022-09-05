const {info, error, warn} = require('okayulogger');

const fs = require('fs');
function cacheRes(_process, _code, _username) {
    let code = _code.toLowerCase();
    let object;
    switch (_process.toLowerCase()) {
        case "uus":
            if (code == "nau") object = {success:false,details:"You have already uploaded a file by this name",code:"UUS-NAU"};
            if (code == "nes") object = {success:false,details:"You do not have enough storage for this file to be uploaded.",code:"UUS-NES"};
            if (code == "bsn") object = {success:false,details:"File is either empty or has a non-valid name.",code:"UUS-BSN"};
            if (code == "ise") object = {success:false,details:"Internal Server Error.",code:"UUS-ISE"};

            if (code == "aok") object = {success:true,details:"File upload succeeded.",code:"UUS-AOK"};
            break;
    
        default:
            break;
    }
    data = JSON.stringify(object);
    fs.writeFileSync(`./cache/${_username}.${_process}.json`, data);
}

function cleanCache() {
    info('cacheHelper', 'Cleaning up cache...')
    fs.readdir('./cache', function (err, files) {
        files.forEach(file => {
            if(file != "placeholder") fs.rmSync(`./cache/${file}`);
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
    // todo
}

module.exports = {cacheRes, cleanCache, cleanTokens, prepareDirectories};