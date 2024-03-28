import { Request } from 'express';
import { UploadResult } from '../types';
import multer, { diskStorage } from 'multer';
import { UPLOADS_TEMP_PATH } from '../util/paths';

export const UploadResults = {
    'okawaffles':UploadResult.UPLOAD_OK
};



const storage = diskStorage({
    destination: (req: Request, file: Express.Multer.File, callback: CallableFunction) => {
        callback(null, UPLOADS_TEMP_PATH);
    },
    filename: (req: Request, file: Express.Multer.File, callback: CallableFunction) => {
        callback(null, file.originalname);
    }
});

export const MulterUploader = multer({ storage });