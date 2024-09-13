import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DATABASE_PATH } from './paths';
import { IPBan, IPBanList } from '../types';
import { Request, Response } from 'express';
import { Logger } from 'okayulogger';
import { red, yellowBright, bold } from 'chalk';
// import { ENABLE_DEBUG_LOGGING } from '../main';

const L: Logger = new Logger('IP Management');

let bannedIPs: IPBanList;
let loadOK = true;
let BANNED_IP_DB_PATH: string;

// console.log(BANNED_IP_DB_PATH, JSON.parse(readFileSync(BANNED_IP_DB_PATH, 'utf-8')));

export function LoadIPs() {
    BANNED_IP_DB_PATH = join(DATABASE_PATH, 'banned_ips.json');
    if (!existsSync(BANNED_IP_DB_PATH)) writeFileSync(BANNED_IP_DB_PATH, JSON.stringify({banned:{}}));

    try {
        bannedIPs = JSON.parse(readFileSync(BANNED_IP_DB_PATH, 'utf-8')).banned;
    } catch {
        L.error(`Unable to load IP bans! Please check your ${BANNED_IP_DB_PATH} file for errors!`);
        L.error('Alternatively, you can delete the file to make the server automatically recreate the file.');
        L.warn('An empty IP ban list will be loaded until the next restart.');
    
        loadOK = false;
        bannedIPs = {};
    }
}

/**
 * Middleware to check whether an IP is banned. This should be called before a request is handled.
 * @param req Express Request object
 * @param res Express Response object
 * @param next Express next CallableFunction
 * @returns Either continues if IP is not banned; or ends the request if the IP is banned
 */
export function CheckIP(req: Request, res: Response, next: CallableFunction) {
    let IPAddress: string = 'IP Unavailable';
    IPAddress = <string> req.ip;
    if (IPAddress.startsWith('::ffff:')) IPAddress = IPAddress.split('::ffff:')[1];

    // if (ENABLE_DEBUG_LOGGING) L.debug(`checking if IP ${IPAddress} is banned...`); <-- annoying ass

    const ip_ban: IPBan | undefined = bannedIPs[<string> IPAddress];

    if (ip_ban) {
        L.warn(red(`IP ${yellowBright(bold(IPAddress))} is IP banned and the request has been rejected.`));
        return res.status(403).render('err403', {reason: ip_ban.reason});
    }

    next();
}

/**
 * Add an IP ban to the database of IP bans. 
 * The database will not be updated if it failed to load on boot.
 * @param IP The IP to ban
 * @param reason The reason for the ban
 * @param user The user which caused the IP to be banned - Not currently referenced anywhere, but may be in the future.
 */
export function AddIPBan(IP: string, reason: string, user?: string) {
    bannedIPs[IP] = {reason, user};

    if (!loadOK) return L.warn('IP bans failed to load on boot. This IP ban will not save to the database of IP bans!');

    writeFileSync(BANNED_IP_DB_PATH, JSON.stringify({banned:bannedIPs}));
}

/**
 * Remove an IP ban from the database of IP bans. 
 * The database will not be updated if it failed to load on boot.
 * @param IP The IP to unban
 */
export function RemoveIPBan(IP: string) {
    if (Object.prototype.hasOwnProperty.call(bannedIPs, IP)) {
        delete bannedIPs[IP];
    }

    if (!loadOK) return L.warn('IP bans failed to load on boot. This change will not save to the database of IP bans!');

    writeFileSync(BANNED_IP_DB_PATH, JSON.stringify({banned:bannedIPs}));
}

export function GetIPBans(): IPBanList { return bannedIPs; }