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
        if (data.error && data.reason == 'needs_login') document.location = '/login?redir=/upload';

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
        console.error('HELLO BUG REPORTER, YOU WANT THIS -> ' + err.responseText);
    });

    // file picker!
    $('#uploadInterface').on('click', FilePickerClicked);
    $('#uploaded').on('change', UpdateFileName);

    // upload button!
    $('#uploadButton').on('click', StartFileUpload);
}



function FilePickerClicked() {
    $('#uploaded')[0].click();
}

function UpdateFileName() {
    $('#filename').text($('#uploaded')[0].files[0].name);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FPDrag(ev) { ev.preventDefault(); }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FPDrop(ev) {
    ev.preventDefault();

    const temporaryDataTransfer = new DataTransfer();
    temporaryDataTransfer.items.add(ev.dataTransfer.files[0]);
    $('#uploaded')[0].files = temporaryDataTransfer.files;
    UpdateFileName();
}

async function StartFileUpload() {
    const regex = new RegExp('[A-Za-z0-9_]');
    if (!regex.test($('#filename_input')[0].value)) return alert('You may only use alphanumeric characters and underscores in your file names, as well as only up to 25 characters.');

    $('#uploadInterface').css('display', 'none');
    $('#filename_input').css('display', 'none');
    $('#uploadButton').css('display', 'none');

    // append progress bar
    $('progressUpload').append('<div class="progressBar"><div class="up_progress" id="upload_progress"></div></div>');
    $('upload_progress').css('width', '0%');

    const file = $('#uploaded')[0].files[0];
    const chunk_size = 1024*1024*5; // 5MB chunks
    const total_chunks = Math.ceil(file.size / chunk_size);
    let start_byte = 0;
    for (let i = 0; i <= total_chunks; i++) {
        const end_byte = Math.min(start_byte + chunk_size, file.size);
        const chunk = file.slice(start_byte, end_byte);
        console.debug('sending chunk...');
        await sendChunk(chunk, total_chunks, i);
        start_byte += chunk_size;
        
        // change progress bar based on current progress
        $('upload_progress').css('width', `${i / total_chunks}%`);
    }

    let originalFilename = $('#uploaded')[0].files[0].name;
    let extension = 'FILE';
    if (originalFilename.split('.').length > 1) {
        extension = originalFilename.split('.').at(-1);
    }

    $.post('/api/upload/finish', {
        filename: $('#filename_input')[0].value,
        extension,
        chunk_count: total_chunks
    }, (data) => {
        if (data.status == 200) {
            document.location = data.goto;
        }
    });
}

async function sendChunk(chunk, total_chunks, current_chunk) {
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('totalChunks', total_chunks);
    formData.append('currentChunk', current_chunk);
    const response = await fetch('/api/upload?current_chunk='+current_chunk, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) {
        throw new Error(`chunk ${current_chunk} of ${total_chunks} failed.`);
    }
}