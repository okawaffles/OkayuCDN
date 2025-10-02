const authorizedIntentsBits = {
    canUseWebsite: 0,
    canUseDesktop: 1,
    canGetStorage: 2,
    canViewPublicItems: 3,
    canViewPrivateItems: 4,
    canChangeItemPrivacy: 5,
    canDeleteItem: 6,
    canUpload: 7,
    canChangeAccountOptions: 8,
};

// function EncodeIntents(intents) {
//     let encoded = 0;

//     for (const [key, bit] of Object.entries(authorizedIntentsBits)) {
//         if (intents[key]) {
//             encoded |= (1 << bit);
//         }
//     }

//     return encoded;
// }

function DecodeIntents(encoded) {
    const intents = {};

    for (const [key, bit] of Object.entries(authorizedIntentsBits)) {
        intents[key] = (encoded & (1 << bit)) !== 0;
    }

    return intents;
}

$(document).ready(() => {
    $('#loading').css('display', 'none');

    const query = window.location.search.split('?')[1].split('&');
    let intent_value = 0;
    let appId = -1;
    query.forEach(element => {
        if (element.startsWith('intents=')) {
            intent_value = element.split('=')[1];
        }
        if (element.startsWith('appId=')) {
            appId = element.split('=')[1];
        }
    });
    const wanted_intents = DecodeIntents(intent_value);

    // errr, no comment on the code quality here
    if (wanted_intents.canUseWebsite) $('#auth_web_yes').css('display', 'inline'); else $('#auth_web_no').css('display', 'inline');
    if (wanted_intents.canUseDesktop) $('#auth_desktop_yes').css('display', 'inline'); else $('#auth_desktop_no').css('display', 'inline');
    if (wanted_intents.canGetStorage) $('#read_storage_yes').css('display', 'inline'); else $('#read_storage_no').css('display', 'inline');
    if (wanted_intents.canViewPublicItems) $('#read_public_yes').css('display', 'inline'); else $('#read_public_no').css('display', 'inline');
    if (wanted_intents.canViewPrivateItems) $('#read_private_yes').css('display', 'inline'); else $('#read_private_no').css('display', 'inline');
    if (wanted_intents.canChangeItemPrivacy) $('#change_privacy_yes').css('display', 'inline'); else $('#change_privacy_no').css('display', 'inline');
    if (wanted_intents.canDeleteItem) $('#delete_items_yes').css('display', 'inline'); else $('#delete_items_no').css('display', 'inline');
    if (wanted_intents.canUpload) $('#upload_yes').css('display', 'inline'); else $('#upload_no').css('display', 'inline');
    if (wanted_intents.canChangeAccountOptions) $('#change_secure_yes').css('display', 'inline'); else $('#change_secure_no').css('display', 'inline');

    $('#displayed').css('display', 'inline');


    $('#authorize').on('click', () => {
        console.log('click!');
        $.get(`/api/apptoken?intents=${intent_value}&appId=${appId}`, (data) => {
            if (!data.success) return alert('Failed to authorize application.');

            if (data.appId == 1) {
                document.location = `okayucdn://token/${data.token}`;
            } 
        });
    });
});