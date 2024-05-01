$(document).ready(() => {
    $('#submit').on('click', () => {
        const usernameRegex = new RegExp('^[a-zA-Z0-9]{6,25}$');
        const passwordRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z].*[A-Z])(?=.*\\d.*\\d)(?=.*[^a-zA-Z\\d].*[^a-zA-Z\\d]).{8,}$');
        const emailRegex = new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');

        if (!usernameRegex.test($('#username').val())) return alert('Please follow the requested username format');
        if (!passwordRegex.test($('#password').val())) return alert('Please follow the requested password format');
        if (!emailRegex.test($('#email').val())) return alert('Please follow the requested email format');

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
        });
    });
});