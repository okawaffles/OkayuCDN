import { Request, Response } from 'express'; 
import { ENABLE_ACCOUNT_CREATION, ENABLE_UPLOADING, Router, admins, announcement, domain, version } from '../main';
import { HandleBadRequest, ValidateLoginPOST, ValidateToken, ValidateOTP, ValidateUploadPOST, ValidateDeletionRequest, ValidatePasswordRequest, ValidateSignupPOST, ValidateAdminDeletionRequest, ValidateAdminStorageRequest, ValidateUploadChunk, ValidateContentRequest, ValidateTokenBothModes, ValidateAdminBanIP } from '../util/sanitize';
import { matchedData } from 'express-validator';
import { BeginTOTPSetup, ChangeFileVisibility, CheckTOTPCode, GetUserFromToken, GetUserModel, PrefersLogin, RegisterNewAccount, RegisterNewToken, UpdateUserPassword, VerifyLoginCredentials, VerifyUserExists } from '../util/secure';
import { FinishUpload, MulterUploader } from '../api/upload';
import { AuthorizationIntents, ContentItem, IPBanList, StorageData, UserModel } from '../types';
import { GetStorageInfo } from '../api/content';
import { Logger } from 'okayulogger';
import { join } from 'path';
import { UPLOADS_PATH, USER_DATABASE_PATH } from '../util/paths';
import { existsSync, readdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import { CreateLink } from '../api/shortener';
import { ChangeTokenUsername, ReadIntents } from '../api/newtoken';
import { AddIPBan, GetIPBans, RemoveIPBan } from '../util/ipManage';

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
            },
            desktop: {
                min_version: 2,
                to: '/api/upload'
            }
        });
    });



    /* ACCOUNTING */
    // Login page handler for first step
    Router.post('/api/login', ValidateLoginPOST(), HandleBadRequest, async (req: Request, res: Response) => {
        const data = matchedData(req);

        // oops we need to verify the user exists first!
        if (!VerifyUserExists(data.username)) return res.json({status:401,reason:'User not found'});

        // validation of login credentials...
        VerifyLoginCredentials(data.username, data.password).then(isValid => {
            if (!isValid) return res.status(401).json({status:401,reason:'Invalid login credentials'});
            
            const user: UserModel = GetUserModel(data.username, true);
            
            // don't register a token for 2fa users
            if (user.SecureData?.two_factor) return res.json({status:202,uses2FA:true});

            // if login is successful we will record the user's IP address to their securedata
            let IPAddress = <string> req.ip;
            if (IPAddress.startsWith('::ffff:')) IPAddress = IPAddress.split('::ffff:')[1];
            
            if (!user.SecureData?.IPHistory && user.SecureData) user.SecureData.IPHistory = [];

            // we only need to write it once
            if (user.SecureData?.IPHistory && user.SecureData.IPHistory.indexOf(IPAddress) == -1) {
                user.SecureData?.IPHistory?.push(IPAddress);
                writeFileSync(join(USER_DATABASE_PATH, `${user.username}.json`), JSON.stringify(user));
            }

            // if the user doesn't use 2fa
            const authToken: string = RegisterNewToken(user);
            res.json({status:200,uses2FA:false,token:authToken});
        });
    });
    // pages use this to figure out who they are based on the login token
    Router.get('/api/whoami', ValidateTokenBothModes(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        if (!data.token && !data.authorization) return res.status(400).end();

        let token: string = 'invalid';
        if (data.authorization) token = data.authorization;
        else token = data.token;

        const user: UserModel = GetUserFromToken(token);
        
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
            L.error('whoami: Bad request');
            res.status(400).json({result:400,reason:'Bad request.'});
        }
    });


    Router.post('/api/signup', ValidateSignupPOST(), HandleBadRequest, async (req: Request, res: Response) => {
        const data = matchedData(req);

        if (!ENABLE_ACCOUNT_CREATION) return res.status(423).json({error:'account creation is disabled'});
        
        if (!await RegisterNewAccount(data.username, data.password, data.email, data.realname)) return res.status(409).json({error:'account already exists'});
        else res.status(200).end();
    });


    /* UPLOADING */
    Router.post('/api/upload', ValidateToken(), PrefersLogin, ValidateUploadChunk(), HandleBadRequest, MulterUploader.single('file'), (req: Request, res: Response) => {
        if (!ENABLE_UPLOADING) return res.status(423).end();

        const data = matchedData(req);
        const intents: AuthorizationIntents = ReadIntents(data.token);
        if (!intents.canUpload) return res.status(403).json({success:false,reason:'No permission'});

        const user = GetUserFromToken(data.token);
        const username = user.username;

        const uploadPath = join(UPLOADS_PATH, username);

        renameSync(join(uploadPath, 'LATEST.UPLOADING.ID'), join(uploadPath, `LATEST.UPLOADING.${data.current_chunk}`));
        
        res.status(200).end();
    });

    Router.post('/api/upload/finish', ValidateToken(), ValidateUploadPOST(), HandleBadRequest, (req: Request, res: Response) => { 
        if (!ENABLE_UPLOADING) return res.status(423).end();

        const data = matchedData(req);

        const intents: AuthorizationIntents = ReadIntents(data.token);
        if (!intents.canUpload) return res.status(403).json({success:false,reason:'No permission'});

        FinishUpload(req, res);
    });

    Router.get('/api/storage', ValidateTokenBothModes(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        const intents: AuthorizationIntents = ReadIntents(data.token);
        if (!intents.canGetStorage) {
            return res.status(403).send({success:false,reason:'No permission'});
        }

        try {
            const user = GetUserFromToken(data.token);

            const storage: StorageData = GetStorageInfo(user);

            if (!intents.canViewPublicItems) { storage.content = []; storage.protected_files = []; }
            if (!intents.canViewPrivateItems) {
                storage.content.forEach((item: ContentItem) => {
                    if (storage.protected_files.indexOf(item.name) != -1) {
                        storage.content[storage.content.indexOf(item)] = {
                            name: 'Protected Item',
                            size: 0,
                            date: -1
                        };
                    }
                });
                storage.protected_files = [];
            }

            res.json(storage);
        } catch (err: unknown) {
            L.error('api/storage: ' + err + '');
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
            const intents: AuthorizationIntents = ReadIntents(data.token);

            if (!intents.canDeleteItem) return res.status(403).json({success:false,reason:'No permission'});

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

        const intents: AuthorizationIntents = ReadIntents(data.token);
        if (!intents.canChangeItemPrivacy) return res.status(403).json({success:false,reason:'No permission'});

        ChangeFileVisibility(data.token, data.id);

        res.status(204).end();
    });


    /* ACCOUNT PAGE */
    Router.patch('/api/password', ValidateToken(), PrefersLogin, ValidatePasswordRequest(), HandleBadRequest, async (req: Request, res: Response) => {
        const data = matchedData(req);
        const user = GetUserFromToken(data.token);

        const intents: AuthorizationIntents = ReadIntents(data.token);
        if (!intents.canChangeAccountOptions) return res.status(403).json({success:false,reason:'No permission'});

        if (!await VerifyLoginCredentials(user.username, data.current_password)) return res.status(401).json({success:false,reason:'bad login'});

        // TODO: Simplify this down
        const fullUserModel: UserModel = GetUserModel(GetUserFromToken(data.token).username, true);
        if (await UpdateUserPassword(fullUserModel, data.new_password)) 
            res.status(200).json({success:true});
        else
            res.status(500).json({success:false});
    });

    // GET route = begin TOTP setup
    Router.get('/api/otp', ValidateToken(), PrefersLogin, HandleBadRequest, async (req: Request, res: Response) => {
        const data = matchedData(req);

        const intents: AuthorizationIntents = ReadIntents(data.token);
        if (!intents.canChangeAccountOptions) return res.status(403).json({success:false,reason:'No permission'});

        const url = await BeginTOTPSetup(GetUserFromToken(data.token));
        res.json({url});
    });

    // POST route = verify TOTP
    Router.post('/api/otp', ValidateOTP(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        const intents: AuthorizationIntents = ReadIntents(data.token);
        if (!intents.canChangeAccountOptions) return res.status(403).json({success:false,reason:'No permission'});

        if (CheckTOTPCode(data.username, data.code))
            res.status(200).end();
        else
            res.status(401).end();
    });

    /* Admin Page */
    Router.get('/api/admin', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        if (admins.indexOf(GetUserFromToken(data.token).username) == -1) return res.status(403).end();
        // we want all users so far
        const entries = readdirSync(join(USER_DATABASE_PATH), {withFileTypes: true});
        
        // remove any files that aren't .json as they're not user data
        const users = entries.filter(entry => entry.isFile()).map(entry => entry.name);

        // remove the .json from the end
        let i = 0;
        users.forEach(user => {
            users[i] = user.split('.json')[0];
            i++;
        });

        res.json({users});
    });

    Router.get('/api/adminStorage', ValidateToken(), PrefersLogin, ValidateAdminStorageRequest(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        if (admins.indexOf(GetUserFromToken(data.token).username) == -1) return res.status(403).end();

        const info: StorageData = GetStorageInfo(GetUserModel(data.username));
        res.json(info);
    });
    Router.patch('/api/adminLoginAs', ValidateToken(), ValidateAdminStorageRequest(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        
        if (admins.indexOf(GetUserFromToken(data.token).username) == -1) return res.status(403).end();

        ChangeTokenUsername(data.token, data.username);
        res.json({success:true});
    });
    Router.delete('/content', ValidateToken(), ValidateAdminDeletionRequest(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        if (admins.indexOf(GetUserFromToken(data.token).username) == -1) return res.status(403).end();

        const username = data.username;
        const item = data.item;
        rmSync(join(UPLOADS_PATH, username, item), {recursive: false});
        res.status(204).end();
    });
    Router.post('/api/admin/banIP', ValidateToken(), ValidateAdminBanIP(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        AddIPBan(data.ip, data.reason || 'Reason not given');

        res.status(204).end();
    });
    Router.post('/api/admin/unbanIP', ValidateToken(), ValidateAdminBanIP(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        RemoveIPBan(data.ip);

        res.status(204).end();
    });
    Router.get('/api/admin/getIPBans', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const bans: IPBanList = GetIPBans();
        if (Object.keys(bans).length == 0) res.status(204).end(); else res.json(bans);
    });


    /* Token V2 */
    // lol i didnt put anything here
    

    /* Link Shortening */

    // Creation of short URL
    Router.get('/api/shorturl/:username/:item', ValidateContentRequest(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        const id: string = CreateLink(data.username, data.item, true);
        res.json({id});
    });
}

export function RateLimitHandler(req: Request, res: Response) {
    res.status(429).render('err429');
}
export function IsUpload(req: Request): boolean {
    return (req.originalUrl.startsWith('/api/upload') || req.originalUrl.startsWith('/api/upload/finish'));
}