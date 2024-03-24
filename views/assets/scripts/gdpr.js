// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setGDPRConsent() {
    document.cookie = 'gdpr-consent=true';
    document.getElementById('gdpr').style.display = 'none';
}

window.onload = function() {
    if (!document.cookie.includes('gdpr-consent=true')) {
        // eslint-disable-next-line no-undef
        $('#gdpr').css('display', 'flex');
    }
};