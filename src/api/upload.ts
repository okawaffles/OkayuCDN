import multer from 'multer';
import { UploadResult } from '../types';
import { GetUserFromToken } from '../util/secure';
import { mkdirSync, renameSync } from 'fs';
import { join } from 'path';
import { UPLOADS_PATH } from '../util/paths';
import { matchedData } from 'express-validator';
import { error } from 'okayulogger';
import { Request, Response } from 'express';
import { domain } from '../main';

// someone help me figure out a type for this PLEASE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const UploadResults: any = {
    'test':UploadResult.UPLOAD_OK
};


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const user = GetUserFromToken(req.cookies.token);
        const username = user.username;

        const uploadPath = join(UPLOADS_PATH, username);
        mkdirSync(uploadPath, {recursive: true});

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, 'LATEST.UPLOADING');
    }
});

export const MulterUploader = multer({storage});

export function FinishUpload(req: Request, res: Response) {
    const data = matchedData(req);
    const user = GetUserFromToken(data.token);
    const filename = data.filename;
    const extension = data.extension;

    const currentPath = join(UPLOADS_PATH, user.username, 'LATEST.UPLOADING');
    const newPath = join(UPLOADS_PATH, user.username, filename+'.'+extension);

    try {
        renameSync(currentPath, newPath);

        res.json({
            status: 200,
            goto: `${domain}/view/${user.username}/${filename}.${extension}`
        });
    } catch (e: unknown) {
        error('upload', 'failed to upload file');
        error('upload', ''+e);

        res.json({status:400});
    }
}