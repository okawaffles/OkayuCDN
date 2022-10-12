const URL = "../assets/lang/ja_jp.json";

function loadLanguage(page) {
    $.getJSON(URL, function(data) {
        // Navigation Bar
        document.getElementById('nav_home').innerHTML = data.shared['NAV_HOME'];
        document.getElementById('nav_upload').innerHTML = data.shared['NAV_UPLOAD'];
        document.getElementById('nav_manage').innerHTML = data.shared['NAV_MANAGE'];

        // Main texts
        switch (page) {
            case "home":
                document.getElementById('nav_info').innerHTML = data.shared['NAV_INFO'];
                
                document.getElementById('t_title').innerHTML = data.pages.home['T_TITLE'];
                document.getElementById('t_sa').innerHTML = data.pages.home['T_SA'];
                document.getElementById('t_sb').innerHTML = data.pages.home['T_SB'];
                break;
        
            default:
                break;
        }
    })
}