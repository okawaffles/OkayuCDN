import { Request, Response } from 'express'; 
import { Router, announcement, version } from '../main';
import { HandleBadRequest, ValidateLoginPOST } from '../util/sanitize';
import { matchedData } from 'express-validator';
import { GetUserModel, RegisterNewToken, VerifyLoginCredentials } from '../util/secure';

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
}