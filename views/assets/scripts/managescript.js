let uname;

function placeUserContent(list, size) {
    try {
        //console.log(list);
        list.forEach(item => {
            let i = list.indexOf(item);
            document.getElementById('content_container').innerHTML += `<div class="content_items"><p style="padding:10px">${item} (${(((size[i] / 1024) / 1024) / 1024).toFixed(2)}GB)</p></div>`;
            document.getElementById('content_container').style = "width: 100%;";
            document.getElementById('loader').style = "display: none";
        });
    } catch (e) {
        alert('error in managescript.js : ' + e);
    }
}
function setUser(name) {
    uname = name;
    try {
        $.getJSON(`/quc?user=${uname}`, function(data) {
            //console.log(data.listing);
            placeUserContent(data.listing, data.sizelist);
        });
    } catch (e) {
        alert('error in managescript.js : ' + e);
    }
}