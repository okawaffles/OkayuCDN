/* eslint-disable no-undef */
const IS_SECURE_ENVIRONMENT = document.location.protocol == 'https:';
const TOKEN = getCookie('token');
let SOCKET, SECURITY;

// -- Helpers --

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function calculateMD5(data) {
    // Create an MD5 hash object
    const hash = crypto.createHash('md5');
    // Update the hash object with the data
    hash.update(data);
    // Generate the MD5 checksum in hexadecimal format
    return hash.digest('hex');
}

// -- Main WebSocket Functions --

function ConnectWS(domain) {
    return new Promise((resolve, reject) => {
        try {
            const ws = new WebSocket(`${IS_SECURE_ENVIRONMENT?'wss':'ws'}://${domain}`);
            
            $('#qt-send-status').text('Logging in...').css('color', 'var(--okayucdn-orange)');
            resolve(ws);
        } catch (err) {
            $('#qt-send-status').text('Failed to connect (WebSocket failed to connect)').css('color', 'var(--active-button-red)');
            console.error(err);
            reject();
        }
    });
}

function SocketParseMessage(ws_message) {
    let ws_message_data;

    try {
        ws_message_data = JSON.parse(ws_message.data);
    } catch (err) {
        return console.error(`SocketParseMessage: Failed to parse WebSocket message! ${err}`);
    }

    switch (ws_message_data.message_type) {
    case 'handshake':
        HandleHandshake(ws_message_data);
        break;
    case 'awaiting':
        HandleAwaiting(ws_message_data);
        break;
    case 'e2ee':
        HandleE2EE(ws_message_data);
        break;
    }
}

// -- Handlers --

function HandleHandshake(ws_message_data) {
    const handshake_data = ws_message_data.data;

    // Identifying ourself:
    if (handshake_data == 'please identify') {
        // send back our token
        SOCKET.send(JSON.stringify({
            message_type: 'handshake',
            data: `sender ${TOKEN}`
        }));
    }

    // Authentication OK
    if (handshake_data == 'authentication pass') {
        console.log('authenticated successfully!');
        $('#qt-send-status').text('Logged in, please open the receiver page on your other device.').css('color', 'var(--okayucdn-orange)');
        $('#hider').css('display', 'flex'); // we can let the rest of the page show now
    }

    // Authentication failed:
    if (handshake_data == 'authentication fail') {
        console.error('authentication failed');
        $('#qt-send-status').text('Failed to log in').css('color', 'var(--active-button-red)');
    }
}

function HandleAwaiting(ws_message_data) {
    const data = ws_message_data.data;
    
    if (data == 'receiver ready') {
        // the receiver is online, we can request their public key
        console.log('requesting the receiver\'s public RSA-OAEP key...');
        SOCKET.send(JSON.stringify({
            token: TOKEN,
            message_type: 'e2ee',
            status: 'public key requested'
        }));
    }
}

async function HandleE2EE(ws_message_data) {
    // does the message include "key"? if so, then its the RSA-OAEP public key
    if (ws_message_data.key) {
        // this message includes the RSA-OAEP public key
        // it's in base64 but the E2EE function will take care of decoding
        await SECURITY.ImportRSAPublic(ws_message_data.key);
        // now we can send back our AES key, encrypted with their RSA public key
        const aes = await SECURITY.GetRSAEncryptedAES(); // exported in base64 automatically
        SOCKET.send(JSON.stringify({
            token: TOKEN,
            message_type: 'e2ee',
            status: 'e2ee accepted',
            aes,
        }));
        $('#qt-send-status').text('Connected (encrypted), ready to transfer!').css('color', 'var(--okayucdn-green)');
        // allow the send button to be clicked
        $('#uploadButton').prop('disabled', false).text('Send!');
    }
}


// -- E2EE --

class E2EE {
    RSA_PUBLIC;
    AES_KEY;

    constructor() {
        this.RSA_PUBLIC = '';
        this.AES_KEY = '';
    }

    async GenerateAES() {
        return new Promise((resolve) => {
            lily2ee_generateAESKey().then(key => {
                console.log('[E2EE] generated AES key');
                this.AES_KEY = key;
                resolve();
            });
        });
    }

    async GetRSAEncryptedAES() {
        return new Promise((resolve) => {
            lily2ee_exportAES(this.AES_KEY).then(exported => {
                console.log('[E2EE] AES export successful');
                lily2ee_encrypt_rsa(this.RSA_PUBLIC, exported).then(encrypted => {
                    // must be in base64 to send
                    resolve(btoa(String.fromCharCode(...new Uint8Array(encrypted))));
                });
            });
        });
    }

    async ImportRSAPublic(public_key_base64) {
        return new Promise((resolve) => {
            lily2ee_importPublicKeyFromBase64(public_key_base64).then(imported => {
                this.RSA_PUBLIC = imported;
                console.log('[E2EE] imported RSA public key');
                resolve();
            });
        });
    }
}

$(document).ready(async () => {
    let domain;

    await $.getJSON('/api/whoami', (result) => {
        if (result.error && result.reason == 'needs_login') return document.location = '/login?redir=/qt/receive';

        domain = result.domain.split('://')[1]; 
    });

    // TODO: generate keys goes here
    console.log('preparing security...');
    SECURITY = new E2EE();
    SECURITY.GenerateAES();

    console.log('preparing websocket...');
    SOCKET = await ConnectWS(domain);

    SOCKET.addEventListener('message', (message) => {
        SocketParseMessage(message);
    });
});