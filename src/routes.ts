import { Router } from './main';
import { Request, Response } from 'express';
import { RegisterSimpleRoutes } from './routes/simple';

export function RegisterRoutes() {
    // base routes don't need their own files
    Router.get('/', (req: Request, res: Response) => {
        res.render('landing/okayu.ejs'); // this may need to be changed later
    });
    Router.get('/wallpaper', (req: Request, res: Response) => {
        res.render('landing/okayu_wallpaper.ejs'); // this may need to be changed later
    });
    Router.get('/mira', (req: Request, res: Response) => {
        res.render('landing/mira.ejs'); // this may need to be changed later
    });
    Router.get('/korone', (req: Request, res: Response) => {
        res.render('landing/korone.ejs'); // this may need to be changed later
    });

    // simple routes (content that doesn't update much)
    RegisterSimpleRoutes();
}