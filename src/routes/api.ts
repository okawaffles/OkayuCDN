import { Request, Response } from 'express'; 
import { Router, announcement, version } from '../main';
import { HandleBadRequest, ValidateLoginPOST, ValidateToken, ValidateUploadPOST } from '../util/sanitize';
import { matchedData } from 'express-validator';
import { GetUserFromToken, GetUserModel, PrefersLogin, RegisterNewToken, VerifyLoginCredentials } from '../util/secure';
import { MulterUploader, UploadResults } from '../api/upload';
import { StorageData, UploadResult } from '../types';
import { GetStorageInfo } from '../api/content';

export function RegisterAPIRoutes() {
    /**
     * This route should be the first route registered.
     * It should be considered the "test route" as it should ALWAYS report if the server is running
     */
    Router.get('/api/health', (req: Request, res: Response) => {
        res.json({
            health: 'OK',
            version: version,
            config:{announcement},
            system:{
                platform: process.platform,
                mem: {
                    malloc: Math.ceil((process.memoryUsage().rss / 1000000)*100)/100+'MB',
                    used: Math.ceil((process.memoryUsage().heapUsed / 1000000)*100)/100+'MB'
                }
            }
        });
    });



    /* ACCOUNTING */
    // Login page handler for first step
    Router.post('/api/login', ValidateLoginPOST(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        if (!VerifyLoginCredentials(data.username, data.password)) {
            return res.status(401).json({status:401,reason:'Invalid login credentials'});
        }

        // TODO: Reimpliment 2FA checks

        const authToken: string = RegisterNewToken(GetUserModel(data.username));
        res.json({result:200,uses2FA:false,token:authToken});
    });

    // pages will now call this route to authenticate and get a username from simply a token
    Router.get('/api/whoami', ValidateToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        const user = GetUserFromToken(data.token);

        res.json({result: 200, username: user.username, extendedStorage: user.hasLargeStorage });
    });



    /* CONTENT */
    Router.post('/api/upload', ValidateUploadPOST(), PrefersLogin, HandleBadRequest, MulterUploader.single('file'), (req: Request, res: Response) => {
        const data = matchedData(req);
        UploadResults[GetUserFromToken(data.token).username] = UploadResult.UPLOAD_OK;
        res.send({status:200});
    });

    Router.get('/api/storage', ValidateToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        const user = GetUserFromToken(data.token);

        const storage: StorageData = GetStorageInfo(user);

        res.json(storage);
    });
}