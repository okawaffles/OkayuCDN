var browse = document.getElementsByClassName('chooseFiles')[0];
var selectDialog = document.getElementById('uploaded');
var progressUpload = document.getElementsByClassName("progressUpload")[0];
var progress;
addProgressBar();
browse.addEventListener("click", function(){	
	selectDialog.click();
	
});

var endFileName;
var endUserName;

document.getElementById("uploadBtn").onclick = function(){
	if (/^([a-zA-Z0-9_-]{1,50})$/.test(document.getElementById('filename').value)) {
		sendFiles(selectDialog.files);
	}
	else {
		alert("Filename not valid.");
	}
}

function sendFiles(files){
	
	resetProgressBar();
	var req = new XMLHttpRequest();	
	req.upload.addEventListener("progress", updateProgress);
	req.open("POST", "/manage/cdnUpload");
	//req.setRequestHeader('Content-type', 'application/json');
	var form = new FormData();
	for(var file = 0; file < files.length; file++){		
		
		form.append("file" + file, files[file], document.getElementById("filename").value + "." + files[file].name.split('.').at(-1));
		endFileName = document.getElementById("filename").value + "." + files[file].name.split('.').at(-1)
	}
	req.send(form);
}

function updateProgress(e){
	
	progress.style.width = (((e.loaded/e.total)*100))+ "%";
    if(progress.style.width == "100%") {
		document.getElementById('visibleToggle').style = "display: inline; margin-top:50px;";
		progress.innerHTML = `<br><p>Hold on! We're delaying to make sure the server got your file...</p>`
		let success = false;

		setTimeout(() => {
			$.getJSON(`/cec?user=${endUserName}&file=${endFileName}`, function(data) {
				success = data.result;
				if (!success) {
					progress.innerHTML = `<br><p style="color:red;">Something went wrong when uploading your file. Error Info: UUS-CEC (UPLOAD_SERVICE_DID_NOT_SUCCEED)</p>`
					document.getElementById('visibleToggle').style = "display: none;";
				} else {
					progress.innerHTML = `<br><p>Finished, please wait...</p>`
					document.location = `/success?f=${endFileName}`;
				}
			})
		}, 5000);
    }

}
function resetProgressBar(){
	progress.innerHTML = ``
	progress.style.width = "0%";
}
function addProgressBar(){
	var progressBar = document.createElement("div");
	progressBar.className = "progressBar";
	progressUpload.appendChild(progressBar);
	var innerDIV = document.createElement("div");
	innerDIV.className = "progress";
	progressBar.appendChild(innerDIV);
	progress = document.getElementsByClassName("progress")[0];
}

function assignUserName(username, bugTester) {
    endUserName = username;
	if (bugTester == "true") {
		document.getElementById('banner-hider').style = "";
		document.getElementById('banner-contents').innerHTML = `Hey ${username}! You seem to be a bug-tester! Thanks for your help! We've upped your storage as a thank-you!`;
	}
}

function getStorage() {
	document.getElementById('visibleToggle').style = "display: inline;";
	$.getJSON(`/qus?user=${endUserName}`, function(data) {
		document.getElementById('storageAmount').innerHTML = `You have used ${(((data.size / 1024) / 1024) / 1024).toFixed(2)}GB of storage (of your ${((data.userTS / 1024) / 1024) / 1024}GB)`
		document.getElementById('storageAmount').style = "";
		document.getElementById('visibleToggle').style = "display: none;";
		
		if (data.size < data.userTS) {
			document.getElementById('hider').style = "";
		} else {
			alert('You seem to have run out of storage! Please use the manage page to remove content before continuing.')
		}
	})
}