let username;

function checkLogin(data) {
    if (data.result == 200) {
        if (data.uses2FA) {
            $('div.login_form').css('display', 'none');
            $('div.tfa').css('display', 'inline');
        } else {
            document.cookie = `token=${data.token}`;

            let redir = '/home';

            if (window.location.toString().includes('?redir=')) {
                redir = window.location.toString().split('?redir=').at(-1);
            }
            document.location = `${redir}`;
        }
    }
}

function sendLoginPOST() {
    let un = document.getElementById('un').value;
    let pw = document.getElementById('pw').value;

    if (un == "" || pw == "") { alert("Please enter your username and password."); return; }

    username = un;

    $('button.go').css("display", 'none');
    $('button.noacc').css("display", 'none');

    $.post("/api/login", { username: un, password: pw })
        .done(function (data) { checkLogin(data) })
        .fail((data) => {
            let reason = data.responseJSON['reason'] || data.responseJSON['error'];
            $('button.go').css("display", 'inline');
            $('button.noacc').css("display", 'inline');
            $('p.login_error').css("display", 'inline');
            $('p.login_error').text(reason);
        });
}

function send2FAPOST() {
    $.post("/api/2fa/verify", { userToken:document.getElementById('code').value, username:username }).done(function (data) { 
        if (data.result == 200) {
            document.cookie = `token=${data.token}`;

            let redir = '/home';

            if (window.location.toString().includes('?redir=')) {
                redir = window.location.toString().split('?redir=').at(-1);
            }
            document.location = `${redir}`;
        } else {
            $('p.error_2fa').css('display', 'inline');
        }
    });
}

addEventListener('keydown', (ev) => {
    if (ev.key == "Enter") {
        sendLoginPOST();
    }
})