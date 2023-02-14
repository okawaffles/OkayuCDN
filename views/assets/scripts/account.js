function updatePwd() {
    console.log($("#password_current").val())
    $.post('/api/account/changePassword', {
        currentPassword:$("#password_current").val(),
        newPassword:$("#password_new").val()
    }).done((data) => {
        if (data.result == 200) {
            alert("Your password has been changed successfully.")
        } else if (data.result == "403") {
            $("p.login_error").css("display", "inline")
        }
    })
}