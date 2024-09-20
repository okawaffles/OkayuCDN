/* eslint-disable no-undef */

let SOCKET, DOMAIN, TOKEN = getCookie('token'), FILE_NAME, TOTAL_CHUNKS;
let transferHasBegun = false;

const buffers = [];

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
                $('#qt-receive-status').text('Connected, logging in...').css('color', 'var(--okayucdn-orange)');
            }

            if (data.message_type == 'handshake' && data.data == 'authentication pass') {
                // start pinging
                $('#qt-receive-status').text('Connected, waiting for sender to start transfer...').css('color', 'var(--okayucdn-green)');
                Ping();
            }

            if (data.message_type == 'handshake' && data.data == 'authentication fail') {
                $('#qt-receive-status').text('Disconnected').css('color', 'var(--button-red)');
                alert('Authentication failure: Invalid session');
                document.location = '/login?redir=/qt/receive';
            }
            if (data.message_type == 'handshake' && data.data == 'authentication duplicate') {
                $('#qt-receive-status').text('Disconnected').css('color', 'var(--button-red)');
                alert('Authentication failure: You cannot receive and transmit from the same token. Any existing QuickTransfer sessions have been terminated.');
                return location.reload();
            }

            // AWAITING
            if (data.message_type == 'begin_transfer') {
                transferHasBegun = true;
                FILE_NAME = data.file_name;
                TOTAL_CHUNKS = data.total_chunks;
                $('#qt-receive-status').text(`Connected, starting transfer of ${FILE_NAME} (${TOTAL_CHUNKS} chunks expected)`).css('color', 'var(--okayucdn-green)');
                SOCKET.send(`{"message_type":"begin_transfer","token":"${TOKEN}","data":"ready"}`);
            }

            // TRANSFER
            if (data.message_type == 'transfer') {
                console.log(`chunk ${data.chunk} incoming...`);
                $('#qt-receive-status').text(`Connected, transferring ${FILE_NAME} ${Math.round((data.chunk/TOTAL_CHUNKS)*100)}%...`).css('color', 'var(--okayucdn-green)');
                buffers.push(data.data);
                SOCKET.send(`{"message_type":"transfer","token":"${TOKEN}","verify":"pass"}`);

                if (data.chunk == TOTAL_CHUNKS) {
                    FinishTransfer();
                    SOCKET.send(`{"message_type":"final","data":"destroying session, goodbye","token":"${TOKEN}"}`);
                    $('#qt-receive-status').text('Disconnected, transfer succeeded. Reload the page to transfer another file.').css('color', 'var(--okayucdn-blue)');
                }    
            }
        });
    }).fail((err) => {
        if (err.contains('Too Many Requests')) return alert('Too many API requests. Please wait at least 5 minutes and try again.');
        alert('Error in qt_receiver.js.\n\nIf you are on desktop, please open your browser console and report the bug at https://github.com/okawaffles/OkayuCDN');
        console.error('HELLO BUG REPORTER, YOU WANT THIS -> ' + err.responseText);
    });
}

function Ping() {
    SOCKET.send(`{"message_type":"awaiting","token":"${TOKEN}","data":"ready"}`);

    setTimeout(() => {
        if (transferHasBegun) return; else Ping();
    }, 1000);
}

function FinishTransfer() {
    $('#qt-receive-status').text('Transfer finished, preparing to save file...').css('color', 'var(--okayucdn-green)');
    const chunks = [];
    buffers.forEach((buf) => {
        const binaryString = atob(buf);
        const binaryLength = binaryString.length;
        const bytes = new Uint8Array(binaryLength);

        for (let i = 0; i < binaryLength; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        chunks.push(bytes);
    });

    const fullBlob = new Blob(chunks, { type: 'application/octet-stream' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(fullBlob);
    link.download = FILE_NAME;
    link.click();
}