import { debug, info } from 'okayulogger';
import { ENABLE_DEBUG_LOGGING } from '../main';
import { execSync } from 'child_process';


export function CheckForUpdates() {
    if (ENABLE_DEBUG_LOGGING) debug('updates', 'checking for updates...');
    fetch('https://api.github.com/repos/okawaffles/okayucdn/releases?per_page=1').then(async (data) => {
        const json = (await data.json())[0];

        const latest_tag = json.tag_name;
        let current_tag;
        try {
            current_tag = execSync('git describe --tags --abbrev=0').toString().trim();
        } catch (err) {
            debug('updates', `failed to check for updates (${err})`);
            return;
        }

        if (CompareVersion(current_tag, latest_tag, true)) {
            info('updates', `A new update for OkayuCDN is available: ${latest_tag}. You are currently running ${current_tag}.`);
            info('updates', `Download it here: ${json.html_url}`);
        } else if (ENABLE_DEBUG_LOGGING) debug('updates', 'no available update');
    });
}

function CompareVersion(current: string, latest: string, ignoreExtra: boolean): boolean {
    if (latest.includes('-') && ignoreExtra) {
        if (ENABLE_DEBUG_LOGGING) debug('updates', 'extra exists, ignoring update...');
        return false;
    }

    let CUR = current;
    let LAT = latest;

    if (LAT.includes('-')) {
        CUR = current.split('-')[0]; // strip off anything like -ALPHA or -BETA
        LAT = latest.split('-')[0]; // strip off anything like -ALPHA or -BETA
    }

    const CURRENT = CUR.split('v')[1].split('.');
    const LATEST = LAT.split('v')[1].split('.');
        
    // major
    if (LATEST[0] > CURRENT[0]) return true;
    // minor
    if (LATEST[1] > CURRENT[1] && LATEST[0] == CURRENT[0]) return true;
    // patch
    if (LATEST[2] > CURRENT[2] && LATEST[0] == CURRENT[0] && LATEST[1] == CURRENT[1]) return true;

    // they are equal:
    return false;
}