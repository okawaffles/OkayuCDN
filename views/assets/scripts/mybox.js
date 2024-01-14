let user, domain;
let alternate = false;

function startDeleteSequence(item, id) {
    if ($(`#${id}`).html() == '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>') {
        $(`#${id}`).html(`${document.cookie.includes('language=ja-jp')?'デリートしますか？':'Are you sure?'}`);
        setTimeout(() => {
            $(`#${id}`).html('<i class="fa-solid fa-trash-can" aria-hidden="true"></i>');
        }, 3000);
    } else {
        deleteItemRequest(item);
    }
}
function deleteItemRequest(item) {
    $.post('/api/mybox/deleteItem', {
        id:item
    }).done(() => {
        // refresh page
        document.location = "/mybox";
    });
}

function share(item, id) {
    const tl_share = `<i class="fa-solid fa-arrow-up-right-from-square"></i>`;
    const tl_copied = `<i class="fa-solid fa-arrow-up-right-from-square"></i></i><strong>  ${(document.cookie.includes("language=ja-jp"))? "リンクがコピーしました" : "Copied link!" }</strong>`;
    const tl_nvgt_text = document.cookie.includes("language=ja-jp")?"OkayuCDNで僕のファイルを見ます！":"View my file on OkayuCDN!";

    try { navigator.share({
        title:'OkayuCDN',
        text:tl_nvgt_text,
        url:`${domain}/view/${user}/${item}`
    }) } catch(e) { 
        navigator.clipboard.writeText(`${domain}/view/${user}/${item}`);
        document.getElementById(`${id}`).innerHTML = tl_copied;
        setTimeout(() => {
            document.getElementById(`${id}`).innerHTML = tl_share;
        }, 1500);
     }
}

function placeUserContent(list, size) {
    try {
        //console.log(list);
        list.forEach(item => {
            const i = list.indexOf(item);
            // The amount of ternary operators here is painful. I apologize.
            
            const mobile = (navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone'));
            const opt_share = `<button id="item-${i}" class="delete" onclick="share('${item}', 'item-${i}');"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>`;
            const opt_dl = `<button class="delete" onclick="document.location = '${domain}/content/${user}/${item}'"><i class="fa-solid fa-download"></i></button>`;
            const opt_del = `<button id="item-del-${i}" class="btn-red delete" onclick="startDeleteSequence('${item}', 'item-del-${i}');"><i class="fa-solid fa-trash-can"></i></button></div></div>`;

            alternate = !alternate;

            let fsize = "";
            if (size[i] > 750*1024*1024)
                fsize = (((size[i] / 1024) / 1024) / 1024).toFixed(2) + "GB";
            else if (size[i] > 750*1024)
                fsize = ((size[i] / 1024) / 1024).toFixed(2) + "MB";
            else if (size[i] > 1024)
                fsize = (size[i] / 1024).toFixed(2) + "KB";
            else
                fsize = `${size[i]}B`;

            $('#content_container').html($('#content_container').html() + 
            `<div class="content_items ${alternate?"item_alternate_true":""}"><div class="mb-item-left"><p style="padding:10px"><span class='size'>${fsize}</span> ${item}` + 
            `</p></div> <div class="mb-item-right">` + 
            opt_share + opt_dl + opt_del);
            
            $('#content_container').css('width', '100%');
        });

        $('#loader').css('display', 'none');

        if (list.length == 0) {
            $('p.mybox_noContent').css('display', 'inline');
        }
    } catch (e) {
        alert('Error in mybox script : ' + e);
    }
}
function setUser(name, this_domain) {
    domain = this_domain;
    user = name;
    try {
        $.getJSON(`/api/quc?user=${name}`, function(data) {
            placeUserContent(data.listing, data.sizelist);
        });
    } catch (e) {
        alert('Error in mybox script : ' + e);
    }
}