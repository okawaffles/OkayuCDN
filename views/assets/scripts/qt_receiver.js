/* eslint-disable no-undef */

let SOCKET, DOMAIN, TOKEN = getCookie('token'), FILE_NAME, TOTAL_CHUNKS;
let transferHasBegun = false;

// get identity on load <- yes.
$(document).ready(() => {
    $.getJSON('/api/whoami', (data) => {
        DOMAIN = data.domain;
        if (DOMAIN.includes('https://') || DOMAIN.includes('http://')) DOMAIN = DOMAIN.split('://')[1];
    }, () => {
        document.location = '/login?redir=/qt/receive';
    });

    start();
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


function start() {
    // Get user's storage
    $.getJSON('/api/storage', async (data) => {
        if (data.error && data.reason == 'needs_login') document.location = '/login?redir=/qt/send';

        // handshake with websocket
        SOCKET = new WebSocket(`ws://${DOMAIN}`);

        SOCKET.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            if (data.message_type == 'handshake' && data.data == 'please identify') {
                SOCKET.send(`{"message_type":"handshake","data":"receiver ${TOKEN}"}`);
            }

            if (data.message_type == 'handshake' && data.data == 'authentication pass') {
                // start pinging
                Ping();
            }

            if (data.message_type == 'handshake' && data.data == 'authentication fail') {
                alert('authentication failure, please log in again');
                document.location = '/login?redir=/qt/receive';
            }

            // AWAITING
            if (data.message_type == 'begin_transfer') {
                transferHasBegun = true;
                FILE_NAME = data.file_name;
                TOTAL_CHUNKS = data.total_chunks; 
                SOCKET.send(`{"message_type":"begin_transfer","token":"${TOKEN}","data":"ready"}`);
            }

            // TRANSFER
            if (data.message_type == 'transfer') {
                console.log(`chunk ${data.chunk} contains: ${data.data}`);
                SOCKET.send(`{"message_type":"transfer","token":"${TOKEN}","verify":"pass"}`);
            }
        });
    }).fail((err) => {
        if (err.contains('Too Many Requests')) return alert('Too many API requests. Please wait at least 5 minutes and try again.');
        alert('Error in upload_v6.js.\n\nIf you are on desktop, please open your browser console and report the bug at https://github.com/okawaffles/OkayuCDN');
        console.error('HELLO BUG REPORTER, YOU WANT THIS -> ' + err.responseText);
    });
}

function Ping() {
    SOCKET.send(`{"message_type":"awaiting","token":"${TOKEN}","data":"ready"}`);

    setTimeout(() => {
        if (transferHasBegun) return; else Ping();
    }, 1000);
}