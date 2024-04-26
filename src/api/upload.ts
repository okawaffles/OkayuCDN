import multer from 'multer';
import { UploadResult, UserModel } from '../types';
import { GetUserFromToken } from '../util/secure';
import { appendFileSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { UPLOADS_PATH } from '../util/paths';
import { matchedData } from 'express-validator';
import { error, info } from 'okayulogger';
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
        cb(null, 'LATEST.UPLOADING.ID');
    }
});

export const MulterUploader = multer({storage});

export function FinishUpload(req: Request, res: Response) {
    info('upload', 'finishing upload ...');

    const data = matchedData(req);
    const user: UserModel = GetUserFromToken(data.token);
    const filename: string = data.filename;
    const extension: string = data.extension;
    
    let newName: string = `${filename}.${extension}`;

    const userFiles: string[] = readdirSync(join(UPLOADS_PATH, user.username));

    // ensure we don't write over a preexisting file:
    // do this by adding numbers to the filename
    if (userFiles.indexOf(newName) > -1) {
        newName = `${filename}-0.${extension}`;
        let i = 0;
        while (userFiles.indexOf(newName) > -1) {
            i++;
            newName = `${filename}-${i}.${extension}`;
        }
    }

    const newPath = join(UPLOADS_PATH, user.username, newName);
    
    const totalChunks = req.body.chunk_count;

    try {
        for (let i = 0; i != totalChunks; i++) {
            info('upload', `joining chunk ${i}/${totalChunks}`);
            const currentPath = join(UPLOADS_PATH, user.username, 'LATEST.UPLOADING.'+i);
            appendFileSync(newPath, readFileSync(currentPath));
        }
    
        res.json({
            status: 200,
            goto: `${domain}/view/@${user.username}/${newName}`
        });

        info('upload', 'upload finished ok!');
    } catch (e: unknown) {
        error('upload', 'failed to upload file');
        error('upload', ''+e);

        res.json({status:400});
    }
}