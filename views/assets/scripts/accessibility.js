$(document).ready(() => {
    console.log('accessibility script loaded.');
    if (document.cookie.includes('okayu-experiment=use-opendyslexic')) {
        console.log('use opendyslexic');
        // document.getElementsByTagName('body')[0].style.fontFamily = 'OpenDyslexic !important';

        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText === '*') {
                        rule.style.fontFamily = 'OpenDyslexic';
                    }
                }
            } catch (e) {
                console.warn('could not access stylesheet!!!', e);
            }
        }
    }

    if (document.cookie.includes('okayu-experiment=use-alternate')) {
        console.log('use RoundedMplusMedium');

        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText === '*') {
                        rule.style.fontFamily = 'RoundedMplusMedium';
                    }
                }
            } catch (e) {
                console.warn('could not access stylesheet!!!', e);
            }
        }
    }
});