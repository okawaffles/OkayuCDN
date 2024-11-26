/* eslint-disable no-undef */
const IS_SECURE_ENVIRONMENT = document.location.protocol == 'https:';
const TOKEN = getCookie('token');
let SOCKET, SECURITY, FILENAME, TOTAL_CHUNKS;
let CURRENT_CHUNK = 0;

// -- Helpers --

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function calculateMD5(data) {
    return CryptoJS.MD5(data).toString();
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
    case 'begin_transfer':
        // only begin_transfer message just means we're good to go
        SendChunk();
        break;
    case 'transfer':
        HandleTransferResponse(ws_message_data);
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

function HandleTransferResponse(ws_message_data) {
    const verify = ws_message_data.verify;
    console.log(ws_message_data.verify);
    
    // retry last chunk if it didn't pass checksum
    if (verify == 'fail') { 
        CURRENT_CHUNK--;
        START_BYTE -= CHUNK_SIZE;
    }

    SendChunk();
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

    async AESEncryptChunkAndSend(fileReaderResult) {
        console.log(fileReaderResult);
        lily2ee_encrypt_aes(this.AES_KEY, btoa(fileReaderResult)).then(encrypted => {
            const checksum = calculateMD5(btoa(String.fromCharCode(encrypted)));
            SOCKET.send(JSON.stringify({
                token: TOKEN,
                message_type: 'transfer',
                chunk: CURRENT_CHUNK,
                data: btoa(encrypted.encryptedChunk),
                iv: `${encrypted.iv}`, // receiver expects a string... for some reason?
                md5: checksum
            }));
            CURRENT_CHUNK++;
        });
    }
}

$(document).ready(async () => {
    $('#uploadButton').prop('disabled', true);

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

    $('#uploadButton').on('click', StartFileUpload);
    $('#uploadInterface').on('click', FPClick);
    $('#uploaded').on('change', FPUpdate);
});

// -- Handling User Input --
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FPDrag(event) { event.preventDefault(); }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FPDrop(event) {
    event.preventDefault();

    const temp_dt = new DataTransfer();
    temp_dt.items.add(event.dataTransfer.files[0]);
    $('#uploaded')[0].files = temp_dt.files;

    FILENAME = temp_dt.files[0].name;
    $('#filename').text(FILENAME);
}
function FPClick() {
    $('#uploaded')[0].click();
}
function FPUpdate() {
    FILENAME = $('#uploaded')[0].files[0].name;
    $('#filename').text($('#uploaded')[0].files[0].name);
}

// -- Chunk sending --

async function StartFileUpload() {
    if ($('#uploaded')[0].files[0] == undefined) {
        $('#uploadInterface').css('animation', 'file_missing 1s');
        setTimeout(() => {
            $('#uploadInterface').css('animation', 'none');
        }, 1000);
        return;
    }

    $('#hider').css('display', 'none');
    $('#uploadInterface').css('display', 'none');
    $('#uploadButton').css('display', 'none');
    $('#div_progress').css('display', 'flex');

    const chunk_size = (1024*512); // each chunk WAS ~5.24MB, now is 0.5MB
    TOTAL_CHUNKS = Math.ceil($('#uploaded')[0].files[0].size / chunk_size);

    SOCKET.send(JSON.stringify({
        token: TOKEN,
        message_type: 'begin_transfer',
        total_chunks: TOTAL_CHUNKS,
        file_name: FILENAME
    }));
}

const CHUNK_SIZE = 1024*512;
let START_BYTE = 0;

async function SendChunk() {
    // handle if the transfer is finished
    if (CURRENT_CHUNK > TOTAL_CHUNKS) {
        $('#qt-send-status').text('File transfer succeeded! Reload the page to transfer another file.').css('color', 'var(--okayucdn-blue)');
        return SOCKET.send(JSON.stringify({
            token: TOKEN,
            message_type: 'final',
            data: 'destroying session, goodbye'
        }));
    }

    // calculating the start/end positions byte-wise
    const file = $('#uploaded')[0].files[0];
    const end_byte = Math.min(START_BYTE + CHUNK_SIZE, file.size);
    const chunk = file.slice(START_BYTE, end_byte);
    START_BYTE += CHUNK_SIZE;

    // reading the bytes we need
    const reader = new FileReader();
    reader.onload = () => {
        SECURITY.AESEncryptChunkAndSend(reader.result); // don't btoa, function will handle that
    };
    reader.readAsBinaryString(chunk); // <-- deprecated, find a new way to do this somehow?

    $('#progress').css('width', `${(CURRENT_CHUNK / TOTAL_CHUNKS)*100}%`);
}