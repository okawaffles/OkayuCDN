$(document).ready(() => {
    $.getJSON('/api/whoami', (data) => {
        if (data.result != 200) {
            return document.location = '/login?redir=/mybox';
        }

        LoadBox(data.username);
    });
});


function LoadBox(username) {
    $.getJSON('/api/storage', (data) => {
        const items = data.content;

        let i = 0;
        items.forEach((item) => {
            AddItem(item, i);
            i++;
        });

        $('#content_container').css('')
    });
}

alternate = false;
function AddItem(item, id) {
    const element = generateItem(id, item.name, item.size, alternate);
    alternate = !alternate;

    $('#content_container').add(element)
}



/* Moved from old script */

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
        <button class="view desktop" onclick="view('${item}')"><i class="fa-solid fa-eye"></i> View</button>
        <button class="dl desktop" onclick="download('${item}')"><i class="fa-solid fa-download"></i> Download</button>
        <button class="btn-red delete desktop" id="delete-item-${id}" onclick="startDeleteSequence('${item}', ${id}, false)"><i class="fa-solid fa-trash-can"></i> Delete</button>

        <button class="share mobile" id="share-content-${id}" onclick="share('${item}', ${id}, true)"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
        <button class="view mobile" onclick="view('${item}')"><i class="fa-solid fa-eye"></i></button>
        <button class="dl mobile" onclick="download('${item}')"><i class="fa-solid fa-download"></i></button>
        <button class="btn-red delete mobile" id="m-delete-item-${id}" onclick="startDeleteSequence('${item}', ${id}, false)"><i class="fa-solid fa-trash-can"></i></button>
    </div>
</div>`;
}