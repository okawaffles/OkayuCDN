import { Request, Response } from 'express'; 
import { Router, announcement, version } from '../main';
import { HandleBadRequest, ValidateLoginPOST, ValidateToken, ValidateUploadPOST } from '../util/sanitize';
import { matchedData } from 'express-validator';
import { GetUserFromToken, GetUserModel, PrefersLogin, RegisterNewToken, VerifyLoginCredentials } from '../util/secure';
import { MulterUploader, UploadResults } from '../api/upload';
import { StorageData, UploadResult } from '../types';
import { GetStorageInfo } from '../api/content';
import { UserModel } from '../types';

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

        // validation of login credentials...
        if (!VerifyLoginCredentials(data.username, data.password)) 
            return res.status(401).json({status:401,reason:'Invalid login credentials'});
     
        const user: UserModel = GetUserModel(data.username, true);

        // don't register a token for 2fa users
        if (user.SecureData.two_factor) return res.json({status:202,uses2FA:true});

        // if the user doesn't use 2fa
        const authToken: string = RegisterNewToken(user);
        res.json({status:200,uses2FA:false,token:authToken});
    });
    // OTP-based two-factor auth
    Router.post('/api/login/otp', ValidateOTP(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        if (!VerifyOTPCode(data.code))
            return res.status(401).json({status:401,reason:'Bad OTP code'});

        // register and send the user the token if correct
        const authToken: string = RegisterNewToken(GetUserModel(data.username));
        res.json({result:200,uses2FA:false,token:authToken});
    });



    /* UPLOADING */
    Router.post('/api/upload', ValidateUploadPOST(), HandleBadRequest, MulterUploader.single('file'), (req: Request, res: Response) => {
        res.send({status:200});
    });

    Router.get('/api/storage', ValidateToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        const user = GetUserFromToken(data.token);

        const storage: StorageData = GetStorageInfo(user);

        res.json(storage);
    });
}