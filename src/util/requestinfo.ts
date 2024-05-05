import { Request, Response } from 'express';
import { Router } from '../main';
import { Logger } from 'okayulogger';
import { red, green, blue, bold } from 'chalk';
//import { readFileSync } from 'node:fs';
//import { DATABASE_PATH } from './paths';

const L: Logger = new Logger('RequestInfo');

//const BannedIPs: Array<string> = JSON.parse(readFileSync(DATABASE_PATH, ''));

export function RegisterRequestLogger(): void {
    Router.use('*', (req: Request, _res: Response, next: CallableFunction) => {
        let IPAddress: string = 'IP Unavailable';
        
        if (req.headers && req.headers['x-forwarded-for'])
            IPAddress = <string> req.headers['x-forwarded-for'];
        if (req.socket.remoteAddress)
            IPAddress = req.socket.remoteAddress;



        L.info(`${bold(red(IPAddress))} ${blue(req.method)} ${green(req.originalUrl)}`);

        next();
    });
}