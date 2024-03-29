import { join } from 'node:path';
import { USER_DATABASE_PATH, TOKEN_DATABASE_PATH } from './paths';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Request, Response } from 'express';
import { matchedData } from 'express-validator';
import { UserModel, UserSecureData } from '../types';
import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from 'argon2';
import { totp } from 'speakeasy';

/**
 * Generate a new 32-character token.
 * @returns a cryptographically secure 32-character hexadecimal token
 */
export function CreateNewToken(): string {
    return randomBytes(16).toString('hex');
}

/**
 * Create and save a new token to the database
 * @param user UserModel of the user to register the token to.
 * @returns the generated token
 */
export function RegisterNewToken(user: UserModel): string {
    const token: string = CreateNewToken();
    writeFileSync(join(TOKEN_DATABASE_PATH, `${token}.json`), user.username);
    return token;
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

/**
 * Check if a user account exists in the database.
 * @param user the username/UserModel of the user we want to verify exists
 * @returns true if they exist, false otherwise
 */
export function VerifyUserExists(user: string | UserModel): boolean {
    if (typeof(user) == 'object')
        return existsSync(join(USER_DATABASE_PATH, `${user.username}.json`));
    else
        return existsSync(join(USER_DATABASE_PATH, `${user}.json`));
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

/**
 * Get a UserModel from a username. This function assumes you have already checked whether the user exists in the database.
 * @param username the username of the UserModel we want to get
 * @param addSecureData add secure data to the UserModel when returned
 * @returns UserModel of the user
 */
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


/**
 * This function should and will only be called when a user is upgrading from a pre-6.0 password which was
 * encrypted with sha256 as opposed to argon2. The passwords are then re-encrypted and replaced with an argon2 hash.
 * @param user UserModel of the user
 * @param secureData UserSecureData of the user
 * @param raw_password the unencrypted password of the user
 * @returns true if password update was successful, false if the password is incorrect (or otherwise)
 */
async function UpgradeUserPassword(user: UserModel, secureData: UserSecureData, raw_password: string): Promise<boolean> {
    return new Promise((resolve: CallableFunction) => {
        const passwordInSHA256: string = createHash('sha256').update(raw_password).digest('hex');
        if (passwordInSHA256 != secureData.password) {
            resolve(false);
            return;
        }

        // re-encrypt the password
        const newPasswordSalt: string = CreateNewToken(); 

        // this nesting is quite ugly, but it seems as if this is the only way
        // eslint will let me to it. PR if you can fix this :3
        hash(raw_password + newPasswordSalt).then((newHashedPassword) => {
            secureData.password = newHashedPassword;
            secureData.password_salt = newPasswordSalt;
            secureData.passwordIsLegacy = false;
            
            user.SecureData = secureData;
            
            writeFileSync(join(USER_DATABASE_PATH, `${user.username}.json`), JSON.stringify(user), 'utf-8');
            resolve(true);
        });
    });
}

/**
 * Check whether provided login credentials are correct. Also upgrades pre-6.0 passwords to argon2 (and switches to the new UserModel data structure if so).
 * @param username provided username
 * @param password provided password
 * @returns true if the credentials are correct, false otherwise
 */
export async function VerifyLoginCredentials(username: string, password: string): Promise<boolean> {
    if (!VerifyUserExists(username)) return false;

    const user: UserModel = GetUserModel(username, true);

    if (user.SecureData?.passwordIsLegacy) {
        return UpgradeUserPassword(user, user.SecureData, password);
    }

    return await verify(<string> user.SecureData?.password, password + user.SecureData?.password_salt);
}


/**
 * Validate whether a user's two-factor authentication code is correct.
 * @param username username to get UserModel from
 * @param otp the one-time 2FA code from the auth. app
 */
export function VerifyOTPCode(username: string, otp: number): boolean {
    const user: UserModel = GetUserModel(username, true);

    return totp.verify({
        secret: user.SecureData.twoFactorData.OTPConfig.secret,
        encoding: 'base32',
        token: otp
    });
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