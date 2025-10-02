/*
    Yes, I'm trying to get passkeys working AGAIN.
    This time, I'm DETERMINED to get it working.
*/

import type { AuthenticatorTransportFuture, CredentialDeviceType, PublicKeyCredentialCreationOptionsJSON, Base64URLString } from '@simplewebauthn/server';
import { join } from 'path';
import { DATABASE_PATH } from '../util/paths';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { domain, Router } from '../main';
import { GetUserFromToken, PrefersLogin } from '../util/secure';
import { HandleBadRequest, ValidatePasskeySetup, ValidateToken } from '../util/sanitize';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { matchedData } from 'express-validator';
import { Logger } from 'okayulogger';

const L = new Logger('okayusecure');

interface Passkey {
    id: Base64URLString,
    publicKey: Uint8Array,
    username: string,
    webauthnUserID: Base64URLString,
    counter: number,
    deviceType: CredentialDeviceType,
    transports?: AuthenticatorTransportFuture[],
}

interface PasskeyDB {
    passkeys: {
        [key: string]: Passkey[]   
    }
}

let PASSKEYS: PasskeyDB;

/**
 * Load the passkey database from db/passkey.okayudb
 */
export function LoadPasskeysDB() {
    L.debug('loading passkey database...');
    const db_path = join(DATABASE_PATH, 'passkey.okayudb');

    if (!existsSync(db_path)) {
        writeFileSync(db_path, '{"passkeys":{}}', 'utf-8');
        return;
    }

    PASSKEYS = JSON.parse(readFileSync(db_path, 'utf-8'));
    L.debug('loaded passkey database!');
}

/**
 * Save the passkey database to db/passkey.okayudb
 */
export function SavePasskeysDB() {
    const db_path = join(DATABASE_PATH, 'passkey.okayudb');
    const passkeys = JSON.stringify(PASSKEYS, null, 4);
    writeFileSync(db_path, passkeys, 'utf-8');
}

// -- SETUP --

// constants
const RP_NAME = 'OkayuCDN';
const RP_ID = domain;
// const RP_ORIGIN = `https://${domain}`;

const AWAITING_REGISTRATION_OPTIONS: {[key: string]: PublicKeyCredentialCreationOptionsJSON} = {};

// paths for requests
export function RegisterPasskeyRoutes() {
    L.debug('registering passkey routes...');
    LoadPasskeysDB();

    Router.get('/okayusecure/passkey/register', ValidateToken(), PrefersLogin, HandleBadRequest, async (req, res) => {
        const data = matchedData(req);
        const user = GetUserFromToken(data.token);

        const options: PublicKeyCredentialCreationOptionsJSON = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userName: user.username,
            attestationType: 'none',
            excludeCredentials: [],
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
            // userID: user.username
        });

        AWAITING_REGISTRATION_OPTIONS[user.username] = options;

        res.json(options);
    });

    Router.post('/okayusecure/passkey/register-finish', 
        ValidateToken(), 
        PrefersLogin, 
        ValidatePasskeySetup, 
        HandleBadRequest, 
        async (req, res) => {
            console.log(req.body);
            res.status(200).end();
        });

    L.debug('done!');
}