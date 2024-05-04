import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { DATABASE_PATH } from '../util/paths';
import { join } from 'node:path';

/**
 * Ensure the banned users/IPs database exists.
 */
function CheckBanDB() {
    if (!existsSync(join(DATABASE_PATH, 'banned.json'))) {
        const banned = {
            ip: [],     // IPs don't need reason
            users: {}   // Users can have a reason
        };
        writeFileSync(join(DATABASE_PATH, 'banned.json'), JSON.stringify(banned), 'utf-8');
    }
}

export function IsUserRestricted(username: string): string | undefined {
    CheckBanDB();
    const banned = JSON.parse(readFileSync(join(DATABASE_PATH, 'banned.json'), 'utf-8'));

    if (banned.users[username]) {
        return banned.users[username];
    } else return undefined;
}