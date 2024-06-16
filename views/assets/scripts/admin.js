$(document).ready(() => {
    $.getJSON('/api/health', (data) => {
        $('#memory-usage').text('Used: ' + data.system.mem.used + ' / Malloc: ' + data.system.mem.malloc);
    });

    $.getJSON('/api/admin', (data) => {
        data.users.forEach(user => {
            ConstructUser(user);
        });
    });
});

function ConstructUser(username) {
    $('#userList').append(`
    <div class="admin_user">
        <p class="name">${username}</p>
        <button class="admin_user_option" onclick="ManageUser('${username}')">Manage</button>
    </div>
    `);
}

let MANAGING_USER = '';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ManageUser(username) {
    MANAGING_USER = username;
    console.log(MANAGING_USER);

    $('#username').text(`Managing ${username}`);
    $('#userOptions').css('display', 'flex');

    $('#userContent').empty();

    $.ajax({
        type: 'GET',
        url: '/api/adminStorage',
        data: {username},
        statusCode: {
            200: (data) => {
                data.content.forEach(item => {
                    ConstructItem(item.name);
                });
            },
            500: () => {
                alert('Error getting content for user.');
            },
            503: () => {
                alert('Error getting content for user.');
            }
        }
    });
}

$('#forgeToken').click(() => {
    $.ajax({
        type: 'PATCH',
        url: '/api/adminLoginAs',
        data: {username:MANAGING_USER},
        statusCode: {
            200: () => {
                // we don't need to worry about any data here,
                // as the active token of the user will simply be changed
                document.location = '/account';
            },
            500: () => {
                return alert('Could not create a valid token for this user');
            }
        }
    });
});

function ConstructItem(name) {
    $('#userContent').append(`
    <div class="admin_content">
        <p class="name">${name}</p>
        <div class="list_right">
            <button class="admin_content_option btn-orange" onclick='ViewItem("${name}")'>View</button>
            <button class="admin_content_option" onclick='DeleteItem("${name}")'>Delete</button>
        </div>
    </div>
    `);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DeleteItem(item) {
    $.ajax({
        type: 'DELETE',
        url: '/content',
        data: {
            username: MANAGING_USER,
            item
        },
        statusCode: {
            204: () => {
                ManageUser(MANAGING_USER); // reload the content
            },
            503: () => {
                alert('An error occurred.');
            }
        }
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ViewItem(item) {
    open(`/view/@${MANAGING_USER}/${item}`);
}


let bannedIPs = [];

$(document).ready(() => {
    $.ajax({
        type: 'GET',
        url: '/api/admin/getIPBans',
        statusCode: {
            204: () => {
                bannedIPs = [];
                console.log('no IP bans');
            },
            200: (data) => {
                bannedIPs = data.bans;
                console.log(bannedIPs);
            }
        }
    });

    $('#userManagement').click(() => {
        $('#ipManage').css('display', 'none');
        $('#userPage').css('display', 'flex');
    });
    
    $('#ipManagement').click(() => {
        $('#userPage').css('display', 'none');
        $('#ipManage').css('display', 'flex');
    });
});