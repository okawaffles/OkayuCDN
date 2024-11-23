import { join } from 'node:path';
import { DATABASE_PATH } from '../util/paths';
import { UserModel } from '../types';
import Loki, { Collection } from 'lokijs';
import { Logger } from 'okayulogger';

const L = new Logger('loki');
let ACCOUNT_DB: Loki;
let accounts: Collection;
let privateIndexes: Collection;
let dbLoaded = false;

//

export function LoadDB(): boolean {
    try {
        ACCOUNT_DB = new Loki(join(DATABASE_PATH, 'accounts.okayudb'), {
            autosave: true,
            autosaveInterval: 1000*60*10 // autosave every 10 minutes
        });
        
        accounts = ACCOUNT_DB.getCollection('accounts');
        privateIndexes = ACCOUNT_DB.getCollection('pci');
        if (accounts == null) accounts = ACCOUNT_DB.addCollection('accounts');
        if (privateIndexes == null) accounts = ACCOUNT_DB.addCollection('pci');

        L.info('Loaded account database');
        dbLoaded = true;
        return true;
    } catch (err) {
        L.fatal(<string> err);
        L.fatal('An error occurred loading the database. OkayuCDN cannot continue.');
        return false;
    }
}

export function SaveDB(): boolean {
    if (!dbLoaded) return false;
    
    try {
        ACCOUNT_DB.saveDatabase();
        return true;
    } catch (err) {
        L.fatal(<string> err);
        L.fatal('Database could not save successfully!');
        return false;
    }
}

// Get/Register accounts

export function DB_RegisterAccount(user: UserModel): boolean {
    try {
        accounts.insert(user);
        ACCOUNT_DB.saveDatabase();

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


// Modify an account


export function DB_UpdateAccount(newUserModel: UserModel): boolean {
    try {
        accounts.update(newUserModel);

        return true;
    } catch (err) {
        L.error(<string> err);
        L.error(`Failed to update UserModel for ${newUserModel.username}`);

        return false;
    }
}

export interface PCI {
    username: string,
    files: Array<string>
}

export function DB_CreatePCI(username: string): boolean {
    try {
        const pci: PCI = {
            username,
            files: []
        };

        privateIndexes.insert(pci);
        return true;
    } catch (err) {
        L.error(<string> err);
        L.error(`Failed to create PCI for ${username}`);
        return false;
    }
}


/**
 * Add or remove an item from a user's PCI. If it exists, it will remove it, otherwise, it will add it to the PCI.
 * @param username The username of the PCI to update
 * @param item The item to be added/removed
 */
export function DB_UpdatePCI(username: string, item: string): boolean {
    try {
        const pci: PCI = privateIndexes.findOne({username});
        if (!pci) return false;

        if (pci.files.indexOf(item) != -1)
            pci.files.push(item);
        else
            pci.files.splice(pci.files.indexOf(item), 1);

        return true;
    } catch(err) {
        L.error(<string> err);
        L.error(`Failed to update PCI for ${username}/${item}`);
        return false;
    }
}


export function DB_GetPCI(username: string): PCI | null {
    try {
        const pci: PCI = privateIndexes.findOne({username});
        if (!pci) return null;
        return pci;
    } catch (err) {
        L.error(<string> err);
        L.error(`Failed to get PCI for ${username}`);
        return null;
    }
}