let jajp = {
    "parts":{
        "menubar":{
            "landing":'<i class="fa-solid fa-plane-arrival"></i> 着陸なページを見っている',
            "home":'<i class="fa-solid fa-house"></i> ホーム',
            "upload":'<i class="fa-solid fa-upload"></i> アップロード',
            "mybox":'<i class="fa-solid fa-circle-info"></i> ダンボール',
            "info":'<i class="fa-solid fa-circle-info"></i> インフォ',
            "login":'ログイン',
            "logout":'ログアウト'
        },
        "banner": {
            "gdpr":"GDPR COOKIE REGULATION BANNER",
            "tfa":"今は、OkayuCDNの二要素認証はベータ版です！",
            "tfa_try":"それ試す！"
        },
        "home": [
            "OkayuCDNへようこそ！",
            "ここで君のファイルを無料にアップロード！",
            "全部なファイルタイプとDiscordの埋め込みは支持します"
        ],
    }
}

function doMenubar(lang, page) {
    let menubar = document.getElementsByClassName('nav_links')[0].children;
    switch (page) {
        case 'landing':
            menubar[0].children[0].innerHTML = lang.parts.menubar.home;
            menubar[1].children[0].innerHTML = lang.parts.menubar.landing;
            break;
        case 'home': case 'info':
            menubar[0].children[0].innerHTML = lang.parts.menubar.home;
            menubar[1].children[0].innerHTML = lang.parts.menubar.upload;
            menubar[2].children[0].innerHTML = lang.parts.menubar.mybox;
            menubar[3].children[0].innerHTML = lang.parts.menubar.info;
            break;
    }
}

function checkLanguage(page) {
    if (document.cookie.includes('language=ja-jp')) {
        switch (page) {
            case 'landing':
                doMenubar(jajp, 'landing');
                break;
            case 'home':
                doMenubar(jajp, 'home');
                $('#t_title').html(jajp.parts.home[0])
                $('#t_sa').html(jajp.parts.home[1])
                $('#t_sb').html(jajp.parts.home[2])
                $('#gdpr')[0].children[0].innerText = jajp.parts.banner.tfa;
                $('#gdpr')[0].children[1].innerText = jajp.parts.banner.tfa_try;
                break;
        
            default:
                break;
        }
    }
}