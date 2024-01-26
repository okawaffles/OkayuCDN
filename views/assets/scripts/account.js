function updatePwd() {
    $.post('/api/account/changePassword', {
        currentPassword:$("#password_current").val(),
        newPassword:$("#password_new").val()
    }).done(function (data) {
        if (data.result == 200) {
            alert("Your password has been changed successfully.")
        } else {
            $("p.login_error").css("display", "inline")
            console.log(data)
        }
    })
}

function loadAccountData() {
    $.get('/api/myAccountData').done((data) => {
        if (data.twoFactor) {
            
        }
    });
}