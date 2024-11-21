const LANG_JP = {
    '/home': {
        'WELCOME': 'OkayuCDNへようこそ！'
    }
};
const LANG_ES = {
    '/home': {
        'WELCOME': '¡Bienvenido a OkayuCDN!'
    }
};

jQuery(() => {
    if (!document.cookie.includes('lang=')) return;

    console.log(document.location.pathname);

    const PAGE = document.location.pathname;
    let LANG;
    switch (getCookie('lang')) {
    case 'jp':
        LANG = LANG_JP;
        break;
    case 'es':
        LANG = LANG_ES;
        break;
    }

    Object.keys(LANG[PAGE]).forEach(rule => {
        $(`.__LANG_${rule}`).text(LANG[PAGE][rule]);
    });
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}