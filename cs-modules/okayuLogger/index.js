function info(name, text) {
    let d = new Date();
    let hr = d.getHours();
    let mn = d.getMinutes();
    let sc = d.getSeconds();

    console.log(`[${hr}:${mn}:${sc}] INFO | [${name}] ${text}`);
}

function warn(name, text) {
    let d = new Date();
    let hr = d.getHours();
    let mn = d.getMinutes();
    let sc = d.getSeconds();

    console.log(`[${hr}:${mn}:${sc}] WARN | [${name}] ${text}`);
}

function error(name, text) {
    let d = new Date();
    let hr = d.getHours();
    let mn = d.getMinutes();
    let sc = d.getSeconds();

    console.log(`[${hr}:${mn}:${sc}] ERROR | [${name}] ${text}`);
}

module.exports = {info, warn, error}