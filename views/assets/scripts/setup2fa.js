/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let validate = function() {
    $('button.go').css('display', 'hidden');

    console.log('validating...');
    $.post('/api/2fa/setup/verify', {userToken:document.getElementById('validate').value}).done(function(data) {
        if (data.result == 200) {
            $.post('/api/2fa/setupUser').done(function () {
                alert('Your 2FA has been set up successfully!');
                document.location('/home');
            });
        } else {
            $('button.go').css('display', 'inline');
            alert('Please check your code.');
        }
    });
};