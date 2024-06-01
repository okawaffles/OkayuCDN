function getCookie(cname) {
    let name = cname + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

function BeamTokenToDesktop() {
    const token = getCookie('token');

    document.location = `okayucdn://token/${token}`;
    document.querySelector('#text').innerHTML = 'Your token has been sent to the desktop app. You may close this page now.';
}

window.onload = function () {
    BeamTokenToDesktop();
};