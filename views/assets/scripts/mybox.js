let user, domain;

function deleteItemRequest(item) {
    if (confirm((document.cookie.includes("language=ja-jp"))? `${item}をデリートしますか？これがアンドゥしないだろう！` : `Are you sure you want to delete ${item}? This cannot be undone!` )) {
        $.post('/api/mybox/deleteItem', {
            id:item
        }).done(() => {
            // refresh page
            document.location = "/mybox";
        })
    }
}

function share(item, id) {
    const tl_share = `<i class="fa-solid fa-arrow-up-right-from-square"></i></i><strong>  ${(document.cookie.includes("language=ja-jp"))? "シェア" : "Share" }</strong>`;
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
            const opt_share = `<button id="item-${i}" class="delete" onclick="share('${item}', 'item-${i}');"><i class="fa-solid fa-arrow-up-right-from-square"></i><strong>  ${mobile?'':(document.cookie.includes("language=ja-jp"))? "シェア" : "Share" }</strong></button>`;
            const opt_dl = `<button class="delete" onclick="document.location = '${domain}/content/${user}/${item}'"><i class="fa-solid fa-download"></i><strong>  ${mobile?'':(document.cookie.includes("language=ja-jp"))? "ダウンロード" : "Download" }</strong></button>`;
            const opt_del = `<button class="btn-red delete" onclick="deleteItemRequest('${item}');"><i class="fa-solid fa-trash-can"></i><strong>  ${mobile?'':(document.cookie.includes("language=ja-jp"))? "デリート" : "Delete" }</strong></button></div></div>`;

            $('#content_container').html($('#content_container').html() + `<div class="content_items"><div class="mb-item-left"><p style="padding:10px">${item} (${(((size[i] / 1024) / 1024) / 1024).toFixed(2)}GB)</p></div> <div class="mb-item-right">` + opt_share + opt_dl + opt_del);
            
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
function setUser(name, this_domain) {
    domain = this_domain;
    user = name;
    try {
        $.getJSON(`/api/quc?user=${name}`, function(data) {
            placeUserContent(data.listing, data.sizelist);
        });
    } catch (e) {
        alert('error in managescript.js : ' + e);
    }
}