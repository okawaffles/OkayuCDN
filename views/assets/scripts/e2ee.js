// LILY2EE -- Lily End2End Encryption
// a really simple-to-use e2ee drop-in file
// intended for one-way data transfer, where only data encryption matters, 
// and standard protocol messages are not encrypted. 

console.info('LILY2EE -- Lily\'s Drop-in End2End Encryption stub');

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Generate an end-to-end encryption public-private keypair
 * @returns {Promise<CryptoKeyPair>} The generated keypair
 */
async function lily2ee_generateKeypair() {
    return new Promise((resolve) => {
        crypto.subtle.generateKey({
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        }, true, ['encrypt', 'decrypt']).then(kp => {
            resolve(kp);
        });

    });
}

/**
 * Export a public key from a keypair
 * @param {CryptoKey} key The public key to export
 * @returns {Promise<ArrayBuffer>} The exported public key
 */
async function lily2ee_exportPublicKey(key) {
    return new Promise((resolve) => {
        crypto.subtle.exportKey('spki', key).then(a => resolve(a));
    });
}


async function lily2ee_importPublicKeyFromBase64(keyInBase64) {
    return new Promise((resolve) => {
        const binaryPublicKey = Uint8Array.from(atob(keyInBase64), (c) => c.charCodeAt(0));

        crypto.subtle.importKey('spki', binaryPublicKey.buffer, {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        }, true, ['encrypt']).then(a => resolve(a));
    });
}

async function lily2ee_encrypt_rsa(public_key, data) {
    return new Promise((resolve) => {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);

        crypto.subtle.encrypt({ name: 'RSA-OAEP', hash: 'SHA-256' }, public_key, encoded).then(encrypted => {
            resolve(encrypted);
        });
    });
}
async function lily2ee_decrypt_rsa(private_key, data) {
    const decoder = new TextDecoder();
    return new Promise((resolve) => {
        crypto.subtle.decrypt({ name: 'RSA-OAEP', hash: 'SHA-256' }, private_key, data).then(decrypted => {
            resolve(decoder.decode(decrypted));
        });
    });
}


// for AES

async function lily2ee_generateAESKey() {
    return new Promise((resolve) => {
        crypto.subtle.generateKey({
            name: 'AES-GCM',
            length: 256
        }, true, ['encrypt', 'decrypt']).then(key => resolve(key));
    });
}

async function lily2ee_exportAES(aesKey) {
    return new Promise((resolve) => {
        crypto.subtle.exportKey('jwk', aesKey).then(exported => resolve(JSON.stringify(exported)));
    });
}
async function lily2ee_importAES(aesKey) {
    console.log(aesKey);
    return new Promise((resolve) => {
        crypto.subtle.importKey('jwk', JSON.parse(aesKey), { name: 'AES-GCM' }, true, ['decrypt']).then(imported => resolve(imported));
    });
}


async function lily2ee_encrypt_aes(aesKey, data) {
    return new Promise((resolve) => {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        crypto.subtle.encrypt({
            name: 'AES-GCM',
            iv
        }, aesKey, Uint8Array.from(atob(data), (c) => c.charCodeAt(0))).then(encrypted => {
            resolve({
                encryptedChunk: new Uint8Array(encrypted), iv
            });
        });
    });
}


async function lily2ee_decrypt_aes(aesKey, encrypted, iv) {
    return new Promise((resolve) => {
        crypto.subtle.decrypt({ name: 'AES-GCM', iv:convertCommaSepToBuffer(iv) }, aesKey, convertCommaSepToBuffer(atob(encrypted))).then((decrypted) => {
            const decryptedArray = new Uint8Array(decrypted);
            resolve(decryptedArray); // Resolve the binary data
        });
    });
}

// helpers

function convertCommaSepToBuffer(given) {
    // Step 1: Split the string into an array of strings
    const ivArray = given.split(','); // ["161", "237", "158", "115", "209", "111", "195", "224", "253", "188", "56", "225"]

    // Step 2: Convert each string to an integer
    const ivInts = ivArray.map(Number); // [161, 237, 158, 115, 209, 111, 195, 224, 253, 188, 56, 225]

    // Step 3: Create a Uint8Array (or any other suitable typed array)
    const ivBufferSource = new Uint8Array(ivInts); // Creates a Uint8Array from the integer array

    return ivBufferSource; // This is your BufferSource
}