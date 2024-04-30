import { Request, Response } from 'express'; 
import { Router, announcement, domain, version } from '../main';
import { HandleBadRequest, ValidateLoginPOST, ValidateToken, ValidateOTP, ValidateUploadPOST, ValidateDeletionRequest, ValidatePasswordRequest } from '../util/sanitize';
import { matchedData } from 'express-validator';
import { ChangeFileVisibility, GetUserFromToken, GetUserModel, PrefersLogin, RegisterNewToken, UpdateUserPassword, VerifyLoginCredentials, VerifyOTPCode, VerifyUserExists } from '../util/secure';
import { FinishUpload, MulterUploader } from '../api/upload';
import { StorageData, UserModel } from '../types';
import { GetStorageInfo } from '../api/content';
import { Logger } from 'okayulogger';
import { join } from 'path';
import { UPLOADS_PATH } from '../util/paths';
import { existsSync, renameSync, rmSync } from 'fs';

const L: Logger = new Logger('API');

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

        // oops we need to verify the user exists first!
        if (!VerifyUserExists(data.username)) return res.json({status:401,reason:'Invalid login credentials'});

        // validation of login credentials...
        if (!VerifyLoginCredentials(data.username, data.password)) 
            return res.status(401).json({status:401,reason:'Invalid login credentials'});
     
        const user: UserModel = GetUserModel(data.username, true);

        // don't register a token for 2fa users
        if (user.SecureData?.two_factor) return res.json({status:202,uses2FA:true});

        // if the user doesn't use 2fa
        const authToken: string = RegisterNewToken(user);
        res.json({status:200,uses2FA:false,token:authToken});
    });
    // OTP-based two-factor auth
    Router.post('/api/login/otp', ValidateOTP(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        if (!VerifyUserExists(data.username)) return res.status(400).end();
        
        const user = GetUserModel(data.username);

        if (!VerifyOTPCode(user.username, data.code))
            return res.status(401).json({status:401,reason:'Bad OTP code'});

        // register and send the user the token if correct
        const authToken: string = RegisterNewToken(user);
        res.json({result:200,uses2FA:false,token:authToken});
    });
    // pages use this to figure out who they are based on the login token
    Router.get('/api/whoami', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        const user: UserModel = GetUserFromToken(data.token);
        
        try {
            const username: string = user.username;
            res.json({
                result:200,
                username,
                domain,
                preferences: {
                    language: user.preferences.language,
                    two_factor: {
                        otp_enabled: user.SecureData?.twoFactorData?.usesOTP,
                        passkey_enabled: user.SecureData?.twoFactorData?.usesPasskey
                    }
                }
            });
        } catch (err) {
            res.json({result:400,reason:'Bad request.'});
        }
    });



    /* UPLOADING */
    Router.post('/api/upload', MulterUploader.single('file'), (req: Request, res: Response) => {
        const user = GetUserFromToken(req.cookies.token);
        const username = user.username;

        const uploadPath = join(UPLOADS_PATH, username);

        renameSync(join(uploadPath, 'LATEST.UPLOADING.ID'), join(uploadPath, `LATEST.UPLOADING.${req.query.current_chunk}`));
        
        res.status(200).end();
    });

    Router.post('/api/upload/finish', ValidateToken(), ValidateUploadPOST(), HandleBadRequest, (req: Request, res: Response) => { FinishUpload(req, res); });

    Router.get('/api/storage', ValidateToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        try {
            const user = GetUserFromToken(data.token);

            const storage: StorageData = GetStorageInfo(user);

            res.json(storage);
        } catch (err: unknown) {
            L.error(err + '');
            res.json({error:true,reason:'needs_login'});
        }
    });



    /* MY BOX */
    Router.delete('/api/deleteItem', 
        ValidateDeletionRequest(), 
        ValidateToken(), 
        PrefersLogin, 
        HandleBadRequest, 
        (req: Request, res: Response) => {
            const data = matchedData(req);

            const item = data.id;
            const user = GetUserFromToken(data.token);

            const pathOfContent = join(UPLOADS_PATH, user.username, item);

            if (!existsSync(pathOfContent)) {
                return res.status(404).send('Not found');
            }

            rmSync(pathOfContent);

            res.status(204).end();
        }
    );

    Router.patch('/api/changeVisibility', ValidateToken(), ValidateDeletionRequest(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        ChangeFileVisibility(data.token, data.id);

        res.status(204).end();
    });

    Router.patch('/api/password', ValidateToken(), PrefersLogin, ValidatePasswordRequest(), HandleBadRequest, async (req: Request, res: Response) => {
        const data = matchedData(req);
        const user = GetUserFromToken(data.token);

        console.log(user.username, data.current_password);
        if (!await VerifyLoginCredentials(user.username, data.current_password)) return res.status(401).json({success:false,reason:'bad login'});

        if (await UpdateUserPassword(GetUserFromToken(data.token), data.new_password)) 
            res.status(200).json({success:true});
        else
            res.status(500).json({success:false});
    });
}