import { join } from 'node:path';
import { DATABASE_PATH } from './paths';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Request, Response } from 'express';
import { matchedData } from 'express-validator';
import { UserModel, UserSecureData } from '../types';
import { randomBytes } from 'node:crypto';
import { hash } from 'argon2';


const USER_DATABASE_PATH: string = join(DATABASE_PATH, 'users');
const TOKEN_DATABASE_PATH: string = join(DATABASE_PATH, 'tokens');


export function CreateNewToken(): string {
    return randomBytes(16).toString('hex');
}

function RegisterNewToken(user: UserModel): void {
    const token: string = CreateNewToken();
    writeFileSync(join(TOKEN_DATABASE_PATH, `${token}.json`), user.username);
}

/**
 * As tokens have no expiration time, this simply just checks whether the server is aware of the token.
 * @param token the user's token
 * @returns true or false whether the token is valid
 */
function CheckToken(token: string): boolean {
    return existsSync(join(TOKEN_DATABASE_PATH, `${token}.json`));
}


/**
 * Get the correpsonding UserModel from a token
 * @param token the user's token
 * @returns UserModel of the corresponding user
 */
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

export function VerifyUserExists(username: string): boolean {
    return existsSync(join(USER_DATABASE_PATH, `${username}.json`));
}

/**
 * Get the secure data (sensitive info) of a UserModel
 * @param user the UserModel of the user
 * @returns the UserSecureData associated with that UserModel
 */
export function GetSecureData(user: UserModel): UserSecureData {
    const userData = JSON.parse(readFileSync(join(USER_DATABASE_PATH, `${user.username}.json`), 'utf-8'));

    if (userData.UserModel) {
        return userData.SecureData as UserSecureData;
    }

    const SecureData: UserSecureData = {
        password: userData.password,
        password_salt: userData.password_salt || undefined, // not present if not using argon2
        passwordIsLegacy: (userData.hash_method != 'argon2'),
        two_factor: userData.uses2FA,
        two_factor_data: userData.tfa_config || undefined // not present if not using 2fa
    };

    return SecureData; 
}

export function GetUserModel(username: string, addSecureData: boolean = false): UserModel {
    const userData = JSON.parse(readFileSync(join(USER_DATABASE_PATH, `${username}.json`), 'utf-8'));

    if (userData.UserModel) {
        return userData as UserModel;
    }

    const model: UserModel = {
        username: username,
        userId: -1, // userId is -1 until implemented, if ever
        email: userData.email,
        storageAmount: userData.storage,
        hasLargeStorage: userData.premium,
        preferences: {
            language: 0
        }
    };

    if (addSecureData) model.SecureData = GetSecureData(model);

    return model;
}


async function UpgradeUserPassword(user: UserModel, secureData: UserSecureData, raw_password: string) {
    // TODO: add check to ensure password is correct

    const newPasswordSalt: string = CreateNewToken(); 
    const newHashedPassword = await hash(raw_password + newPasswordSalt);

    secureData.password = newHashedPassword;
    secureData.password_salt = newPasswordSalt;
    secureData.passwordIsLegacy = false;
    
    user.SecureData = secureData;

    writeFileSync(join(USER_DATABASE_PATH, `${user.username}.json`), JSON.stringify(user), 'utf-8');
}


export async function VerifyLoginCredentials(username: string, password: string): boolean {
    if (!VerifyUserExists(username)) return false;

    const user: UserModel = GetUserModel(username, true);

    if (user.SecureData?.passwordIsLegacy) {
        UpgradeUserPassword(user, user.SecureData, password);
    }

    // TODO: finish argon2 checking
}


/**
 * Used to check if the user has a token (and if its valid).
 * If invalid, it will redirect the user to the login page.
 */
export const PrefersLogin = (req: Request, res: Response, next: CallableFunction) => {
    const data = matchedData(req);
    
    // validate token...
    if (!data.token) return res.redirect(`/login?redir=${req.originalUrl}`);
    if (!CheckToken(data.token)) return res.redirect(`/login?redir=${req.originalUrl}`);

    // all is good, continue:
    next();
};