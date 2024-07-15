/* eslint-disable no-undef */
/* eslint-disable no-unreachable */

let currentProcess = 'login';
let next = '/account';
if (document.location.toString().includes('?redir=')) {
    next = document.location.toString().split('?redir=')[1];
}

$(document).ready(() => {
    $('#login').on('click', () => {

        if (currentProcess == '2fa') {
            $('#twofactor-code').prop('disabled', true);
            $('#login_error').css('visibility', 'hidden');

            $.post('/api/login/otp', {username:$('#username')[0].value, userToken:$('#twofactor-code')[0].value}, (data) => {
                if (data.status == 200) {
                    document.cookie = `token=${data.token};`;
                    document.location = next;
                    return;
                } else {
                    $('#login_error').css('visibility', 'visible').html('Unable to verify two-factor authentication.');
                    $('#twofactor-code').prop('disabled', false)[0].value = '';
                    $('#twofactor-inputs').css('animation', 'bad-login 0.5s ease-in-out');
                    setTimeout(() => {
                        $('#twofactor-inputs').css('animation', 'none');
                    }, 550);
                    return;
                }
            }).fail(() => {
                // probably bad request
                $('#login_error').css('visibility', 'visible').html('Server communication error, please try again.');
                $('#twofactor-code').prop('disabled', false)[0].value = '';
                $('#twofactor-inputs').css('animation', 'bad-login 0.5s ease-in-out');
                setTimeout(() => {
                    $('#twofactor-inputs').css('animation', 'none');
                }, 550);
                return;
            });
            return;
        }

        // hide buttons
        $('#login-options').css('visibility', 'hidden');
        $('#login_error').css('visibility', 'hidden');
        $('#username').prop('disabled', true);
        $('#password').prop('disabled', true);

        // send login post
        $.post('/api/login', {username:$('#username')[0].value, password:$('#password')[0].value}, (data) => {
            // 200 -> successful login, will have auth token
            // 202 -> successful login, but requires 2fa code
            if (data.status != 200 && data.status != 202) {
                // login failed, show error and let user try again
                $('#login-options').css('visibility', 'visible');
                $('#login_error').css('visibility', 'visible').html('Please check your username and password. (err: bad credentials)');
                $('#username').prop('disabled', false);
                $('#password').prop('disabled', false)[0].value = ''; // un-disable AND clear it

                $('#username').css('animation', 'bad-login 0.5s ease-in-out');
                $('#password').css('animation', 'bad-login 0.5s ease-in-out');
                setTimeout(() => {
                    $('#username').css('animation', 'none');
                    $('#password').css('animation', 'none');
                }, 550);
                return;
            }

            if (!data.uses2FA) {
                if ($('#keeplogin').is(':checked'))
                    document.cookie = `token=${data.token}; max-age=${14*86400}; path=/;`;
                else
                    document.cookie = `token=${data.token}; path=/;`;

                document.location = next;
                return;
            } else {
                currentProcess = '2fa';
                $('#login-options').css('visibility', 'visible');
                $('#login').text('Verify 2FA');
                $('#passkey').remove();
                $('#inputs').css('display', 'none');
                $('#twofactor-inputs').css('display', 'flex');
            }
        }).fail(($xhr) => {
            // login failed, show error and let user try again
            $('#login').css('visibility', 'visible');

            if ($('#username')[0].value == '' || $('#password')[0].value == '') {
                $('#login').css('animation', 'button-incorrect 1s ease');
                $('#login').text('Please fill both fields');
                setTimeout(() => {
                    $('#login').css('animation', 'none');
                    $('#login').text('Let\'s go!');
                }, 1050);
            } else {
                $('#login').css('animation', 'button-incorrect 1s ease');
                $('#login').text($xhr.responseJSON.reason);
                setTimeout(() => {
                    $('#login').css('animation', 'none');
                    $('#login').text('Let\'s go!');
                }, 1050);
            }

            $('#username').prop('disabled', false);
            $('#password').prop('disabled', false)[0].value = ''; // un-disable AND clear it

            $('#username').css('animation', 'bad-login 0.5s ease-in-out');
            $('#password').css('animation', 'bad-login 0.5s ease-in-out');
            $('#login').css('animation', 'button-incorrect 1s ease');
            setTimeout(() => {
                $('#username').css('animation', 'none');
                $('#password').css('animation', 'none');
                $('#login').css('animation', 'none');
            }, 550);
            
            return;
        });
    });


    // passkey button
    // $('#passkey').on('click', async () => {
    //     // temporary as passkeys don't really work yet  
    //     $('#login_error').css('visibility', 'visible').html('Passkey authentication is not yet available.');
    //     return;

    //     $('#login-options').css('visibility', 'hidden');
    //     $('#login_error').css('visibility', 'hidden');
    //     $('#username').prop('disabled', true);
    //     $('#password').prop('disabled', true);

    //     if ($('#username')[0].value == '') {
    //         $('#login-options').css('visibility', 'visible');
    //         $('#login_error').css('visibility', 'visible').html('Please enter your username to use passkey!');
    //         $('#inputs').css('animation', 'bad-login 0.5s ease-in-out');
    //         $('#username').prop('disabled', false);
    //         $('#password').prop('disabled', false);
    //         setTimeout(() => {
    //             $('#inputs').css('animation', 'none');
    //         }, 550);
    //         return;
    //     }

    //     $.post('/api/2fa/pklogin/start', {username:$('#username')[0].value}, async (data) => {
    //         let asseResp;

    //         try {
    //             asseResp = await SimpleWebAuthnBrowser.startAuthentication(data);
    //             asseResp.username = $('#username')[0].value;

    //             const verificationResp = await fetch('/api/2fa/pklogin/finish', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type':'application/json'
    //                 },
    //                 body: JSON.stringify(asseResp)
    //             });

    //             const verificationJSON = await verificationResp.json();

    //             if (verificationJSON.verified) {
    //                 alert('yippe doo!!!');
    //             } else {
    //                 $('#login-options').css('visibility', 'visible');
    //                 $('#login_error').css('visibility', 'visible').html('Passkey could not be verified.');
    //                 $('#inputs').css('animation', 'bad-login 0.5s ease-in-out');
    //                 $('#username').prop('disabled', false);
    //                 $('#password').prop('disabled', false);
    //                 setTimeout(() => {
    //                     $('#inputs').css('animation', 'none');
    //                 }, 550);
    //                 return;
    //             }
    //         } catch (err) {
    //             $('#login-options').css('visibility', 'visible');
    //             $('#login_error').css('visibility', 'visible').html('Passkey login failed.');
    //             $('#inputs').css('animation', 'bad-login 0.5s ease-in-out');
    //             $('#username').prop('disabled', false);
    //             $('#password').prop('disabled', false);
    //             setTimeout(() => {
    //                 $('#inputs').css('animation', 'none');
    //             }, 550);
    //             console.error(err);
    //             return;
    //         }
    //     }).fail(() => {
    //         $('#login-options').css('visibility', 'visible');
    //         $('#login_error').css('visibility', 'visible').html('Passkey is unavailable for this account.');
    //         $('#inputs').css('animation', 'bad-login 0.5s ease-in-out');
    //         $('#username').prop('disabled', false);
    //         $('#password').prop('disabled', false);
    //         setTimeout(() => {
    //             $('#inputs').css('animation', 'none');
    //         }, 550);
    //         return;
    //     });
    // });
});