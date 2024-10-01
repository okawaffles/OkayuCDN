import { Request, Response } from 'express';
import { ENABLE_DEBUG_LOGGING, Router, domain, version } from '../main';
import { join } from 'path';
import { UPLOADS_PATH } from '../util/paths';
import { HandleBadRequest, ValidateContentRequest, ValidateOptionalToken, ValidateShortURL, ValidateVideoStreamParams } from '../util/sanitize';
import { existsSync, statSync } from 'fs';
import { GetUserFromToken, IsContentProtected } from '../util/secure';
import { matchedData } from 'express-validator';
import { GetLinkData } from '../api/shortener';
import { HandleVideoStreaming } from '../api/content';
import { debug } from 'okayulogger';
import Ffmpeg from 'fluent-ffmpeg';


export function RegisterContentRoutes() {
    if (ENABLE_DEBUG_LOGGING) debug('routes', 'registering content routes...');

    // main two content routes
    Router.get('/@:username/:item', ValidateContentRequest(), ValidateOptionalToken(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        const username = data.username;
        const item = data.item;

        if (ENABLE_DEBUG_LOGGING) debug('content', `preparing content ${username}/${item}`);

        if (item.startsWith('LATEST.UPLOADING.')) return res.status(404).render('notfound.ejs', {version}); // don't allow sending of pre-joined uploading files

        const bypassVideoPage = data.bypass;

        const pathOfContent = join(UPLOADS_PATH, username, item);

        if (!existsSync(pathOfContent)) return res.status(404).render('notfound.ejs', {version});

        if (IsContentProtected(username, item)) {
            if (ENABLE_DEBUG_LOGGING) debug('content', 'content is protected, verifying ownership');
            if (data.token == undefined) return res.status(404).render('err401');
            if (GetUserFromToken(data.token).username != username) return res.status(404).render('err401');
        }

        if (pathOfContent.endsWith('.mp4') && !bypassVideoPage) {
            if (ENABLE_DEBUG_LOGGING) debug('content', 'content is of type MP4 and bypassVideoPage is false, rendering the watchpage instead of sending the file');
            res.render('watchpage.ejs', {filename: item, domain, user: username});
        } else {
            if (ENABLE_DEBUG_LOGGING) debug('content', 'sending raw content');

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

        try {
            const linkData = GetLinkData(data.id);

            if (linkData.isViewPage)
                res.redirect(`/view/@${linkData.user}/${linkData.content}`);
            else
                res.redirect(`/@${linkData.user}/${linkData.content}`);
        } catch {
            res.status(404).send('This shortened link has expired. Please ask the sender to create a new link.');
        }
    });

    // Route for getting videos (hopefully so they don't stream awfully)
    Router.get('/@:username/:item/stream', ValidateContentRequest(), ValidateOptionalToken(), ValidateVideoStreamParams(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        const username: string = data.username;
        const item: string = data.item;

        // only mp4 files are supported right now
        if (!item.endsWith('.mp4')) return res.status(400).end();

        // make sure content exists
        if (!existsSync(
            join(UPLOADS_PATH, username, item)
        )) return res.status(404).render('notfound');

        // make sure it's not protected & if it is make sure theyre authorized to view it
        if (IsContentProtected(username, item)) { 
            if (!data.token || GetUserFromToken(data.token).username != username)
                return res.status(401).render('err401');
        }

        // handoff to api to handle the rest
        HandleVideoStreaming(req, res);
    });

    Router.get('/api/thumbnail/@:username/:item', ValidateContentRequest(), HandleBadRequest, (req: Request, res: Response) => {
        const data = matchedData(req);
        
        if (!existsSync(join(UPLOADS_PATH, data.username, data.item))) return res.status(400).render('notfound');

        // need to use ffmpeg for this
        Ffmpeg(join(UPLOADS_PATH, data.username, data.item)).takeScreenshots({
            count: 1,
            timemarks: ['0'],
            filename: '@tn.png',
        }, join(UPLOADS_PATH, data.username)).on('end', () => {
            res.sendFile(join(UPLOADS_PATH, data.username, '@tn.png'));
        });
    });

    if (ENABLE_DEBUG_LOGGING) debug('routes', 'done registering content routes');
}