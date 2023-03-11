var browse = document.getElementsByClassName('chooseFiles')[0];
var selectDialog = document.getElementById('uploaded');
var progressUpload = document.getElementById("progressUpload");
var progress;

addProgressBar();

browse.addEventListener("click", function () {
	selectDialog.click();
});

var endFileName;

try {
	document.getElementById("uploadBtn").onclick = function () {
		if (/^([a-zA-Z0-9_-]{1,50})$/.test(document.getElementById('filename').value)) {
			sendFiles(selectDialog.files);
		}
		else {
			$("p.upload_error").html("Error: File name is not valid.");
			$("p.upload_error").css("display", "inline");
		}
	}
} catch (e) {
	alert('Error in quickupload.js')
	console.log(e);
}


function sendFiles(files) {
	$("p.upload_error").css("display", "none");
	resetProgressBar();
	var req = new XMLHttpRequest();
	req.upload.addEventListener("progress", updateProgress);
	req.open("POST", "/api/quickUpload");
	var form = new FormData();
	for (var file = 0; file < files.length; file++) {
		if (navigator.userAgent.includes("Android")) {
			let arr = files[file].name.split('.');
			let arr_last = arr.length - 1;

			form.append("file" + file, files[file], document.getElementById("filename").value + "." + arr[arr_last]);
			endFileName = document.getElementById("filename").value + "." + arr[arr_last]
		} else {
			form.append("file" + file, files[file], document.getElementById("filename").value + "." + files[file].name.split('.').at(-1));
			endFileName = document.getElementById("filename").value + "." + files[file].name.split('.').at(-1)
		}

	}

	req.send(form);
}

function updateProgress(e) {
	console.log((((e.loaded / e.total) * 100)) + "%");
	progress.style.width = (((e.loaded / e.total) * 100)) + "%";
	if (progress.style.width == "100%") {
		$("#visibleToggle").css("display", "inline")
		$("p.upload_error").html("Please wait a moment...");
		$("p.upload_error").css("color", "white");
		$("p.upload_error").css("display", "inline");
		let success = false;

		setTimeout(() => {
			$.getJSON(`/api/getres?user=anonymous&service=uus`, function (data) {
				success = data.success;
				if (!success) {
					if (data.code == "SCH-RNF") {
						$("p.upload_error").html(`Your file has likely uploaded successfully, but is still processing. Wait a few moments.`);
						$("p.upload_error").css("color", "red");
						
						$("#visibleToggle").css("display", "none");
						console.log(`err: ${data.code}`);
					} else {
						$("p.upload_error").html(`An error has occurred while uploading.\nDetails: ${data.details} (${data.code})`);
						$("p.upload_error").css("color", "red");
						
						$("#visibleToggle").css("display", "none")
						console.log(`err: ${data.code}`);
					}
				} else {
					progress.innerHTML = `<br><p>Finished, please wait...</p>`
					console.log(`ok: ${data.toString()}`);
					document.location = `/success?f=${endFileName}&anon=true`;
				}
			})
		}, 2500);
	}

}
function resetProgressBar() {
	progress.innerHTML = ``
	progress.style.width = "0%";
}
function addProgressBar() {
	var progressBar = document.createElement("div");
	progressBar.className = "progressBar";
	progressUpload.appendChild(progressBar);
	var innerDIV = document.createElement("div");
	innerDIV.className = "up_progress";
	progressBar.appendChild(innerDIV);
	progress = document.getElementsByClassName("up_progress")[0];
}

function setup(this_domain) {
	document.getElementById('visibleToggle').style = "display: none";
	domain = this_domain;
	document.getElementById('hider').style = "";
	document.getElementById('storageAmount').style = "";
}

//debug
console.log('loaded quickupload.js');