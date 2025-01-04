const REGEX_USERNAME = new RegExp('^[a-zA-Z0-9]{6,25}$');
const REGEX_PASSWORD = new RegExp('^(?=.*[A-Z].*[A-Z])(?=.*[\\W]).{8,}$');
const REGEX_EMAIL = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');

let username_valid = false;
let password_valid = false;
let email_valid = false;

$(document).ready(() => {
    $('#submit').on('click', () => {
        $('#submit').css('display', 'none');

        if (!REGEX_USERNAME.test($('#username').val())) {  
            $('#input_error').css('display', 'revert').text('Usernames must be 6-25 alphanumeric characters.');
            return;
        }
        if (!REGEX_PASSWORD.test($('#password').val())) {  
            $('#input_error').css('display', 'revert').text('Passwords must be at least 8 characters, with 2 uppercase, 2 numbers, and 2 symbols.');
            return;
        }
        if (!REGEX_EMAIL.test($('#email').val())) {  
            $('#input_error').css('display', 'revert').text('Please enter a valid email.');
            return;
        }

        $.post('/api/signup', {
            username:$('#username').val(),
            password:$('#password').val(),
            email:$('#email').val(),
            realname:$('#realname').val()
        }, () => {
            AttemptAutoLogin();
        }).fail((data) => {
            if (data.responseJSON.error == 'password check failed') $('#input_error').css('display', 'revert').text('Password isn\'t strong enough. Try another one.');
            else $('#input_error').css('display', 'revert').text('Account creation failed.');
            $('#submit').css('display', 'none');
        });
    });

    $('#username').focusout(() => {
        if (!REGEX_USERNAME.test($('#username').val())) {
            $('#input_error').css('display', 'revert').text('Usernames must be 6-25 alphanumeric characters.');
            $('#username').css('animation', 'bad-login 0.5s ease');
            setTimeout(() => {
                $('#username').css('animation', 'none');
            }, 550);
            return username_valid = false;
        } else username_valid = true;

        if ($('#username').val() == '') return username_valid = false;

        $.get('/api/username', {username:$('#username').val()}, () => {
            username_valid = true;
            $('#input_error').css('display', 'none');
            CheckSubmitRequirements();
        }).fail(() => {
            // http 409 = Conflict

            username_valid = false;
            $('#input_error').css('display', 'revert').text('Username is already in use.');

            $('#username').css('animation', 'bad-login 0.5s ease');
            setTimeout(() => {
                $('#username').css('animation', 'none');
            }, 550);
            CheckSubmitRequirements();
        });
    });

    $('#password').focusout(() => {
        if (!REGEX_PASSWORD.test($('#password').val())) {
            password_valid = false;
            $('#input_error').css('display', 'revert').text('Passwords must be at least 8 characters, 2 uppercase letters, and a symbol.');
            $('#password').css('animation', 'bad-login 0.5s ease');
            setTimeout(() => {
                $('#password').css('animation', 'none');
            }, 550);
        } else { 
            $('#input_error').css('display', 'none');
            password_valid = true;
        }

        CheckSubmitRequirements();
    });
    $('#email').focusout(() => {
        if (!REGEX_EMAIL.test($('#email').val())) {
            email_valid = false;
            $('#input_error').css('display', 'revert').text('Please enter a valid email.');
            $('#email').css('animation', 'bad-login 0.5s ease');
            setTimeout(() => {
                $('#email').css('animation', 'none');
            }, 550);
        } else { 
            $('#input_error').css('display', 'none');
            email_valid = true; 
        }

        CheckSubmitRequirements();
    });
    $('#realname').focusout(() => {
        CheckSubmitRequirements();
    });
});

function CheckSubmitRequirements() {
    if (password_valid && username_valid && email_valid && $('#realname').val() != '') {
        $('#input_error').css('display', 'none');
        $('#submit').css('display', 'revert');
        $('#agreement').css('display', 'revert');
    }
    else {
        $('#agreement').css('display', 'none');
        $('#submit').css('display', 'none');
    }
}

function AttemptAutoLogin() {
    $.post('/api/login', {
        username: $('#username').val(),
        password: $('#password').val()
    }, (data) => {
        // if something went wrong, just redirect them to the login page
        if (data.status != 200) return document.location = '/login?redir=/mybox';

        // save login cookie
        document.cookie = `token=${data.token}; max-age=${14*86400}; path=/;`;
        document.location = '/mybox';
    });
}