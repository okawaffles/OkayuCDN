import multer from 'multer';
import { StorageData, UploadResult, UserModel } from '../types';
import { AddProtectedFile, GetUserFromToken } from '../util/secure';
import { appendFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { UPLOADS_PATH } from '../util/paths';
import { matchedData } from 'express-validator';
import { debug, error, info } from 'okayulogger';
import { Request, Response } from 'express';
import { domain, ENABLE_DEBUG_LOGGING } from '../main';
import { GetStorageInfo } from './content';

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
    if (ENABLE_DEBUG_LOGGING) debug('upload', 'starting upload joining procedure...');
    info('upload', 'finishing upload ...');

    const data = matchedData(req);
    const user: UserModel = GetUserFromToken(data.token || data.authorization);
    const filename: string = data.filename;
    const extension: string = data.extension;
    
    let newName: string = `${filename}.${extension}`;

    const userFiles: string[] = readdirSync(join(UPLOADS_PATH, user.username));

    if (ENABLE_DEBUG_LOGGING) debug('upload', `new upload name: ${newName}, for user ${user.username}`);

    // ensure we don't write over a preexisting file:
    // do this by adding numbers to the filename
    if (userFiles.indexOf(newName) > -1) {
        if (ENABLE_DEBUG_LOGGING) debug('upload', 'file already exists for user, appending a number to the filename');
        newName = `${filename}-0.${extension}`;
        let i = 0;
        while (userFiles.indexOf(newName) > -1) {
            i++;
            newName = `${filename}-${i}.${extension}`;
        }
    }

    const newPath = join(UPLOADS_PATH, user.username, newName);
    
    const totalChunks: number = req.body.chunk_count;
    let uploadAllowed: boolean = true;

    const userStorage: StorageData = GetStorageInfo(user, true);

    if (ENABLE_DEBUG_LOGGING) debug('upload', `new file path = ${newPath}`);
    if (ENABLE_DEBUG_LOGGING) debug('upload', `total chunks = ${totalChunks}`);

    // OkayuCDN is nice about storage:
    // if you are at, for example, 99mb of 100mb, you may upload files until you are equal or over your limit
    // this is limited to a 100mb file at max
    uploadAllowed = (!(userStorage.used >= userStorage.total));

    // we can estimate the size of a file based on the number of chunks
    // 5mb * 20 = ~100mb
    // only run this if we're within 100mb of our storage limit
    if (totalChunks > 20 && (userStorage.total - userStorage.used) <= 100*1024*1024) uploadAllowed = false;

    try {
        info('upload', 'Joining file chunks...');
        for (let i = 0; i != totalChunks; i++) {
            debug('upload', `joining chunk ${i+1}/${totalChunks}`);
            const currentPath = join(UPLOADS_PATH, user.username, 'LATEST.UPLOADING.'+i);
            // don't append to file unless they have sufficient storage
            if (uploadAllowed) appendFileSync(newPath, <Uint8Array<ArrayBuffer>> readFileSync(currentPath));
            rmSync(currentPath);
        }

        if (req.body.isPrivate == 'true') { AddProtectedFile(user.username, newName); debug('upload', 'user requested file to be private, adding to their index...'); }
    
        if (!uploadAllowed) {
            debug('upload', 'insufficient storage to finish upload');
            error('upload', 'insufficient storage for upload: aborting!');
            return res.json({status:423,reason:'Insufficient storage'});
        }

        res.json({
            status: 200,
            goto: `${domain}/view/@${user.username}/${newName}`
        });

        info('upload', `Upload finished successfully (@${user.username}/${newName})`);
    } catch (e: unknown) {
        error('upload', 'failed to upload file');
        error('upload', ''+e);

        res.json({status:400});
    }
}