import { Request, Response } from 'express';
import { admins, BASE_DIRNAME, Router, version, ENABLE_DEBUG_LOGGING } from '../main';
import { HandleBadRequest, TestMenuValidation, ValidateAuthorizationRequest, ValidateLoginGET, ValidateToken } from '../util/sanitize';
import { GetUserFromToken, PrefersLogin } from '../util/secure';
import { matchedData } from 'express-validator';
import { join } from 'node:path';
import {  debug } from 'okayulogger';
import { IsAprilFools } from '../util/aprilfools';
import { DeleteSession } from '../api/newtoken';

/**
 * These are routes that don't change much, such as /home and /info.
 */
export function RegisterSimpleRoutes() {
    if (ENABLE_DEBUG_LOGGING) debug('routes', 'registering simple routes...');

    Router.get('/home', (req: Request, res: Response) => {
        if (IsAprilFools()) return res.render('assets/aprilfools/home', {version});
        res.render('home', {version});
    });

    Router.get('/info', (req: Request, res: Response) => res.render('info.ejs'));

    // used for testing features not ready for release, or just very specific issues
    Router.get('/test', TestMenuValidation(), HandleBadRequest, (req: Request, res: Response) => {
        if (req.query.invokeError == '500') return res.status(500).render('err500.ejs');
        if (req.query.aprilfools == 'true') return res.render('assets/aprilfools/home', {version:'TEST PAGE'});

        res.render('test.ejs');
    });

    Router.get('/login', ValidateLoginGET(), HandleBadRequest, (req: Request, res: Response) => res.render('login.ejs'));
    Router.get('/logout', ValidateToken(), PrefersLogin, (req: Request, res: Response) => {
        const data = matchedData(req);
        res.cookie('token', 'logout').redirect('/login');
        DeleteSession(data.token);
    });

    Router.get('/signup', (req: Request, res: Response) => res.render('signup'));

    Router.get('/terms', (req: Request, res: Response) => res.render('terms'));

    Router.get('/upload', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => res.render('upload.ejs'));

    Router.get('/qt/send', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => res.render('quicktransfer_send.ejs'));
    Router.get('/qt/receive', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => res.render('quicktransfer_receive.ejs'));

    Router.get('/mybox', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => res.render('mybox.ejs'));

    Router.get('/authorize', ValidateToken(), ValidateAuthorizationRequest(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        res.render('authorize');
    });

    Router.get('/admin', ValidateToken(), PrefersLogin, HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        if (admins.indexOf(GetUserFromToken(data.token).username) == -1) res.status(403).render('err403');
        res.render('admin/admin');
    });

    Router.get('/robots.txt', (req: Request, res: Response) => res.sendFile(join(BASE_DIRNAME, '..', 'views', 'assets', 'robots.txt')));

    /**
     * This route is for the April Fools homepage
     * It's to hide the YouTube link so you can't see that it leads to... yk 
     */
    Router.get('/info/newDirection', (req: Request, res: Response) => {
        // stop foiling my plans!!!
        if (!req.headers['accept-language']) return res.status(403).end();
        else res.redirect('https://youtu.be/dQw4w9WgXcQ'); 
    });
    if (ENABLE_DEBUG_LOGGING) debug('routes', 'done registering simple routes');
}