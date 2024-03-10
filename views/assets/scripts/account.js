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

function DisableOTP() {
    $.post('/api/2fa/otp/disable', (data) => {
        if (data.success) {
            window.location = '/account/';
        } else {
            alert('Failed to disable OTP 2FA, please log in again and try again.');
            window.location = '/login?redir=/account';
        }
    }).fail(() => {
        alert('Failed to disable OTP 2FA, please log in again and try again.');
        window.location = '/login?redir=/account';
    });
}

async function StartPasskeySetup() {
    if (navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone OS') || navigator.userAgent.includes('iPad OS')) {
        if (!confirm(`Warning: ${navigator.userAgent.includes('Android')?'Android does':'Apple devices do'} not support WebAuthn at the moment, would you like to continue anyways?`)) return;
    }

    let options;
    $.post('/api/2fa/pkreg/start', async (data) => {
        options = data;
        //console.log(options);

        let attResp;
        try {
            attResp = await SimpleWebAuthnBrowser.startRegistration(options);

            const result = await fetch('/api/2fa/pkreg/finish', {
                method: 'POST',
                body: JSON.stringify(attResp),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            const resultJSON = await result.json();

            if (resultJSON.verified) {
                alert('Passkey setup success!');
                window.location = '/account/';
            } else {
                alert('Failed to finish setting up passkey, please log in again and try again.');
                window.location = '/login?redir=/account';
            }
        } catch (err) {
            alert('Passkey setup failed.');
            console.error(err);
            return;
        }
    }).fail(() => {
        alert('Failed to start passkey setup, please log in again and try again.');
        window.location = '/login?redir=/account';
        return;
    });
}

$(document).ready(() => {
    $.get('/api/myAccountData').done((data) => {
        if (data.uses2FA) {
            $('#otp-header').html('Disable OTP Two-Factor Authentication');
            $('#submit-otp').html('Disable OTP 2FA').css('background-color', 'var(--active-button-red)').attr('onclick', 'DisableOTP()');
        }

        if (data.usesPasskey) {
            $('#passkey-header').html('Disable Passkey Authentication');
            $('#submit-passkey').html('Disable Passkey').css('background-color', 'var(--active-button-red)').attr('onclick', 'DisablePasskey()');
        }
    });
});