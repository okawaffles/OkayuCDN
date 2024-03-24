/* eslint-disable no-undef */
var browse = document.getElementsByClassName('chooseFiles')[0];
var selectDialog = document.getElementById('uploaded');
var progressUpload = document.getElementById('progressUpload');
var progress;

addProgressBar();

browse.addEventListener('click', function () {
    selectDialog.click();
});

var endFileName;

try {
    document.getElementById('uploadBtn').onclick = function () {
        sendFiles(selectDialog.files);
    };
} catch (e) {
    alert('Error in quickupload.js');
    console.log(e);
}


function sendFiles(files) {
    $('p.upload_error').css('display', 'none');
    resetProgressBar();
    var req = new XMLHttpRequest();
    req.upload.addEventListener('progress', updateProgress);
    req.open('POST', '/api/quickUpload');
    var form = new FormData();
    for (var file = 0; file < files.length; file++) {
        if (navigator.userAgent.includes('Android')) {
            form.append('file' + file, files[file], files[file].name);
            endFileName = files[file].name;
        } else {
            form.append('file' + file, files[file], files[file].name);
            endFileName = files[file].name;
        }

    }

    req.send(form);
}

function checkResult() {
    $.getJSON('/api/getres?user=anonymous&service=qus', function (data) {
        let success = data.success;
        if (!success) {
            if (data.code != 'SCH-RNF') {
                $('p.upload_error').html(`An error has occurred while uploading.\nDetails: ${data.details} (${data.code})`);
                $('p.upload_error').css('color', 'red');
                
                $('#visibleToggle').css('display', 'none');
                console.log(`error: ${data.code}`);
            } else {
                setTimeout(() => {
                    checkResult();
                }, 2500);
            }
        } else {
            progress.innerHTML = '<br><p>Finished, please wait...</p>';
            console.log(`ok: ${data.toString()}`);
            endFileName = data.id;
            document.location = `/success?f=${endFileName}&anon=true`;
        }
    });
}

function updateProgress(e) {
    console.log((((e.loaded / e.total) * 100)) + '%');
    progress.style.width = (((e.loaded / e.total) * 100)) + '%';
    if (progress.style.width == '100%') {
        $('#visibleToggle').css('display', 'inline');
        $('p.upload_error').html('Please wait a moment...');
        $('p.upload_error').css('color', 'white');
        $('p.upload_error').css('display', 'inline');

        setTimeout(() => {
            checkResult();
        }, 2500);
    }

}
function resetProgressBar() {
    progress.innerHTML = '';
    progress.style.width = '0%';
}
function addProgressBar() {
    var progressBar = document.createElement('div');
    progressBar.className = 'progressBar';
    progressUpload.appendChild(progressBar);
    var innerDIV = document.createElement('div');
    innerDIV.className = 'up_progress';
    progressBar.appendChild(innerDIV);
    progress = document.getElementsByClassName('up_progress')[0];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function setup(this_domain) {
    document.getElementById('visibleToggle').style = 'display: none';
    domain = this_domain;
    document.getElementById('hider').style = '';
    document.getElementById('storageAmount').style = '';
}

//debug
console.log('loaded quickupload.js');