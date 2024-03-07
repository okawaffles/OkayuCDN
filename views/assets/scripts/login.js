let currentProcess = 'login';
let next = '/';
if (document.location.toString().includes('?redir=')) {
    next = document.location.toString().split('?redir=')[1];
}

$(document).ready(() => {
    $('#login').on('click', () => {
        // hide buttons
        $('#login').css('visibility', 'hidden');

        // send login post
        $.post('/api/login', {username:$('#username')[0].value, password:$('#password')[0].value}, (data) => {
            console.log(data);
            if (data.result != 200) {
                // login failed, show error and let user try again
                $('#login').css('visibility', 'visible');
                $('#login_error').css('visibility', 'visible').html('Please check your username and password!');
                return;
            }

            if (!data.uses2FA) {
                document.cookie = `token=${data.token};`;
                document.location = next;
                return;
            }
        });
    });
})