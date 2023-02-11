let jajp = {
    "parts":{
        "menubar":{
            "landing":"着陸なページを見っている",
            "home":"ホーム",
            "upload":"アップロード",
            "mybox":"ダンボール",
            "info":"インフォ"
        },
        "home": [
            "OkayuCDNへようこそ！",
            "ここで君のファイルを無料にアップロード！",
            "全部なファイルタイプとDiscordの埋め込みは支持します"
        ]
    }
}

function checkLanguage(page) {
    if (document.cookie.includes('language=ja-jp')) {
        switch (page) {
            case 'landing':
                break;
            case 'home':
                document.getElementById('t_title').innerHTML = jajp.parts.home[0]
                break;
        
            default:
                break;
        }
    }
}