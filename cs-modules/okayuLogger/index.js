function getTime() {
    let d = new Date();
    let hr = d.getHours();
    let mn = d.getMinutes();
    let sc = d.getSeconds();
    if (hr < 10) hr = `0${hr}`;
    if (mn < 10) mn = `0${mn}`;
    if (sc < 10) sc = `0${sc}`;
    return `${hr}:${mn}:${sc}`
}

function info(name, text) {
    console.log(`[${getTime()}] INFO | [${name}] ${text}`);
}

function warn(name, text) {
    let d = new Date();
    let hr = d.getHours();
    let mn = d.getMinutes();
    let sc = d.getSeconds();

    console.log(`[${getTime()}] WARN | [${name}] ${text}`);
}

function error(name, text) {
    let d = new Date();
    let hr = d.getHours();
    let mn = d.getMinutes();
    let sc = d.getSeconds();

    console.log(`[${getTime()}] ERROR | [${name}] ${text}`);
}

module.exports = {info, warn, error}