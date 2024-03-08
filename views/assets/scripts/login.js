let currentProcess = 'login';
let next = '/account';
if (document.location.toString().includes('?redir=')) {
    next = document.location.toString().split('?redir=')[1];
}

$(document).ready(() => {
    $('#login').on('click', () => {

        if (currentProcess == '2fa') {
            $.post('/api/2fa/verify', {username:$('#username')[0].value, userToken:$('#twofactor-code')[0].value})
            return;
        }

        // hide buttons
        $('#login').css('visibility', 'hidden');
        $('#username').prop('disabled', true);
        $('#password').prop('disabled', true);

        // send login post
        $.post('/api/login', {username:$('#username')[0].value, password:$('#password')[0].value}, (data) => {
            console.log(data);
            if (data.result == 200) {
                // login failed, show error and let user try again
                $('#login').css('visibility', 'visible');
                $('#login_error').css('visibility', 'visible').html('Please check your username and password!');
                $('#username').prop('disabled', false);
                $('#password').prop('disabled', false)[0].value = ''; // un-disable AND clear it

                $('#inputs').css('animation', 'bad-login 0.5s ease-in-out');
                setTimeout(() => {
                    $('#inputs').css('animation', 'none');
                }, 550);
                return;
            }

            if (!data.uses2FA) {
                document.cookie = `token=${data.token};`;
                document.location = next;
                return;
            } else {
                currentProcess = '2fa';
                $('#login').css('visibility', 'visible').html('Verify 2FA');
                $('#inputs').css('display', 'none');
                $('#twofactor-inputs').css('display', 'flex');
            }
        });
    });
})