let objects = {
    home:'<i class="fa-solid fa-house"> ',
    upload:'<i class="fa-solid fa-upload"> ',
    mybox:'<i class="fa-solid fa-box"> ',
    info:'<i class="fa-solid fa-circle-info"> ',
    logout:'<i class="fa-solid fa-right-from-bracket"> ',
    login:''
}

function mobileCompatibility() {
    if (navigator.userAgent.includes("Android") || navigator.userAgent.includes("iPhone")) {
        // remove the text from the navigation buttons
        items = document.getElementsByClassName("nav_links")[0].childNodes;
        //console.log(items);

        switch(document.location.pathname) {
            case "/manage/upload": case "/mybox":
                items[1].innerHTML = objects.home;
                items[3].innerHTML = objects.upload;
                items[5].innerHTML = objects.mybox;
                items[7].innerHTML = objects.info;
                items[9].innerHTML = objects.logout;
                break;
        }
    }
}