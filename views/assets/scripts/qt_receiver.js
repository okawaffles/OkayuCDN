/* eslint-disable no-undef */
const IS_SECURE_ENVIRONMENT = document.location.protocol == 'https:';
const TOKEN = getCookie('token');

let SOCKET, SECURITY, FILENAME, EXPECTED_CHUNK_COUNT;
let KEEP_PINGING = true;

// -- Main WebSocket Functions --

function ConnectWS(domain) {
    return new Promise((resolve, reject) => {
        try {
            const ws = new WebSocket(`${IS_SECURE_ENVIRONMENT?'wss':'ws'}://${domain}`);
            
            $('#qt-receive-status').text('Logging in...').css('color', 'var(--okayucdn-orange)');
            resolve(ws);
        } catch (err) {
            $('#qt-receive-status').text('Failed to connect (WebSocket failed to connect)').css('color', 'var(--active-button-red)');
            console.error(err);
            reject();
        }
    });
}

function SocketParseMessage(ws_message) {
    try {
        // Parse expected JSON
        const message_data = JSON.parse(ws_message.data);

        // identify the message type
        const message_type = message_data.message_type;

        // hand off to respective functions
        switch (message_type) {
        case 'handshake':
            HandleHandshake(message_data);
            break;

        case 'e2ee':
            HandleE2EE(message_data);
            break;

        case 'begin_transfer':
            // this message type only contains one set of possible data which is relatively simple.
            // therefore, i'm not bothering to make a separate function for it
            FILENAME = message_data.file_name;
            EXPECTED_CHUNK_COUNT = message_data.total_chunks;
            $('#qt-receive-status').text(`Transfer starting: ${FILENAME} (expecting ${EXPECTED_CHUNK_COUNT} chunk(s))`).css('color', 'var(--okayucdn-green)');
            SOCKET.send(JSON.stringify({message_type:'begin_transfer',token:TOKEN,data:'ready'}));
            break;

        case 'transfer':
            HandleChunk(message_data);
            break;
        } 
    } catch (err) {
        // likely that malformed data was sent
        return console.error(err);
    }
}

function HandleHandshake(ws_message_data) {
    const handshake_data = ws_message_data.data;

    // Identifying ourself:
    if (handshake_data == 'please identify') {
        // send back our token
        SOCKET.send(JSON.stringify({
            message_type: 'handshake',
            data: `receiver ${TOKEN}`
        }));
    }

    // Authentication OK
    if (handshake_data == 'authentication pass') {
        console.log('authenticated successfully!');
        $('#qt-receive-status').text('Logged in, waiting for sender...').css('color', 'var(--okayucdn-orange)');

        // Once the handshake is done, we can send pings for the sender to know we're ready
        Ping();
    }

    // Authentication failed:
    if (handshake_data == 'authentication fail') {
        console.error('authentication failed');
        $('#qt-receive-status').text('Failed to log in').css('color', 'var(--active-button-red)');
    }
}

async function HandleE2EE(ws_message_data) {
    // We must first establish RSA-OAEP encryption so we can trade AES keys.
    switch(ws_message_data.status) {
    case 'public key requested': // send back the public RSA-OAEP key
        $('#qt-receive-status').text('Connected, exchanging encryption keys...').css('color', 'var(--okayucdn-orange)');
        SOCKET.send(JSON.stringify({
            token: TOKEN,
            message_type: 'e2ee',
            key: SECURITY.GetRSAPublic()
        }));
        break;

    case 'e2ee accepted': // sender accepted RSA key and sent back the encrypted AES key
        await SECURITY.ImportAES(ws_message_data.aes);
        break;
    }
}

const CHUNK_BUFFERS = [];

async function HandleChunk(ws_message_data) {
    const chunk_id = ws_message_data.chunk;
    // chunk_data and aes_iv are used to decrypt the chunk
    const chunk_data = ws_message_data.data;
    const aes_iv = ws_message_data.iv;

    // decrypt the chunk
    const decryptedBuffer = await SECURITY.DecryptChunkAES(chunk_data, aes_iv);

    // add it to our buffers
    CHUNK_BUFFERS.push(decryptedBuffer);

    SOCKET.send(JSON.stringify({message_type:'transfer',token:TOKEN,verify:'pass'}));

    if (chunk_id == EXPECTED_CHUNK_COUNT) Finalize();
}


function Ping() {
    SOCKET.send(JSON.stringify({
        message_type: 'awaiting',
        data: 'ready',
        token: TOKEN
    }));

    if (KEEP_PINGING) setTimeout(() => {
        Ping();
    }, 2500);
}

function Finalize() {
    $('#qt-receive-status').text('Finalizing file...').css('color', 'var(--okayucdn-blue)');

    // destroy the websocket connection
    SOCKET.send(JSON.stringify({message_type:'final',data:'destroying session, goodbye',token:TOKEN}));

    // join all the buffers
    const file_chunks = [];
    CHUNK_BUFFERS.forEach(buffer => { file_chunks.push(new Uint8Array(buffer)); });
    const full_file_blob = new Blob(file_chunks, { type: 'application/octet-stream' });

    // download the file
    const link = document.createElement('a');
    link.href = URL.createObjectURL(full_file_blob);
    link.download = FILENAME;
    link.click();

    $('#qt-receive-status').text('Transfer finished! Reload the page to transfer another file.').css('color', 'var(--okayucdn-blue)');
}


// -- Helpers --

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


// -- Various Crypto Related Things --

class E2EE {
    // LILY2EE is expected to be included for this script to work

    RSA_OAEP_PUBLIC; // Exported Public Key
    RSA_OAEP_PRIVATE;
    AES_KEY;

    constructor() {
        this.RSA_OAEP_PUBLIC = '';
        this.RSA_OAEP_PRIVATE = '';
        this.AES_KEY = '';
    }

    async GenerateRSA() {
        return new Promise((resolve) => {
            lily2ee_generateKeypair().then(keypair => {
                console.log('[E2EE] rsa keys generated');
                this.RSA_OAEP_PRIVATE = keypair.privateKey;

                lily2ee_exportPublicKey(keypair.publicKey).then(exported => {
                    // sender expects RSA_OAEP_PUBLIC to be base64, so we must convert it
                    this.RSA_OAEP_PUBLIC = 
                        btoa(String.fromCharCode(...new Uint8Array(exported)));
                    
                    resolve();
                });
            });
        });
    }

    GetRSAPublic() { return this.RSA_OAEP_PUBLIC; }

    // AES

    async ImportAES(ws_message_aes) {
        console.log('[E2EE] Importing AES key...');
        const keyAsBuffer = Uint8Array.from(atob(ws_message_aes), c => c.charCodeAt(0)).buffer;
        
        return new Promise((resolve) => {
            // first we must decrypt the key as it is encrypted with our RSA-OAEP key
            lily2ee_decrypt_rsa(this.RSA_OAEP_PRIVATE, keyAsBuffer).then(decrypted => {
                // now we can import the key
                lily2ee_importAES(decrypted).then(imported => { 
                    this.AES_KEY = imported; 
                    console.log('[E2EE] AES key imported successfully.');
                    $('#qt-receive-status').text('Connected (encrypted), ready to transfer!').css('color', 'var(--okayucdn-green)');
                    resolve();
                });
            });
        });
    }

    async DecryptChunkAES(chunk_data, iv) {
        return new Promise((resolve) => {
            lily2ee_decrypt_aes(this.AES_KEY, chunk_data, iv).then(decrypted => {
                resolve(decrypted);
            });
        });
    }
}


// -- Starting --

$(document).ready(async () => {
    let domain;
    console.log('ensuring login and getting domain...');
    // get identity to ensure we're logged in
    await $.getJSON('/api/whoami', (result) => {
        if (result.error && result.reason == 'needs_login') document.location = '/login?redir=/qt/receive';

        domain = result.domain.split('://')[1]; 
    });

    console.log('preparing RSA-OAEP keys...');
    SECURITY = new E2EE();
    await SECURITY.GenerateRSA();

    console.log('preparing websocket...');
    SOCKET = await ConnectWS(domain);

    SOCKET.addEventListener('message', (message) => {
        SocketParseMessage(message);
    });
});