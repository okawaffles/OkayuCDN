let DOMAIN = 'https://okayucdn.com';
let USERNAME = 'anonymous';
let BOX_ITEMS = [];
let PROTECTED_BOX_ITEMS = [];
let USED_STORAGE, TOTAL_STORAGE;
const IS_MOBILE = navigator.userAgent.includes('Android') || navigator.userAgent.includes('iOS');
const EXPERIMENT_ITEMS_HOVER = document.cookie.includes('okayu-experiment=mybox-items-hover') && !IS_MOBILE;

$(document).ready(() => {
    $.getJSON('/api/whoami', (data) => {
        if (data.result != 200) {
            return document.location = '/login?redir=/mybox';
        }

        DOMAIN = data.domain;
        USERNAME = data.username;
        LoadBox(data.username);
    });

    $('#sort_method').on('change', () => {
        $('#content_container').empty();
        RenderBox();
    });

    if (EXPERIMENT_ITEMS_HOVER) $('#experiment-on').css('display', 'inline').text('EXPERIMENT_ITEMS_HOVER is active');
});


function LoadBox() {
    $('#content_container').css('display', 'none');

    $.getJSON('/api/storage', (data) => {
        BOX_ITEMS = data.content;
        PROTECTED_BOX_ITEMS = data.protected_files;

        TOTAL_STORAGE = data.total;
        USED_STORAGE = data.used;

        // 20em is too big for some mobile devices and causes the bar to be incorrectly filled
        let barWidthInEm = IS_MOBILE?visualViewport.width/32:20;
        console.log('bar width in em:' + barWidthInEm);

        $('#used').text(parseStorageAmount(USED_STORAGE));
        $('#total').text(parseStorageAmount(TOTAL_STORAGE));
        $('#fill').css('width', `${(USED_STORAGE / TOTAL_STORAGE) * barWidthInEm}em`);
        $('#mybox-fill-preview').css('width', `${(USED_STORAGE / TOTAL_STORAGE)*barWidthInEm}em`);
        $('#newStorageAmount').css('visibility', 'visible').css('width', `${barWidthInEm}em`);

        RenderBox();
    });
}

function GetSort(type) {
    switch (type) {
    case 'default':
        return function (a, b) {
            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1; else return 1;
        };
    case 'size-large':
        return function (a, b) {
            if (a.size > b.size) return -1; else return 1;
        };
    case 'size-small':
        return function (a, b) {
            if (a.size < b.size) return -1; else return 1;  
        };
    case 'date-new':
        return function (a, b) {
            if (a.date > b.date) return -1; else return 1;
        };
    case 'date-old':
        return function (a, b) {
            if (a.date < b.date) return -1; else return 1;
        };
    case 'filetype':
        return function (a, b) {
            if (a.name.toLowerCase().split('.').at(-1) < b.name.toLowerCase().split('.').at(-1)) return -1; else return 1;
        };
    case 'privated':
        return function (a, b) {
            if (PROTECTED_BOX_ITEMS.indexOf(a.name) > PROTECTED_BOX_ITEMS.indexOf(b.name)) return -1; else return 1;
        };
    default:
        return function (a, b) {
            if (a.name < b.name) return -1; else return 1;
        };
    }
}

function RenderBox() {
    $('#content_container').css('display', 'none');

    let SORTED_BOX_ITEMS = [];
    const SortFunction = GetSort($('#sort_method').val());

    SORTED_BOX_ITEMS = BOX_ITEMS.sort(SortFunction);

    let i = 0;
    SORTED_BOX_ITEMS.forEach((item) => {
        const private = (PROTECTED_BOX_ITEMS.indexOf(item.name) != -1);
        AddItem(item, i, private);
        i++;
    });

    $('#content_container').css('display', 'inherit');
    $('#mybox_nocontent').css('display', 'none');
    $('#loader').css('display', 'none');
}

let alternate = true;
function AddItem(item, id, private) {
    if (item.name.startsWith('LATEST.UPLOADING.')) return;
    let element;
        
    element = generateItem(id, item.name, parseStorageAmount(item.size), alternate, private);

    alternate = !alternate;

    if (EXPERIMENT_ITEMS_HOVER) {
        $('#content_container').append(element);
        $(`#item-${id}`).hover(() => {
            dropdown(id);
        }, () => {
            dropdown(id);
        });
    } else $('#content_container').append(element);
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dropdown(id) {
    const item = id.toString();

    if ($(`#showhide-id-${id}`).css('height') == '0px') {
        $(`#showhide-id-${item}`).css('height', '50px');
        $(`#showhide-id-${item}`).css('padding-top', '5px');
        $(`#showhide-button-${item}`).html('<div><i class="fa-solid fa-caret-up"></i></div>');
    } else {
        $(`#showhide-id-${item}`).css('height', '0px');
        $(`#showhide-id-${item}`).css('padding-top', '0');
        $(`#showhide-button-${item}`).html('<div><i class="fa-solid fa-caret-down"></i></div>');
    }
}

/**
 * A nice little function that turns bytes into readable storage amounts.
 * @param bytes the number to parse
 * @returns a formatted string
 */
function parseStorageAmount(bytes) {
    let formatted = '';

    if (bytes > 750 * 1024 * 1024)
        formatted = (((bytes / 1024) / 1024) / 1024).toFixed(2) + 'GB';
    else if (bytes > 750 * 1024)
        formatted = ((bytes / 1024) / 1024).toFixed(2) + 'MB';
    else if (bytes > 1024)
        formatted = (bytes / 1024).toFixed(2) + 'KB';
    else
        formatted = `${bytes}B`;

    return formatted;
}


/* Moved from old script */

function generateItem(id, item, fsize, alternate, private) {
    return `<div id="item-${id}" class="content_items ${alternate ? 'alternate' : ''}">
    <div class="top ${EXPERIMENT_ITEMS_HOVER?'mybox-experiment-hover':''}">
        <div class="left">
            <span class="size" id="size-${id}">${fsize}</span>
            <p class="name">${item}</p>
        </div>
        <div class="right">
            ${EXPERIMENT_ITEMS_HOVER?`${private ? '<i class="fa-solid fa-lock new-lock"></i>' : ''}`:`<button class="dropdown okayu-green" id="showhide-button-${id}" onclick="dropdown(${id})">
                <div><i class="fa-solid fa-caret-down"></i></div>
            </button>`}
        </div>
    </div>
    <div class="bottom" id="showhide-id-${id}">
        <button class="share desktop" id="share-content-${id}" onclick="share('${item}', ${id}, false)"><i class="fa-solid fa-arrow-up-right-from-square"></i> Share</button>
        <button class="view desktop" onclick="view('${item}')"><i class="fa-solid fa-eye"></i> View</button>
        <button class="dl desktop" onclick="download('${item}')"><i class="fa-solid fa-download"></i> Download</button>
        <button class="btn-orange visibility desktop" id="change-visibility-${id}" onclick="changeVisibility('${item}', ${id})">${private ? '<i class="fa-solid fa-lock"></i> Private' : '<i class="fa-solid fa-lock-open"></i> Public'}</button>
        <button class="btn-red delete desktop" id="delete-item-${id}" onclick="startDeleteSequence('${item}', ${id}, false)"><i class="fa-solid fa-trash-can"></i> Delete</button>

        <button class="share mobile" id="share-content-${id}" onclick="share('${item}', ${id}, true)"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
        <button class="view mobile" onclick="view('${item}')"><i class="fa-solid fa-eye"></i></button>
        <button class="dl mobile" onclick="download('${item}')"><i class="fa-solid fa-download"></i></button>
        <button class="btn-orange visibility mobile" id="m-change-visibility-${id}" onclick="changeVisibility('${item}', ${id})">${private ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>'}</button>
        <button class="btn-red delete mobile" id="m-delete-item-${id}" onclick="startDeleteSequence('${item}', ${id}, true)"><i class="fa-solid fa-trash-can"></i></button>
    </div>
</div>`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function view(item) {
    document.location = `${DOMAIN}/view/@${USERNAME}/${item}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function download(item) {
    document.location = `${DOMAIN}/@${USERNAME}/${item}?bypass=true&intent=download`; // must use bypass or else videos would render the watchpage
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function changeVisibility(item, id) {
    $.ajax({
        type: 'PATCH',
        url: '/api/changeVisibility',
        data: { id: item },
        statusCode: {
            400: () => {
                alert('Failed to update visibility.');
            },
            204: () => {
                const WAS_PUBLIC = PROTECTED_BOX_ITEMS.indexOf(BOX_ITEMS[id].name) == -1;
                
                if (WAS_PUBLIC) {
                    // change the button
                    if (!IS_MOBILE) $(`#change-visibility-${id}`).html('<i class="fa-solid fa-lock"></i> Private');
                    else $(`#m-change-visibility-${id}`).html('<i class="fa-solid fa-lock"></i>');

                    // add the lock icon to the size
                    $(`#size-${id}`).html(`${parseStorageAmount(BOX_ITEMS[id].size)}    <i class="fa-solid fa-lock" aria-hidden="true"></i>`);

                    // we must add the item to the protected box items
                    PROTECTED_BOX_ITEMS.push(BOX_ITEMS[id].name);
                } else {
                    // change the button
                    if (!IS_MOBILE) $(`#change-visibility-${id}`).html('<i class="fa-solid fa-lock-open"></i> Public');
                    else $(`#m-change-visibility-${id}`).html('<i class="fa-solid fa-lock-open"></i>');

                    // remove the lock icon from the size
                    $(`#size-${id}`).html(parseStorageAmount(BOX_ITEMS[id].size));

                    // remove the item from the protected box items
                    PROTECTED_BOX_ITEMS.splice(PROTECTED_BOX_ITEMS.indexOf(BOX_ITEMS[id].name), 1);
                }
            }
        }
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function share(item, id, mobile) {
    const tl_share = '<i class="fa-solid fa-arrow-up-right-from-square"></i> Share';
    const tl_share_mobile = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
    const tl_copied = `<i class="fa-solid fa-arrow-up-right-from-square"></i></i><strong>  ${(document.cookie.includes('language=ja-jp')) ? 'リンクがコピーしました' : 'Copied link!'}</strong>`;
    const tl_nvgt_text = document.cookie.includes('language=ja-jp') ? 'OkayuCDNで僕のファイルを見ます！' : 'View my file on OkayuCDN!';

    if (mobile) {
        $.getJSON(`/api/shorturl/${USERNAME}/${item}`, (data) => {
            try {
                navigator.share({
                    title: 'OkayuCDN',
                    text: tl_nvgt_text,
                    url: `${DOMAIN}/.${data.id}`
                });
            } catch (e) {
                navigator.clipboard.writeText(`${DOMAIN}/.${data.id}`);
                document.getElementById(`share-content-${id}`).innerHTML = tl_copied;
                setTimeout(() => {
                    document.getElementById(`share-content-${id}`).innerHTML = mobile ? tl_share_mobile : tl_share;
                }, 1500);
            }
        });
    } else {
        try {
            navigator.share({
                title: 'OkayuCDN',
                text: tl_nvgt_text,
                url: `${DOMAIN}/@${USERNAME}/${item}`
            });
        } catch (e) {
            navigator.clipboard.writeText(`${DOMAIN}/@${USERNAME}/${item}`);
            document.getElementById(`share-content-${id}`).innerHTML = tl_copied;
            setTimeout(() => {
                document.getElementById(`share-content-${id}`).innerHTML = mobile ? tl_share_mobile : tl_share;
            }, 1500);
        }
    }
}


// TODO: Rewrite these two functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function startDeleteSequence(item, id, mobile) {
    if (mobile) {
        if ($(`#m-delete-item-${id}`).html() == '<i class="fa-solid fa-trash-can" aria-hidden="true"></i>') {
            $(`#m-delete-item-${id}`).html('<i class="fa-solid fa-check"></i>  ?');
            setTimeout(() => {
                $(`#m-delete-item-${id}`).html('<i class="fa-solid fa-trash-can" aria-hidden="true"></i>');
            }, 3000);
        } else {
            deleteItemRequest(item, id);
        }

        return;
    }


    if ($(`#delete-item-${id}`).html() == '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Delete') {
        $(`#delete-item-${id}`).html('<i class="fa-solid fa-check"></i> Are you sure?');

        PreviewFreedStorage(id);

        setTimeout(() => {
            $(`#delete-item-${id}`).html('<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Delete');
            UnPreviewFreedStorage();
        }, 3000);
    } else {
        deleteItemRequest(item, id);
    }
}
function deleteItemRequest(item, id) {
    $.ajax({
        type: 'DELETE',
        url: '/api/deleteItem',
        data: { id: item },
        statusCode: {
            400: () => {
                alert('Failed to delete item');
            },
            204: () => {
                // remove it from the list, so if the user sorts, it doesn't show up
                BOX_ITEMS.splice(id, 1);
                // delete from visibility
                $(`#item-${id}`).remove();
            }
        }
    });
}

$('#body').scroll(() => {
    $('#overlay').css('top', $(this).scrollTop());
});

function PreviewFreedStorage(id) {
    let item_size = BOX_ITEMS[id].size;

    $('#mybox-fill-preview').css('width', `${((USED_STORAGE - item_size) / TOTAL_STORAGE)*20}em`);
}
function UnPreviewFreedStorage() {
    $('#mybox-fill-preview').css('width', `${(USED_STORAGE / TOTAL_STORAGE)*20}em`);
}