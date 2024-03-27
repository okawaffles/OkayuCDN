import { Request, Response } from 'express';
import { Router, version } from '../main';
import { HandleBadRequest, ValidateLoginGET, ValidateToken } from '../util/sanitize';
import { PrefersLogin } from '../util/secure';

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

    Router.get('/test', (req: Request, res: Response) => {
        res.render('test.ejs');
    });

    Router.get('/login', ValidateLoginGET(), HandleBadRequest, (req: Request, res: Response) => {
        res.render('login.ejs');
    });

    Router.get('/manage/upload', (req: Request, res: Response) => res.redirect('/upload'));
    Router.get('/upload', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        res.render('upload.ejs', {USERNAME: 'FakeUser', isBT: 'true', premium: true, datecode: 'ts-0'}); // TODO: replace these options by using an API call
    });
}