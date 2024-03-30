/* eslint-disable no-undef */

// get identity on load
$(document).ready(() => {
    // $.getJSON('/api/whoami', (result) => {
    //     if (result.result == 200) {
    //         //username = result.username;
    //         start();
    //     } else {
    //         console.error('Did not recieve status 200, whoami failed.');
    //         document.location = '/login?redir=/upload';
    //     }
    // }).fail((err) => {
    //     console.error(err);
    //     document.location = '/login?redir=/upload';
    // });
    
    start();
});

/**
 * A nice little function that turns bytes into readable storage amounts.
 * @param bytes the number to parse
 * @returns a formatted string
 */
function parseStorageAmount(bytes) {
    let formatted = '';

    if (bytes > 750*1024*1024)
        formatted = (((bytes / 1024) / 1024) / 1024).toFixed(2) + 'GB';
    else if (bytes > 750*1024)
        formatted = ((bytes / 1024) / 1024).toFixed(2) + 'MB';
    else if (bytes > 1024)
        formatted = (bytes / 1024).toFixed(2) + 'KB';
    else
        formatted = `${bytes}B`;

    return formatted;
}


function start() {
    let totalStorage = 0;
    let usedStorage = 0;

    // Get user's storage
    $.getJSON('/api/storage', (data) => {
        // we only care about the storage numbers right now
        usedStorage = data.used;
        totalStorage = data.total;

        if (usedStorage >= totalStorage) {
            alert('It appears you\'ve run out of storage! Head over to My Box to delete some content before uploading!');
            document.location = '/mybox';
            return;
        }

        // set up the new storage bar
        $('#used').text(parseStorageAmount(usedStorage));
        $('#total').text(parseStorageAmount(totalStorage));
        $('#fill').css('width', `${(usedStorage / totalStorage)*100}%`);
        $('#newStorageAmount').css('visibility', 'visible');

        // allow the rest of the page to load
        $('#hider').css('display', 'revert');
    }).fail((err) => {
        alert('Error in upload_v6.js.\n\nIf you are on desktop, please open your browser console and report the bug at https://github.com/okawaffles/OkayuCDN');
        console.error('HELLO BUG REPORTER, YOU WANT THIS -> ' + err);
    });
}