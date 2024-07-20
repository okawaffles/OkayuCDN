const REGEX_USERNAME = new RegExp('^[a-zA-Z0-9]{6,25}$');
const REGEX_PASSWORD = new RegExp('^(?=.*[a-z])(?=.*[A-Z].*[A-Z])(?=.*\\d.*\\d)(?=.*[^a-zA-Z\\d].*[^a-zA-Z\\d]).{8,}$');
const REGEX_EMAIL = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');

$(document).ready(() => {
    $('#submit').on('click', () => {
        $('#submit').css('display', 'none');

        if (!REGEX_USERNAME.test($('#username').val())) return alert('Please follow the requested username format');
        if (!REGEX_PASSWORD.test($('#password').val())) return alert('Please follow the requested password format');
        if (!REGEX_EMAIL.test($('#email').val())) return alert('Please follow the requested email format');

        $.post('/api/signup', {
            username:$('#username').val(),
            password:$('#password').val(),
            email:$('#email').val(),
            realname:$('#realname').val()
        }, () => {
            alert('Account creation successful. You may now log in.');
            document.location = '/login';
        }).fail(() => {
            alert('Something went wrong while creating your account. Please try again.');
            $('#submit').css('display', 'revert');
        });
    });

    $('#username').focusout(() => {
        if (!REGEX_USERNAME.test($('#username').val())) {
            $('#username').css('animation', 'bad-login 0.5s ease');
            setTimeout(() => {
                $('#username').css('animation', 'none');
            }, 550);
        }
    });
    $('#password').focusout(() => {
        if (!REGEX_PASSWORD.test($('#password').val())) {
            $('#password').css('animation', 'bad-login 0.5s ease');
            setTimeout(() => {
                $('#password').css('animation', 'none');
            }, 550);
        }
    });
    $('#email').focusout(() => {
        if (!REGEX_PASSWORD.test($('#email').val())) {
            $('#email').css('animation', 'bad-login 0.5s ease');
            setTimeout(() => {
                $('#email').css('animation', 'none');
            }, 550);
        }
    });
});