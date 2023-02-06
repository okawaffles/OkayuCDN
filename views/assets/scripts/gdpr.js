function checkGDPRConsent() {
    return document.cookie.includes("gdpr-consent=true");
}

function setGDPRConsent() {
    document.cookie = "gdpr-consent=true";
    document.getElementById("gdpr").style.display = "none";
}