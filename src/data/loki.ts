import { join } from 'node:path';
import { DATABASE_PATH } from '../util/paths';
import { UserModel } from '../types';
import Loki, { Collection } from 'lokijs';
import { Logger } from 'okayulogger';

const L = new Logger('loki');
let ACCOUNT_DB: Loki;
let accounts: Collection;


export function LoadDB(): boolean {
    try {
        ACCOUNT_DB = new Loki(join(DATABASE_PATH, 'accounts.okayudb'));
        accounts = ACCOUNT_DB.addCollection('accounts');
        L.info('Loaded account database');
        return true;
    } catch (err) {
        L.fatal(<string> err);
        L.fatal('An error occurred loading the database. OkayuCDN cannot continue.');
        return false;
    }
}


export function DB_RegisterAccount(user: UserModel): boolean {
    try {
        accounts.insert(user);

        return true;
    } catch (err) {
        L.error('could not register account!');
        L.error(<string> err);

        return false;
    }
}


export function DB_GetAccount(username: string): UserModel | null {
    const account = accounts.findOne({username});

    if (!account) return null;

    return account as UserModel;
}