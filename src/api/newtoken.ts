import { readFileSync, writeFileSync } from 'fs';
import { AuthorizationIntents, TokenType, TokenV2 } from '../types';
import { join } from 'path';
import { TOKEN_DATABASE_PATH } from '../util/paths';

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
        const intents = JSON.parse(readFileSync(join(TOKEN_DATABASE_PATH, `${token}.json`), 'utf-8')).intents;
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