import { Request } from 'express';
import { UploadResult } from '../types';
import multer, { diskStorage } from 'multer';

export const UploadResults = {
    'okawaffles':UploadResult.UPLOAD_OK
};



const storage = diskStorage({
    destination: (req: Request, file, cb)
});

const upload = multer({ storage: });