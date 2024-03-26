import { Request, Response } from 'express'; 
import { Router, announcement, version } from '../main';

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
    /**
     * Placeholder that makes the server send a valid response to login POSTS
     */
    Router.post('/api/login', (req: Request, res: Response) => {
        res.status(501).json({status:501, reason:'Not implemented.'});
    });
}