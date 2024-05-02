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
            503: () => {
                alert('Error getting content for user.');
            }
        }
    });
}

function ConstructItem(name) {
    $('#userContent').append(`
    <div class="admin_content">
        <p class="name">${name}</p>
        <button class="admin_content_option" onclick='DeleteItem("${name}")'>Delete</button>
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