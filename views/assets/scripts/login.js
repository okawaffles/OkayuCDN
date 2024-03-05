let currentProcess = 'login';

$(document).ready(() => {
    $('#login').on('click', () => {
        // hide buttons
        $('')

        // send login post
        $.post('/api/login', {username:$('#username')[0].value, password:$('#password')[0].value}, (data) => {
            console.log(data);
            if (!data.result == 200) {
                // login failed, show error and let user try again
            }
        });
    });
})