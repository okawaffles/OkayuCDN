var browse = document.getElementsByClassName('uploadfile')[0];
var selectDialog = document.getElementById('uploaded');
var progressUpload = document.getElementById("progressUpload");
var progress;

addProgressBar();

browse.addEventListener("click", function () {
	selectDialog.click();
});

selectDialog.onchange = function () {
	$("#shownfilename").text(selectDialog.files[0].name);
}

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

	// only upload one file at a time
	form.append("file" + files[0], files[0], document.getElementById("filename").value + "." + files[0].name.split('.').at(-1));
	endFileName = document.getElementById("filename").value + "." + files[0].name.split('.').at(-1)

	req.send(form);
}

function checkResult() {
	const check = $.getJSON(`/api/getres?user=${endUserName}&service=uus`, function (data) {
		console.log("data: " + JSON.stringify(data));
		let success = data.success;
		if (!success) {
			if (data.code != "SCH-RNF") {
				$("p.upload_error").html(`An error has occurred while uploading.<br>Details: ${data.details} (${data.code})`);
				$("p.upload_error").css("color", "red");

				// $("#visibleToggle").css("display", "none")
				console.log(`error: ${data.code}`);
			} else {
				setTimeout(() => {
					checkResult();
				}, 2500);
			}
		} else {
			progress.innerHTML = `<br><p>Finished, please wait...</p>`
			console.log(`ok: ${data.toString()}`);
			document.location = `/success?f=${endFileName}`;
		}
	})

	setTimeout(() => {
		check.abort();
		$("p.upload_error").html(`The server did not respond in 25 seconds. It may be under high load, or you might be located too far away.<br>Details: client checkResult() request timeout (CCR-RTO)`);
		$("p.upload_error").css("color", "red");
	}, 25000);
}

function updateProgress(e) {
	console.log((((e.loaded / e.total) * 100)) + "%");
	progress.style.width = (((e.loaded / e.total) * 100)) + "%";
	if (progress.style.width == "100%") {
		//$("#visibleToggle").css("display", "inline")
		$("p.upload_error").html("Processing your file, please wait a moment...");
		$("p.upload_error").css("color", "white");
		$("p.upload_error").css("display", "inline");
		let finished = false;

		setTimeout(() => {
			checkResult();
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

	let reason = "DoNotDisplay";
	//if (!navigator.userAgent.includes("Firefox")) reason = "Warning: Your browser doesn't seem to be Firefox-based. Please note that this site is maintained based off of Firefox. Please report any bugs on the GitHub (okawaffles/OkayuCDN)!";
	//if (navigator.userAgent.includes("iPhone OS") || navigator.userAgent.includes("iPad OS")) reason = "Warning: You appear to be using an Apple device. You likely cannot upload due to a WebKit bug.";
	//if (navigator.userAgent.includes("CrOS")) reason = "Warning: You appear to be using a ChromeOS device. This operating system sometimes doesn't work as expected.";
	if (navigator.userAgent.includes("Symbian")) reason = "Warning: You appear to be using a Symbian device. This operating system is not supported.";
	if (navigator.userAgent.includes("Fire OS")) reason = "Warning: You appear to be using a Fire OS device. This device is unsupported.";
	if (navigator.userAgent.includes("Roku") || navigator.userAgent.includes("SMART-TV") || navigator.userAgent.includes("Web0S")) reason = "Warning: You appear to be using a TV device. Why are you even trying this?";
	if (navigator.userAgent.includes("PlayStation") || navigator.userAgent.includes("Xbox") || navigator.userAgent.includes("PLAYSTATION") || navigator.userAgent.includes("Nintendo Wii")) reason = "Warning: You are using a game console. Why are you even trying this?";

	if (reason != "DoNotDisplay") {
		$("#banner-ua-notice").css("display", "inline");
		$("#ua-warning-contents").html(reason);
	}

	if (navigator.userAgent.includes("iPhone OS") || navigator.userAgent.includes("iPad OS") || navigator.userAgent.includes("Android")) {
		$('#datecode').css('display', 'none');
		$('#shownfilename').text('Tap to upload');
	}
}

function getStorage() {
	// document.getElementById('visibleToggle').style = "display: inline;";
	$.getJSON(`/api/qus?user=${endUserName}`, function (data) {
		let storage;
		if (data.size > 750 * 1024 * 1024) {
			storage = (((data.size / 1024) / 1024) / 1024).toFixed(2) + "GB";
		} else if (data.size < 750 * 1024 * 1024) {
			storage = ((data.size / 1024) / 1024).toFixed(2) + "MB";
		} else if (data.size < 750 * 1024) {
			storage = (data.size / 1024).toFixed(2) + "KB";
		} else {
			storage = data.size + "B"
		}

		let total;
		if (data.userTS > 750 * 1024 * 1024) {
			total = (((data.userTS / 1024) / 1024) / 1024).toFixed(2) + "GB";
		} else if (data.userTS < 750 * 1024 * 1024) {
			total = ((data.userTS / 1024) / 1024).toFixed(2) + "MB";
		} else if (data.userTS < 750 * 1024) {
			total = (data.userTS / 1024).toFixed(2) + "KB";
		} else {
			total = data.userTS + "B"
		}

		$('#used').html(storage);
		$('#total').html(total);
		$('#fill').css('width', (data.size/data.userTS)*20+'em');

		if (data.size < data.userTS) {
			document.getElementById('hider').style = "";
		} else {
			alert(document.cookie.includes("language=ja-jp") ? 'あなたは保存を有しません。' : 'You seem to have run out of storage! Please use the My Box page to remove content before continuing.')
		}
	})
}

function drag(ev) {
	//console.log("File(s) in drop zone");

	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();
}

function drop(ev) {
	//console.log("File was dropped in drop zone")
	ev.preventDefault();

	const dt = new DataTransfer();
	dt.items.add(ev.dataTransfer.files[0]);
	selectDialog.files = dt.files;

	console.log(selectDialog.files[0].name);
	$('#shownfilename').text(selectDialog.files[0].name);
}

//debug
console.log('loaded upload.js');