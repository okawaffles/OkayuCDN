let uname;

function deleteItemRequest(item) {
    if (confirm(`Are you sure you want to delete ${item}? This cannot be undone!`)) {
        $.post('/api/mybox/deleteItem', {
            id:item
        }).done(() => {
            // refresh page
            document.location = "/mybox";
        })
    }
}

function placeUserContent(list, size) {
    try {
        //console.log(list);
        list.forEach(item => {
            let i = list.indexOf(item);
            $('#content_container').html($('#content_container').html() + `<div class="content_items"><p style="padding:10px">${item} (${(((size[i] / 1024) / 1024) / 1024).toFixed(2)}GB)</p> <button class="btn-red delete" onclick="deleteItemRequest('${item}');"><i class="fa-solid fa-trash-can"></i><strong>  Delete</strong></button></div>`);
            $('#content_container').css('width', '100%');
        });

        $('#loader').css('display', 'none');

        if (list.length == 0) {
            $('p.mybox_noContent').css('display', 'inline');
        }
    } catch (e) {
        alert('error in managescript.js : ' + e);
    }
}
function setUser(name) {
    try {
        $.getJSON(`/api/quc?user=${name}`, function(data) {
            placeUserContent(data.listing, data.sizelist);
        });
    } catch (e) {
        alert('error in managescript.js : ' + e);
    }
}