let user, domain;
let alternate = false;

function startDeleteSequence(item, id, mobile) {
    if (mobile) {
        if ($(`#m-delete-item-${id}`).html() == '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>') {
            $(`#${id}`).html(`${document.cookie.includes('language=ja-jp')?'<i class="fa-solid fa-check"></i> デリートしますか？':'<i class="fa-solid fa-check"> Are you sure?</i>?'}`);
            setTimeout(() => {
                $(`#${id}`).html('<i class="fa-solid fa-trash-can" aria-hidden="true"> Delete</i>');
            }, 3000);
        } else {
            deleteItemRequest(item);
        }

        return;
    }


    if ($(`#delete-item-${id}`).html() == '<i class="fa-solid fa-trash-can" aria-hidden="true"> Delete</i>') {
        $(`#delete-item-${id}`).html(`${document.cookie.includes('language=ja-jp')?'<i class="fa-solid fa-check"></i> デリートしますか？':'<i class="fa-solid fa-check"> Are you sure?</i>?'}`);
        setTimeout(() => {
            $(`#delete-item-${id}`).html('<i class="fa-solid fa-trash-can" aria-hidden="true"> Delete</i>');
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

function share(item, id, mobile) {
    const tl_share = `<i class="fa-solid fa-arrow-up-right-from-square"> Share</i>`;
    const tl_share_mobile = `<i class="fa-solid fa-arrow-up-right-from-square"></i>`;
    const tl_copied = `<i class="fa-solid fa-arrow-up-right-from-square"></i></i><strong>  ${(document.cookie.includes("language=ja-jp"))? "リンクがコピーしました" : "Copied link!" }</strong>`;
    const tl_nvgt_text = document.cookie.includes("language=ja-jp")?"OkayuCDNで僕のファイルを見ます！":"View my file on OkayuCDN!";

    try { navigator.share({
        title:'OkayuCDN',
        text:tl_nvgt_text,
        url:`${domain}/content/${user}/${item}`
    }) } catch(e) { 
        navigator.clipboard.writeText(`${domain}/view/${user}/${item}`);
        document.getElementById(`share-content-${id}`).innerHTML = tl_copied;
        setTimeout(() => {
            document.getElementById(`share-content-${id}`).innerHTML = mobile?tl_share_mobile : tl_share;
        }, 1500);
     }
}

function generateItem(id, item, fsize, alternate) {
    return `<div class="content_items ${alternate?'alternate':''}">
    <div class="top">
        <div class="left">
            <span class="size">${fsize}</span>
            <p class="name">${item}</p>
        </div>
        <div class="right">
            <button class="dropdown okayu-green" id="showhide-button-${id}" onclick="dropdown(${id})">
                <i class="fa-solid fa-caret-down"></i>
            </button>
        </div>
    </div>
    <div class="bottom" id="showhide-id-${id}">
        <button class="share desktop" id="share-content-${id}" onclick="share('${item}', ${id}, false)"><i class="fa-solid fa-arrow-up-right-from-square"></i> Share</button>
        <button class="view desktop"><i class="fa-solid fa-eye"></i> View</button>
        <button class="dl desktop"><i class="fa-solid fa-download"></i> Download</button>
        <button class="btn-red delete desktop" id="delete-item-${id}" onclick="startDeleteSequence('${item}', ${id}, false)"><i class="fa-solid fa-trash-can"></i> Delete</button>

        <button class="share mobile" id="share-content-${id}" onclick="share('${item}', ${id}, true)"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
        <button class="view mobile"><i class="fa-solid fa-eye"></i></button>
        <button class="dl mobile"><i class="fa-solid fa-download"></i></button>
        <button class="btn-red delete mobile" id="m-delete-item-${id}" onclick="startDeleteSequence('${item}', ${id}, false)"><i class="fa-solid fa-trash-can"></i></button>
    </div>
</div>`
}

function placeUserContent(list, size) {
    try {
        //console.log(list);
        list.forEach(item => {
            const i = list.indexOf(item);

            let fsize = "";
            if (size[i] > 750*1024*1024)
                fsize = (((size[i] / 1024) / 1024) / 1024).toFixed(2) + "GB";
            else if (size[i] > 750*1024)
                fsize = ((size[i] / 1024) / 1024).toFixed(2) + "MB";
            else if (size[i] > 1024)
                fsize = (size[i] / 1024).toFixed(2) + "KB";
            else
                fsize = `${size[i]}B`;

            $('#content_container').html($('#content_container').html() + generateItem(i, item, fsize, !(i % 2)));
            
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

function dropdown(id) {
    const item = id.toString();

    if ($(`#showhide-id-${item}`).css('display') == 'none') {
        $(`#showhide-id-${item}`).css('display', 'flex');
        $(`#showhide-button-${item}`).html('<i class="fa-solid fa-caret-up"></i>');
    } else {
        $(`#showhide-id-${item}`).css('display', 'none');
        $(`#showhide-button-${item}`).html('<i class="fa-solid fa-caret-down"></i>');
    }
}