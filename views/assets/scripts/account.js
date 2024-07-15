/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */

let USERNAME = '';

function updatePwd() {
    $.ajax({
        type:'PATCH',
        url:'/api/password',
        data: {
            current_password: $('#password_current').val(),
            new_password: $('#password_new').val()
        },
        statusCode: {
            200: () => {
                alert('Your password has been changed successfully.');
                document.location = '/logout';
            },
            400: () => {
                // $('p.login_error').css('display', 'inline').text('Bad request. Please check your inputs.');

                $('#password_current').css('animation', 'bad-login 0.5s ease-in-out');
                $('#password_new').css('animation', 'bad-login 0.5s ease-in-out');

                setTimeout(() => {
                    $('#password_current').css('animation', 'none');
                    $('#password_new').css('animation', 'none');
                }, 550);
            },
            401: () => {
                // $('p.login_error').css('display', 'inline').text('Please check your current password.');
                
                $('#password_current').css('animation', 'bad-login 0.5s ease-in-out');

                setTimeout(() => {
                    $('#password_current').css('animation', 'none');
                }, 550);
            }
        }
    });
}

function EnableOTP() {
    return alert('Due to an unmaintained package, OTP 2FA is currently unavailable until a new package is implemented. Sorry about that!');
    // eslint-disable-next-line no-unreachable
    $.getJSON('/api/otp', (data) => {
        $('#qrcode').prop('src', data.url);
        $('#totpSetup').css('display', 'inherit');
    });
}

function CheckOTP() {
    $.post('/api/otp', {username: USERNAME, code: $('#totpCode').val()}, (result) => {
        if (result.statusCode == 204) {
            alert('OK!');
        } else {
            alert('NOT OK!');
        }
    });
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
            });

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
    $.get('/api/whoami').done((data) => {
        USERNAME = data.username;
        $('#account_name').text(`Your Account (${data.username})`);

        if (data.preferences.two_factor.otp_enabled) {
            $('#otp-header').html('Disable OTP Two-Factor Authentication');
            $('#submit-otp').html('Disable OTP 2FA').css('background-color', 'var(--active-button-red)').attr('onclick', 'DisableOTP()');
        }

        if (data.preferences.two_factor.passkey_enabled) {
            $('#passkey-header').html('Disable Passkey Authentication');
            $('#submit-passkey').html('Disable Passkey').css('background-color', 'var(--active-button-red)').attr('onclick', 'DisablePasskey()');
        }
    });
});