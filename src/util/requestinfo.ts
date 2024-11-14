import { Request, Response } from 'express';
import { ENABLE_DEBUG_LOGGING, Router } from '../main';
import { Logger } from 'okayulogger';
import { red, green, blue, bold } from 'chalk';

const L: Logger = new Logger('RequestInfo');

export function RegisterRequestLogger(): void {
    if (ENABLE_DEBUG_LOGGING) L.debug('hooking into express...');
    
    Router.use('*', (req: Request, _res: Response, next: CallableFunction) => {
        let IPAddress: string | undefined = 'IP Unavailable';
        
        // cloudflare proxies include this header, must use or else get a cloudflare IP 
        if (req.headers['x-forwarded-for'])
            IPAddress = (req.headers['x-forwarded-for'] as string).split(',')[0];
        else
            IPAddress = req.ip as string;

        if (IPAddress.startsWith('::ffff:')) IPAddress = IPAddress.split('::ffff:')[1];
        
        L.info(`${bold(red(IPAddress))} ${blue(req.method)} ${green(req.originalUrl)}`);

        next();
    });
}