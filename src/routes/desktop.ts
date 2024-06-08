import { Request, Response } from 'express';
import { Router } from '../main';
import { HandleBadRequest, ValidateHeaderToken, ValidateToken } from '../util/sanitize';
import { CheckToken, GetUserFromToken, PrefersLogin } from '../util/secure';
import { matchedData } from 'express-validator';
import { Logger } from 'okayulogger';
import { StorageData, UserModel } from '../types';
import { GetStorageInfo } from '../api/content';
import { ReadIntents } from '../api/newtoken';

const L = new Logger('desktop API');

export function RegisterDesktopRoutes() {
    Router.get('/beam', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const token = matchedData(req).token;
        const intents = ReadIntents(token);
        
        if (!intents.canUseDesktop) return res.status(403).json({success:false,reason:'No permission'});

        res.send('<html><head><script src="/assets/scripts/beam.js"></script></head><body><h1 id="text"></h1></body></html>');
    });

    // essentially a route to just tell if your token is correct...
    Router.get('/api/desktop/whoami', ValidateHeaderToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        
        if (CheckToken(data.authorization)) {
            const user: UserModel = GetUserFromToken(data.authorization);
            return res.json({valid:true,username:user.username});
        } else {
            return res.status(401).json({valid:false,reason:'Invalid token'});
        }
    });

    Router.get('/api/desktop/storage', ValidateHeaderToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        if (!CheckToken(data.authorization)) {
            L.error('Header token is invalid');
            return res.status(401).json({success:false,code:401,reason:'Invalid token'});
        }

        const intents = ReadIntents(data.authorization);
        if (!intents.canUseDesktop) return res.status(403).json({success:false,reason:'No permission'});

        const user: UserModel = GetUserFromToken(data.authorization);
        const storage: StorageData = GetStorageInfo(user);

        res.json(storage);
    });
}