function setGDPRConsent() {
    document.cookie = "gdpr-consent=true";
    document.getElementById("gdpr").style.display = "none";
}

window.onload = function() {
    if (!document.cookie.includes("gdpr-consent=true")) {
        $('#gdpr').css('display', 'flex');
    }
}