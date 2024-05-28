import { join } from 'node:path';
import { ContentItem, StorageData, UserModel } from '../types';
import { UPLOADS_PATH } from '../util/paths';
import { readdirSync, rmSync, statSync } from 'node:fs';
import { GetProtectedFiles } from '../util/secure';


export function GetStorageInfo(user: UserModel): StorageData {
    const content: Array<ContentItem> = [];

    const contentPath: string = join(UPLOADS_PATH, user.username);
    let usedStorage: number = 0;

    // get all of user's content
    readdirSync(contentPath).forEach((name: string) => {
        // read each file and get its size
        const size: number = statSync(join(contentPath, name)).size;

        // Check if user has remnants of a broken file upload
        // if so, remove them, and don't add them to the user's storage
        if (name.startsWith('LATEST.UPLOADING')) {
            rmSync(join(contentPath, name));
        } else {
            usedStorage += size;
            content.push({ name, size });
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