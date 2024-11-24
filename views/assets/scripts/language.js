// these will later be stored on the server
// we will download them to the user's LocalStorage
// and then load them from there

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
    },
    '/mybox': {
        'MANAGE_BOX':'ダンボールを見る',
        'CONTENT':'マイファイル',
        'SORT':'列挙のソート',
        'SHARE':'シェア'
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

const AVAILABLE_LANGUAGES = {
    'ja':LANG_JP,
    'es':LANG_ES
};

jQuery(() => {
    const user_language = navigator.language;
    if (user_language == 'en-US' || user_language == 'en' ) return;

    const PAGE = document.location.pathname;
    const LANG = AVAILABLE_LANGUAGES[getCookie('lang') || user_language];

    Object.keys(LANG['_']).forEach(rule => {
        $(`.__LANG_${rule}`).html(LANG['_'][rule]);
    });
    Object.keys(LANG[PAGE]).forEach(rule => {
        // $(`.__LANG_${rule}`).text(LANG[PAGE][rule]);
        let els = document.getElementsByClassName(`__LANG_${rule}`);
        Object.keys(els).forEach(item => {
            els[item].innerText = LANG[PAGE][rule];
        });
    });
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}