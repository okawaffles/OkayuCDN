import { BASE_DIRNAME, domain, ENABLE_DEBUG_LOGGING, Router } from './main';
import { Request, Response } from 'express';
import { RegisterSimpleRoutes } from './routes/simple';
import { RegisterAPIRoutes } from './routes/api';
import { join } from 'node:path';
import { RegisterContentRoutes } from './routes/content';
import { RegisterAccountRoutes } from './routes/account';
import { RegisterDesktopRoutes } from './routes/desktop';
import { debug } from 'okayulogger';

export function RegisterRoutes() {
    if (ENABLE_DEBUG_LOGGING) debug('routes', 'registering routes...');

    // base routes don't need their own files
    Router.get('/', (req: Request, res: Response) => {
        res.render('landing/okayu.ejs'); // this may need to be changed later
    });
    Router.get('/wallpaper', (req: Request, res: Response) => {
        res.render('landing/okayu_wallpaper.ejs', {domain}); // this may need to be changed later
    });
    Router.get('/mira', (req: Request, res: Response) => {
        res.render('landing/mira.ejs'); // this may need to be changed later
    });
    Router.get('/korone', (req: Request, res: Response) => {
        res.render('landing/korone.ejs'); // this may need to be changed later
    });
    Router.get('/favicon.ico', (req: Request, res: Response) => {
        res.sendFile(join(BASE_DIRNAME, '..', 'views', 'assets', 'images', 'favicon.ico'));
    });
    if (ENABLE_DEBUG_LOGGING) debug('routes', 'initial routes done');

    // simple routes (content that doesn't update much)
    RegisterSimpleRoutes();

    // api routes (dynamic content for clients to request from)
    RegisterAPIRoutes();

    // content routes, handles standard content and videos
    RegisterContentRoutes();

    // account routes
    RegisterAccountRoutes();

    // routes for the desktop app (these use headers for the token rather than cookies)
    RegisterDesktopRoutes();
}