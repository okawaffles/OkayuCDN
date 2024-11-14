import { existsSync, readFileSync, writeFileSync } from 'fs';
import { AuthorizationIntents, SessionUserMap, TokenList, TokenType, TokenV2 } from '../types';
import { join } from 'path';
import { DATABASE_PATH, TOKEN_DATABASE_PATH } from '../util/paths';
import { Logger } from 'okayulogger';
import { ENABLE_DEBUG_LOGGING } from '../main';

const L = new Logger('tokens');

const authorizedIntentsBits: { [key in keyof AuthorizationIntents]: number } = {
    canUseWebsite: 0,
    canUseDesktop: 1,
    canGetStorage: 2,
    canViewPublicItems: 3,
    canViewPrivateItems: 4,
    canChangeItemPrivacy: 5,
    canDeleteItem: 6,
    canUpload: 7,
    canChangeAccountOptions: 8,
};

export function EncodeIntents(intents: AuthorizationIntents): number {
    let encoded: number = 0;

    for (const [key, bit] of Object.entries(authorizedIntentsBits)) {
        if (intents[key as keyof AuthorizationIntents]) {
            encoded |= (1 << bit);
        }
    }

    return encoded;
}

export function DecodeIntents(encoded: number): AuthorizationIntents {
    const intents: AuthorizationIntents = {};

    for (const [key, bit] of Object.entries(authorizedIntentsBits)) {
        intents[key as keyof AuthorizationIntents] = (encoded & (1 << bit)) !== 0;
    }

    return intents;
}


enum DefaultIntents {
    USER_INTENTS = 509,
    DESKTOP_INTENTS = 134
}


/**
 * Generate a user Token V2, with the default intents  
 * @param username The username of the user who wants the token
 */
export function GenerateDefaultUserToken(username: string): TokenV2 {
    return {
        tokenType: TokenType.TOKEN_TYPE_USER,
        username,
        intents: DecodeIntents(DefaultIntents.USER_INTENTS)
    } as TokenV2;
}

/**
 * Generate a desktop Token V2, with the default intents  
 * @param username The username of the user who wants the token
 */
export function GenerateDefaultDesktopToken(username: string): TokenV2 {
    return {
        tokenType: TokenType.TOKEN_TYPE_AUTHORIZATION,
        username,
        intents: DecodeIntents(DefaultIntents.DESKTOP_INTENTS),
        authorizedAppId: 2773
    } as TokenV2;
}

/**
 * Read the intents property of a token
 * @param token The token to read
 * @returns AuthorizationIntents of the token
 */
export function ReadIntents(token: string): AuthorizationIntents {
    try {
        // const intents = JSON.parse(readFileSync(join(TOKEN_DATABASE_PATH, `${token}.json`), 'utf-8')).intents;
        const intents = GetTokenFromCookie(token).intents;
        return intents;
    } catch (e: unknown) {
        return {};
    }
}

/**
 * Change the active user in a token while keeping the rest of the token the same.
 * @param token The token of the user who is getting their username changed
 * @param new_username The new username to assign to that token
 */
export function ChangeTokenUsername(token: string, new_username: string) {
    const tokenData: TokenV2 = JSON.parse(
        readFileSync(
            join(TOKEN_DATABASE_PATH), 'utf-8'
        )
    );

    tokenData.username = new_username;

    writeFileSync(
        join(TOKEN_DATABASE_PATH, `${token}.json`),
        JSON.stringify(tokenData),
        'utf-8'
    );
}


// NEW SESSIONING SYSTEM
// ? maybe move to new file later

let db_loaded = false;
let SESSIONS: TokenList = {};
let USER_MAP: SessionUserMap = {};

/**
 * Register a new cookie
 * @param cookie The cookie that will be sent to the user's browser
 * @param token The token which should be associated with the cookie
 */
export function RegisterNewSession(cookie: string, token: TokenV2) {
    if (!db_loaded) LoadTokenDatabase();

    SESSIONS[cookie] = token;

    if (USER_MAP[token.username] == undefined) USER_MAP[token.username] = [];
    
    USER_MAP[token.username].push(cookie);
    SaveTokenDatabase();
}


export function DeleteSession(cookie: string) {
    delete SESSIONS[cookie];
    SaveTokenDatabase();
}


export function DeleteAllUserSessions(username: string) {
    USER_MAP[username].forEach((token: string) => {
        delete SESSIONS[token];
    });
    SaveTokenDatabase();
}


export function GetTokenFromCookie(cookie: string): TokenV2 {
    if (!db_loaded) LoadTokenDatabase();
    
    return SESSIONS[cookie];
}


export function TokenExists(cookie: string): boolean {
    if (!db_loaded) LoadTokenDatabase();

    return SESSIONS[cookie] != undefined;
}


function SaveTokenDatabase() {
    if (ENABLE_DEBUG_LOGGING) L.debug('saving db...');

    const database = {
        sessions: SESSIONS,
        map: USER_MAP
    };
    
    writeFileSync(join(DATABASE_PATH, 'sessions.okayudb'), JSON.stringify(database), 'utf-8');
}


function LoadTokenDatabase() {
    if (ENABLE_DEBUG_LOGGING) L.debug('loading db... (should only be done once)');

    if (!existsSync(join(DATABASE_PATH, 'sessions.okayudb'))) {
        if (ENABLE_DEBUG_LOGGING) L.debug('db doesn\'t exist yet so do nothing');
        db_loaded = true;
        return;
    }

    const database = JSON.parse(readFileSync(join(DATABASE_PATH, 'sessions.okayudb'), 'utf-8'));

    SESSIONS = database.sessions;
    USER_MAP = database.map;

    db_loaded = true;
}