var browse = document.getElementsByClassName('chooseFiles')[0];
var selectDialog = document.createElement("INPUT");
selectDialog.setAttribute("type", "file");
selectDialog.setAttribute("multiple", "false");
selectDialog.style.display = "none";
var progressUpload = document.getElementsByClassName("progressUpload")[0];
var progress;
addProgressBar();
browse.addEventListener("click", function(){	
	selectDialog.click();
	
});

var endFileName;
var endUserName;

document.getElementById("uploadBtn").onclick = function(){
	if (/^([a-z0-9_-]{1,50})$/.test(document.getElementById('filename').value)) {
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
	req.open("POST", "http://azuki.okawaffles.com/manage/cdnUpload");
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
        progress.innerHTML = `<br><p>File available at https://okayu.okawaffles.com/content/${endUserName}/${endFileName}</p>`
		document.location = `/success?f=${endFileName}`;
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

function assignUserName(NAME) {
    endUserName = NAME;
}

function getStorage(userTotalStorage) {
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