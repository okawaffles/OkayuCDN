let uname;

function deleteItemRequest(item) {
    if (confirm(`Are you sure you want to delete ${item}? This cannot be undone!`))
        window.location = `/deleteItem?itemName=${item}`;
}

function placeUserContent(list, size) {
    try {
        //console.log(list);
        list.forEach(item => {
            let i = list.indexOf(item);
            document.getElementById('content_container').innerHTML += `<div class="content_items"><p style="padding:10px">${item} (${(((size[i] / 1024) / 1024) / 1024).toFixed(2)}GB)</p> <button class="btn-red delete" onclick="deleteItemRequest('${item}');"><i class="fa-solid fa-trash-can"></i><strong>  Delete</strong></button></div>`;
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
        $.getJSON(`/api/quc?user=${uname}`, function(data) {
            placeUserContent(data.listing, data.sizelist);
        });
    } catch (e) {
        alert('error in managescript.js : ' + e);
    }
}