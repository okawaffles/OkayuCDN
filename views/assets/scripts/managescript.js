let uname;

function placeUserContent(list, size) {
    //console.log(list);
    list.forEach(item => {
        let i = list.indexOf(item);
        document.getElementById('contentList').innerHTML += `<div style="width:100%;background-color:#111;padding:0px;border-radius:12px;"><p style="padding:10px">${item} (${(((size[i] / 1024) / 1024) / 1024).toFixed(2)}GB)</p></div>`;
        document.getElementById('contentList').style = "width: 100%;";
        document.getElementById('loader').style = "display: none";
    });
}
function setUser(name) {
    uname = name;
    $.getJSON(`/quc?user=${uname}`, function(data) {
        //console.log(data.listing);
        placeUserContent(data.listing, data.sizelist);
    });
}