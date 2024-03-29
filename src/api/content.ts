import { join } from 'node:path';
import { ContentItem, StorageData, UserModel } from '../types';
import { UPLOADS_PATH } from '../util/paths';
import { readdirSync, statSync } from 'node:fs';


export function GetStorageInfo(user: UserModel): StorageData {
    const content: Array<ContentItem> = [];

    const contentPath: string = join(UPLOADS_PATH, user.username);
    let usedStorage: number = 0;

    // get all of user's content
    readdirSync(contentPath).forEach((name: string) => {
        // read each file and get its size
        const size: number = statSync(join(contentPath, name)).size;
        usedStorage += size;
        content.push({ name, size });
    });

    const storage: StorageData = {
        used: usedStorage,
        total: user.storageAmount,
        content
    };

    return storage;
}