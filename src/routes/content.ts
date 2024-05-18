import { Request, Response } from 'express';
import { Router, domain, version } from '../main';
import { join } from 'path';
import { UPLOADS_PATH } from '../util/paths';
import { HandleBadRequest, ValidateContentRequest, ValidateOptionalToken, ValidateShortURL } from '../util/sanitize';
import { existsSync, statSync } from 'fs';
import { GetUserFromToken, IsContentProtected } from '../util/secure';
import { matchedData } from 'express-validator';
import { GetLinkData } from '../api/shortener';


export function RegisterContentRoutes() {
    // main two content routes
    Router.get('/@:username/:item', ValidateContentRequest(), ValidateOptionalToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        const username = data.username;
        const item = data.item;

        if (item.startsWith('LATEST.UPLOADING.')) return res.status(404).render('notfound.ejs', {version}); // don't allow sending of pre-joined uploading files

        const bypassVideoPage = data.bypass;

        const pathOfContent = join(UPLOADS_PATH, username, item);

        if (!existsSync(pathOfContent)) return res.status(404).render('notfound.ejs', {version});

        if (IsContentProtected(username, item)) {
            if (data.token == undefined) return res.status(404).render('err401');
            if (GetUserFromToken(data.token).username != username) return res.status(404).render('err401');
        }

        if (pathOfContent.endsWith('.mp4') && !bypassVideoPage) {
            res.render('watchpage.ejs', {filename: item, domain, user: username});
        } else {
            if (data.intent == 'download') return res.download(pathOfContent);
            res.sendFile(pathOfContent);
        }
    });
    Router.get('/view/@:username/:item', ValidateContentRequest(), ValidateOptionalToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        const username = data.username;
        const item = data.item;

        const pathOfContent = join(UPLOADS_PATH, username, item);

        if (!existsSync(pathOfContent)) {
            return res.status(404).render('notfound.ejs');
        }

        if (IsContentProtected(username, item)) {
            if (data.token == undefined) return res.status(404).render('err401');
            if (GetUserFromToken(data.token).username != username) return res.status(404).render('err401');
        }

        const info = statSync(pathOfContent);

        res.render('view_info.ejs', {username, filename:item, filesize:info.size, filetype:item.split('.').at(-1)});
    });

    // Backwards-compatibility with old links
    Router.get('/content/:username/:item', ValidateContentRequest(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        const username = data.username;
        const item = data.item;

        res.redirect(301, `/@${username}/${item}`);
    });

    // Short URL GET route
    Router.get('/.:id', ValidateShortURL(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);

        const linkData = GetLinkData(data.id);

        if (linkData.isViewPage)
            res.redirect(`/view/@${linkData.user}/${linkData.content}`);
        else
            res.redirect(`/@${linkData.user}/${linkData.content}`);
    });
}