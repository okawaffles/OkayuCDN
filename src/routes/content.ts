import { Request, Response } from 'express';
import { Router, domain } from '../main';
import { join } from 'path';
import { UPLOADS_PATH } from '../util/paths';
import { HandleBadRequest, ValidateContentRequest } from '../util/sanitize';
import { existsSync, statSync } from 'fs';


export function RegisterContentRoutes() {
    // main two content routes
    Router.get('/@:username/:item', ValidateContentRequest(), HandleBadRequest, (req: Request, res: Response) => {
        const username = req.params.username;
        const item = req.params.item;

        const bypassVideoPage = req.query && req.query.bypass;

        const pathOfContent = join(UPLOADS_PATH, username, item);

        if (!existsSync(pathOfContent)) {
            return res.status(404).render('notfound.ejs');
        }

        if (pathOfContent.endsWith('.mp4') && !bypassVideoPage) {
            res.render('watchpage.ejs', {filename: item, domain, user: username});
        } else {
            res.sendFile(pathOfContent);
        }
    });
    Router.get('/view/@:username/:item', ValidateContentRequest(), HandleBadRequest, (req: Request, res: Response) => {
        const username = req.params.username;
        const item = req.params.item;

        const pathOfContent = join(UPLOADS_PATH, username, item);

        if (!existsSync(pathOfContent)) {
            return res.status(404).render('notfound.ejs');
        }

        const info = statSync(pathOfContent);

        res.render('view_info.ejs', {username, filename:item, filesize:info.size, filetype:item.split('.').at(-1)});
    });
}