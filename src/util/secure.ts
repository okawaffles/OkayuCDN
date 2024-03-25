import { join } from 'node:path';
import { DATABASE_PATH } from './paths';
import { existsSync, readFileSync } from 'node:fs';
import { Request, Response } from 'express';
import { matchedData } from 'express-validator';
import { UserModel } from '../types';


const USER_DATABASE_PATH: string = join(DATABASE_PATH, 'users');
const TOKEN_DATABASE_PATH: string = join(DATABASE_PATH, 'tokens');


/**
 * As tokens have no expiration time, this simply just checks whether the server is aware of the token.
 * @param token the user's token
 * @returns true or false whether the token is valid
 */
function CheckToken(token: string): boolean {
    return existsSync(join(TOKEN_DATABASE_PATH, `${token}.json`));
}


export function GetUserFromToken(token: string): UserModel {
    const tokenUsername: string = readFileSync(join(TOKEN_DATABASE_PATH, `${token}.json`), 'utf-8');
    const userData = JSON.parse(readFileSync(join(USER_DATABASE_PATH, `${tokenUsername}.json`), 'utf-8'));
    
    if (userData.UserModel) {
        return userData as UserModel;
    }

    const model: UserModel = {
        username: tokenUsername,
        userId: -1, // userId is -1 until implemented, if ever
        email: userData.email,
        storageAmount: userData.storage,
        hasLargeStorage: userData.premium,
        preferences: {
            language: 0
        }
    };

    return model;
}


/**
 * Used to check if the user has a token (and if its valid).
 * If invalid, it will redirect the user to the login page.
 */
export const PrefersLogin = (req: Request, res: Response, next: CallableFunction) => {
    const data = matchedData(req);
    
    // validate token...
    if (!data.token) return res.redirect('/login');
    if (!CheckToken(data.token)) return res.redirect('/login');

    // all is good, continue:
    next();
};