import { Request } from 'express';
import multer, { diskStorage } from 'multer';
import { UPLOADS_TEMP_PATH } from '../util/paths';
import { UploadResult } from '../types';

// someone help me figure out a type for this PLEASE
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const UploadResults: any = {
    'test':UploadResult.UPLOAD_OK
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