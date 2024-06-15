import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DATABASE_PATH } from './paths';
import { IPBan, IPBanList } from '../types';
import { Request, Response } from 'express';
import { Logger } from 'okayulogger';
import { red, yellowBright, bold } from 'chalk';

const L: Logger = new Logger('IP Management');

// check for db and load banned IPs on boot
const BANNED_IP_DB_PATH = join(DATABASE_PATH, 'banned_ips.json');
if (!existsSync(BANNED_IP_DB_PATH)) writeFileSync(DATABASE_PATH, JSON.stringify({banned:[]}));

let bannedIPs: IPBanList;
let loadOK = true;

try {
    bannedIPs = JSON.parse(readFileSync(BANNED_IP_DB_PATH, 'utf-8')).banned;
} catch {
    L.error('Unable to load IP bans! Please check your db/banned_ips.json file for errors!');
    L.error('Alternatively, you can delete the file to make the server automatically recreate the file.');
    L.warn('An empty IP ban list will be loaded until the next restart.');

    loadOK = false;
    bannedIPs = {};
}

export function CheckIP(req: Request, res: Response, next: CallableFunction) {
    let IPAddress: string = 'IP Unavailable';
    IPAddress = <string> req.ip;
    if (IPAddress.startsWith('::ffff:')) IPAddress = IPAddress.split('::ffff:')[1];

    const ip_ban: IPBan | undefined = bannedIPs[<string> IPAddress];

    if (ip_ban) {
        L.warn(red(`IP ${yellowBright(bold(IPAddress))} is IP banned and the request has been rejected.`));
        return res.status(403).render('err403', {reason: ip_ban.reason});
    }

    next();
}

export function AddIPBan(IP: string, reason: string, user?: string) {
    bannedIPs[IP] = {reason, user};

    if (!loadOK) return L.warn('IP bans failed to load on boot. This IP ban will not save to the database of IP bans!');

    writeFileSync(BANNED_IP_DB_PATH, JSON.stringify({banned:bannedIPs}));
}