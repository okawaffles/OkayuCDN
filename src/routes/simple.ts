import { Request, Response } from 'express';
import { Router, version } from '../main';
import { HandleBadRequest, ValidateLoginGET } from '../util/sanitize';

/**
 * These are routes that don't change much, such as /home and /info.
 */
export function RegisterSimpleRoutes() {
    Router.get('/home', (req: Request, res: Response) => {
        res.render('home.ejs', {version});
    });

    Router.get('/info', (req: Request, res: Response) => {
        res.render('info.ejs');
    });

    Router.get('/login', ValidateLoginGET(), HandleBadRequest, (req: Request, res: Response) => {
        res.render('login.ejs');
    });
}