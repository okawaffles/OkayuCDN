import { join } from 'node:path';
import { ContentItem, StorageData, UserModel } from '../types';
import { UPLOADS_PATH } from '../util/paths';
import { createReadStream, readdirSync, rmSync, Stats, statSync } from 'node:fs';
import { GetProtectedFiles } from '../util/secure';
import { Request, Response } from 'express';
import { matchedData } from 'express-validator';


export function GetStorageInfo(user: UserModel, keepFileRemnants = false): StorageData {
    const content: Array<ContentItem> = [];

    const contentPath: string = join(UPLOADS_PATH, user.username);
    let usedStorage: number = 0;

    // get all of user's content
    readdirSync(contentPath).forEach((name: string) => {
        // read each file and get its size
        const filestats: Stats = statSync(join(contentPath, name));
        const size: number = filestats.size;
        const date: number = filestats.birthtimeMs;

        // Check if user has remnants of a broken file upload
        // if so, remove them, and don't add them to the user's storage
        // @ can't be used in filenames so they're reserved for thumbnails and whatnot
        if (name.startsWith('LATEST.UPLOADING') || name.startsWith('@')) {
            if (!keepFileRemnants) rmSync(join(contentPath, name));
        } else {
            usedStorage += size;
            content.push({ name, size, date });
        }

    });

    const protected_files: Array<string> = GetProtectedFiles(user.username);
    
    const storage: StorageData = {
        used: usedStorage,
        total: user.storageAmount,
        content,
        protected_files
    };

    return storage;
}

export function HandleVideoStreaming(req: Request, res: Response) {
    const data = matchedData(req);

    const video_path: string = join(UPLOADS_PATH, data.username, data.item);
    const stats: Stats = statSync(video_path);
    const filesize: number = stats.size;
    const range: string = data.range;

    if (range) {
        const parts = range.replace('bytes=', '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : filesize - 1;
        const chunk_size = end - start + 1;
        const file = createReadStream(video_path, {start, end});
        
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${filesize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunk_size,
            'Content-Type': 'video/mp4'
        };
        
        res.writeHead(206, headers);
        file.pipe(res);
    } else {
        const headers = {
            'Content-Length': filesize,
            'Content-Type': 'video/mp4'
        };

        res.writeHead(200, headers);
        createReadStream(video_path).pipe(res);
    }
}