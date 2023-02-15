var browse = document.getElementsByClassName('chooseFiles')[0];
var selectDialog = document.getElementById('uploaded');
var progressUpload = document.getElementById("progressUpload");
var progress;

addProgressBar();

browse.addEventListener("click", function () {
	selectDialog.click();
});

var endFileName;
var endUserName;

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
	alert('Error in uploadscript.js')
	console.log(e);
}


function sendFiles(files) {
	$("p.upload_error").css("display", "none");
	resetProgressBar();
	var req = new XMLHttpRequest();
	req.upload.addEventListener("progress", updateProgress);
	req.open("POST", "/api/upload");
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
			$.getJSON(`/api/getres?user=${endUserName}&service=uus`, function (data) {
				success = data.success;
				if (!success) {
					if (data.code == "SCH-RNF") {
						$("p.upload_error").html("Your file has likely uploaded successfully, but is still processing. Check My Box for more info.");
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
					document.location = `/success?f=${endFileName}`;
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

function assignUserName(username, bugTester, premium) {
	endUserName = username;
	if (premium == "true") document.getElementById('premium-tag').style.display = "inline";
	if (bugTester == "true") {
		document.getElementById('banner-hider').style = "";
		document.getElementById('banner-contents').innerHTML = `Hey ${username}! You seem to be a bug-tester! Thanks for your help! We've upped your storage as a thank-you!`;
		document.getElementById('bugtest-tag').style.display = "inline";
	}

	let reason;
	if (navigator.userAgent.includes("iOS") || navigator.userAgent.includes("iPadOS")) reason = "Warning: You appear to be using an i[Pad]OS device. You likely cannot upload due to a WebKit bug.";
	if (navigator.userAgent.includes("CrOS")) reason = "Warning: You appear to be using a ChromeOS device. This operating system sometimes doesn't work as expected.";
	if (navigator.userAgent.includes("Symbian")) reason = "Warning: You appear to be using a Symbian device. This operating system is not supported.";
	if (navigator.userAgent.includes("Fire OS")) reason = "Warning: You appear to be using a Fire OS device. This device is untested. Please report bugs on the GitHub page.";
	if (navigator.userAgent.includes("Roku") || navigator.userAgent.includes("SMART-TV") || navigator.userAgent.includes("Web0S")) reason = "Warning: You appear to be using a TV device. This device is not supported.";
	if (navigator.userAgent.includes("PlayStation") || navigator.userAgent.includes("Xbox") || navigator.userAgent.includes("PLAYSTATION") || navigator.userAgent.includes("Nintendo Wii")) reason = "Warning: You are using a game console. This device is not supported.";

	if (reason) {
		document.getElementById("banner-ua-notice").style = "display: inherit";
		document.getElementById("ua-warning-contents").innerHTML = reason;
	}
}

function getStorage() {
	document.getElementById('visibleToggle').style = "display: inline;";
	$.getJSON(`/api/qus?user=${endUserName}`, function (data) {
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

//debug
console.log('loaded uploadscript.js');