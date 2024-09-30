/* eslint-disable no-undef */

const EXPERIMENT_UPLOAD_LOWER_CHUNK_SIZE = document.cookie.includes('okayu-experiment=upload-lower-chunk-size');

// get identity on load <- no.
$(document).ready(() => {
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

let USED_STORAGE, TOTAL_STORAGE;

function start() {
    TOTAL_STORAGE = 0;
    USED_STORAGE = 0;

    // Get user's storage
    $.getJSON('/api/storage', (data) => {
        if (data.error && data.reason == 'needs_login') document.location = '/login?redir=/upload';

        // we only care about the storage numbers right now
        USED_STORAGE = data.used;
        TOTAL_STORAGE = data.total;

        if (USED_STORAGE >= TOTAL_STORAGE) {
            alert('It appears you\'ve run out of storage! Head over to My Box to delete some content before uploading!');
            document.location = '/mybox';
            return;
        }

        // set up the new storage bar
        $('#used').text(parseStorageAmount(USED_STORAGE));
        $('#total').text(parseStorageAmount(TOTAL_STORAGE));
        $('#fill').css('width', `${(USED_STORAGE / TOTAL_STORAGE)*20}em`);
        $('#newStorageAmount').css('visibility', 'visible');

        // allow the rest of the page to load
        $('#hider').css('display', 'flex');
    }).fail((err) => {
        if (err.contains('Too Many Requests')) return alert('Too many API requests. Please wait at least 5 minutes and try again.');
        alert('Error in upload_v6.js.\n\nIf you are on desktop, please open your browser console and report the bug at https://github.com/okawaffles/OkayuCDN');
        console.error('HELLO BUG REPORTER, YOU WANT THIS -> ' + err.responseText);
    });

    // file picker!
    $('#uploadInterface').on('click', FilePickerClicked);
    $('#uploaded').on('change', UpdateFileName);

    // upload button!
    $('#uploadButton').on('click', StartFileUpload);

    $('#filename_input').focusout(() => {
        $('#uploadButton').prop('disabled', $('#filename_input').val() == '');
    }); 
}

/**
 * Calculate the approximate time to upload a file.
 * Because of Cloudflare proxying, uploads take around 1200ms per chunk.
 * It's stupid but I can't find a fix.
 * @param {number} chunk_count number of file chunks
 * @returns {string} formatted approximate upload time
 */
function CalculateApproxUploadTime(chunk_count) {
    if (typeof chunk_count != 'number') return 0;
        
    let ms = chunk_count * 1500;
    let sec = 0;
    let min = 0;
    if (ms >= 1200) {
        while (ms >= 1000 && ms > 0) {
            sec++;
            ms -= 1000;
        }

        if (ms > 0) sec++;
    }

    if (sec >= 60) {
        while (sec / 60 >= 1 && sec > 0) {
            min++;
            sec -= 60;
        }
    }

    return `${min}min ${sec}sec`;
}

function FilePickerClicked() {
    $('#uploaded')[0].click();
}

function UpdateFileName() {
    $('#filename').text($('#uploaded')[0].files[0].name);
    let file_size = $('#uploaded')[0].files[0].size;

    $('#fill-preview').css('width', `${((USED_STORAGE + file_size) / TOTAL_STORAGE)*20}em`);

    const chunk_size = 1024*1024*5; // 5MB chunks
    const total_chunks = Math.ceil(file_size / chunk_size);
    $('#approxTime').text(`Approximate Upload Time: ${CalculateApproxUploadTime(total_chunks)}`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FPDrag(ev) { ev.preventDefault(); }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FPDrop(ev) {
    ev.preventDefault();

    $('#fill').css('width', `${(USED_STORAGE / TOTAL_STORAGE)*20}em`);

    const temporaryDataTransfer = new DataTransfer();
    temporaryDataTransfer.items.add(ev.dataTransfer.files[0]);
    $('#uploaded')[0].files = temporaryDataTransfer.files;
    UpdateFileName();
}

let uploadInProgress = false;

async function StartFileUpload() {
    if ($('#uploaded')[0].files[0] == undefined) {
        $('#uploadInterface').css('animation', 'file_missing 1s');
        setTimeout(() => {
            $('#uploadInterface').css('animation', 'none');
        }, 1000);
        return;
    }

    if ($('#filename_input').val() == '') {
        $('#filename_input').css('animation', 'bad-login 0.5s ease-in-out');
        setTimeout(() => {
            $('#filename_input').css('animation', 'none');
        }, 550);
        return;
    }

    const regex = new RegExp('^[A-Za-z0-9_-]+$');
    if (!regex.test($('#filename_input')[0].value) || $('#filename_input').val().length > 25) {
        // alert('You may only use alphanumeric characters and underscores in your file names, as well as only up to 25 characters.');

        $('#filename_input').css('animation', 'bad-login 0.5s ease-in-out');
        $('#filename-error').css('display', 'inherit').text('You may only use alphanumeric characters and underscores in your file names, as well as only up to 25 characters.');
        setTimeout(() => {
            $('#filename_input').css('animation', 'none');
        }, 550);

        return;
    }

    $('#hider').css('display', 'none');
    $('#uploadInterface').css('display', 'none');
    $('#filename_input').css('display', 'none');
    $('#uploadButton').css('display', 'none');
    $('#div_private').css('display', 'none');
    $('#div_progress').css('display', 'flex');


    uploadInProgress = true;

    const file = $('#uploaded')[0].files[0];
    const chunk_size = EXPERIMENT_UPLOAD_LOWER_CHUNK_SIZE?1024*1024*1:1024*1024*5; // 5MB chunks
    const total_chunks = Math.ceil(file.size / chunk_size);
    let start_byte = 0;
    for (let i = 0; i <= total_chunks; i++) {
        const end_byte = Math.min(start_byte + chunk_size, file.size);
        const chunk = file.slice(start_byte, end_byte);
        // console.debug('sending chunk...');
        chunkHasFailed = false;
        try {
            await sendChunk(chunk, total_chunks, i);
        } catch(e) {
            return alert(`Upload failed due to an unknown error (${e})`);
        }
        start_byte += chunk_size;
        
        // change progress bar based on current progress
        $('#progress').css('width', `${(i / total_chunks)*100}%`);
    }

    let originalFilename = $('#uploaded')[0].files[0].name;
    let extension = 'FILE';
    if (originalFilename.split('.').length > 1) {
        extension = originalFilename.split('.').at(-1);
    }

    $('#processing').css('display', 'inherit');

    $.post('/api/upload/finish', {
        filename: $('#filename_input')[0].value,
        extension,
        chunk_count: total_chunks,
        isPrivate: $('#private_toggle').is(':checked')
    }, (data) => {
        if (data.status == 200) {
            document.location = data.goto;
        } else {
            alert('Failed to finish file upload.');
        }
    });
}

let chunkHasFailed = false;

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
        if (!chunkHasFailed) {
            chunkHasFailed = true;
            // retry the chunk
            sendChunk(chunk, total_chunks, current_chunk);
            return;
        }
        alert(`Upload failed, as one of the file chunks was unable to be uploaded. Trying again may help. (${current_chunk} of ${total_chunks} failed twice)`);
        uploadInProgress = false;
        throw new Error(`chunk ${current_chunk} of ${total_chunks} failed.`);
    }
}

$(window).on('beforeunload', (e) => {
    if (!uploadInProgress) return;
    
    if (confirm('WARNING: Leaving will cancel your upload! Are you sure you want to leave?')) {
        e.preventDefault();
    }
});
