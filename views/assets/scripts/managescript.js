let uname;

function placeUserContent(list) {
    //console.log(list);
    list.forEach(item => {
        document.getElementById('contentList').innerHTML += `<p>${item}</p>`;
        document.getElementById('contentList').style = "";
        document.getElementById('loader').style = "display: none";
    });
}
function setUser(name) {
    uname = name;
    $.getJSON(`/quc?user=${uname}`, function(data) {
        //console.log(data.listing);
        placeUserContent(data.listing);
    });
}