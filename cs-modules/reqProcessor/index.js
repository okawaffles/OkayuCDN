/*
    Checks against a known list of request types 
    to make the output log slightly nicer.
*/

let { info } = require("../okayuLogger");

function process(type, ip, path) {
    switch (type.toString()) {
        case "GET":
            get(ip, path);
            break;
    
        case "POST":
            post(ip, path);
            break;
        case "HEAD":

            break;
    }
}

function get(fullip, path) {
    let ip = fullip.toString().split(',')[3].split('?')[0];
    let sp = path.split('/');
    switch (sp[1]) {
        case "content":
            info('ReqInfo', `Serving Content ${sp[2]}/${sp[3]} | ${ip}`);
            break;
        
        case "home": case "manage": case "info": case "terms": case "signup": case "login":
            info('ReqInfo', `Serving User-viewable Page | ${ip}`);
            break;

        case "quc": case "qus": case "cuc":
            info('ReqInfo', `JSON command (quc/qus/cuc)`);
            break; 

        default:
            info('ReqInfo', `${path} | GET ${ip}`);
            break;
    }
}

function post(fullip, path) {
    let ip = fullip.toString().split(',')[3];
    let sp = path.split('/');

    switch(sp[1]) {
        case "manage":
            if (sp[2] == "cdnUpload") {
                info('ReqInfo', `User is Uploading/Managing Content | POST ${ip}`);
            } else {
                info('ReqInfo', `User is POST'ing a nonexistent /manage path | ${ip}`);
            }
            break;
        case "manage":
            info('ReqInfo', `Admin is operating the panel | POST ${ip}`);
        default:
            info('ReqInfo', `${path} | POST ${ip}`);
            break;
    }
}


module.exports = {process};