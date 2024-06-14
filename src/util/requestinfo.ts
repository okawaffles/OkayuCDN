import { Request, Response } from 'express';
import { Router } from '../main';
import { Logger } from 'okayulogger';
import { red, green, blue, bold } from 'chalk';
//import { readFileSync } from 'node:fs';
import { DATABASE_PATH } from './paths';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const L: Logger = new Logger('RequestInfo');

if (!existsSync(join(DATABASE_PATH, 'banned_ips.json'))) writeFileSync(join(DATABASE_PATH, 'banned_ips.json'), JSON.stringify({banned:[]}));
const BannedIPs: Array<string> = JSON.parse(readFileSync(join(DATABASE_PATH, 'banned_ips.json'), 'utf-8')).banned;

export function RegisterRequestLogger(): void {
    Router.use('*', (req: Request, res: Response, next: CallableFunction) => {
        let IPAddress: string | undefined = 'IP Unavailable';
        IPAddress = <string> req.ip;

        if (BannedIPs.indexOf('' + IPAddress) != -1) return res.status(403).render('err403');

        L.info(`${bold(red(IPAddress))} ${blue(req.method)} ${green(req.originalUrl)}`);

        next();
    });
}