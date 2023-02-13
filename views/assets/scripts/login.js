let username;

function checkLogin(data, redir) {
    if (data.result == 200) {
        if (data.uses2FA) {
            $('div.login_form').css('display', 'none')
            $('div.tfa').css('display', 'inline')
        } else {
            document.cookie = `token=${data.token}`
            document.location = `${redir}`
        }
    }

    if (data.result == 401) {
        $('button.go').css("display", 'inline');
        $('button.noacc').css("display", 'inline');
        $('p.login_error').css("display", 'inline');
    }
}

function sendLoginPOST(redir) {
    let un = document.getElementById('un').value;
    let pw = document.getElementById('pw').value;

    if (un == "" || pw == "") { alert("Please enter your username and password."); return; }

    username = un;

    $('button.go').css("display", 'none');
    $('button.noacc').css("display", 'none');

    $.post("/api/login", { username: un, password: pw }).done(function (data) { checkLogin(data, redir) });
}

function send2FAPOST(redir) {
    $.post("/api/2fa/verify", { userToken:document.getElementById('code').value, username:username }).done(function (data) { 
        if (data.result == 200) {
            document.cookie = `token=${data.token}`
            document.location = `${redir}`
        } else {
            $('p.error_2fa').css('display', 'inline');
        }
    });
}