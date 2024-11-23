const LANG_JP = {
    '_':{ // these will execute on all pages
        'NAV_HOME':'<i class="fa-solid fa-house"></i> トップ',
        'NAV_UPLOAD':'<i class="fa-solid fa-upload"></i> アップロード',
        'NAV_BOX':'<i class="fa-solid fa-box"></i> ダンボール',
        'NAV_INFO':'<i class="fa-solid fa-circle-info"></i> インフォ',
        'NAV_ACCOUNT':'<i class="fa-solid fa-user"></i> マイページ',
        'NAV_M_HOME':'<i class="fa-solid fa-house"></i> トップ',
        'NAV_M_UPLOAD':'<i class="fa-solid fa-upload"></i> アップロード',
        'NAV_M_BOX':'<i class="fa-solid fa-box"></i> ダンボール',
        'NAV_M_INFO':'<i class="fa-solid fa-circle-info"></i> インフォ',
        'NAV_M_ACCOUNT':'<i class="fa-solid fa-user"></i> マイページ',
        'NAV_M_MENU':'<i class="fa-solid fa-bars"></i> メニュー',
        'NAV_LOGOUT':'<i class="fa-solid fa-right-from-bracket"></i> ログアウトする',
        'NAV_M_LOGOUT':'<i class="fa-solid fa-right-from-bracket"></i> ログアウトする',
    },
    '/home': {
        'WELCOME': 'OkayuCDNへようこそ！',
        'SUB_A':'ここは君のファイルを無料アップロードできる',
        'SUB_B':'ではどこなりとシェアできます！'
    }
};
const LANG_ES = {
    '_': {
        'NAV_HOME':'<i class="fa-solid fa-house"></i> Página Principal',
        'NAV_M_HOME':'<i class="fa-solid fa-house"></i> Página Principal',
        'NAV_UPLOAD':'<i class="fa-solid fa-upload"></i> Cargar',
        'NAV_M_UPLOAD':'<i class="fa-solid fa-upload"></i> Cargar',
        'NAV_BOX':'<i class="fa-solid fa-box"></i> Mi Caja',
        'NAV_M_BOX':'<i class="fa-solid fa-box"></i> Mi Caja',
        'NAV_INFO':'<i class="fa-solid fa-circle-info"></i> Información',
        'NAV_M_INFO':'<i class="fa-solid fa-circle-info"></i> Información',
        'NAV_ACCOUNT':'<i class="fa-solid fa-user"></i> Mi Cuenta',
        'NAV_M_ACCOUNT':'<i class="fa-solid fa-user"></i> Mi Cuenta',
        'NAV_LOGOUT':'<i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión',
        'NAV_M_LOGOUT':'<i class="fa-solid fa-right-from-bracket"></i> Cerrar sesión',
    },
    '/home': {
        'WELCOME': '¡Bienvenido a OkayuCDN!',
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

    Object.keys(LANG['_']).forEach(rule => {
        $(`.__LANG_${rule}`).html(LANG['_'][rule]);
    });
    Object.keys(LANG[PAGE]).forEach(rule => {
        $(`.__LANG_${rule}`).text(LANG[PAGE][rule]);
    });
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}