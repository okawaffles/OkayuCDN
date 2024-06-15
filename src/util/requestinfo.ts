import { Request, Response } from 'express';
import { Router } from '../main';
import { Logger } from 'okayulogger';
import { red, green, blue, bold } from 'chalk';

const L: Logger = new Logger('RequestInfo');

export function RegisterRequestLogger(): void {
    Router.use('*', (req: Request, _res: Response, next: CallableFunction) => {
        let IPAddress: string | undefined = 'IP Unavailable';
        IPAddress = <string> req.ip;

        if (IPAddress.startsWith('::ffff:')) IPAddress = IPAddress.split('::ffff:')[1];
        
        L.info(`${bold(red(IPAddress))} ${blue(req.method)} ${green(req.originalUrl)}`);

        next();
    });
}