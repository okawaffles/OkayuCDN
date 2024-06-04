import { AuthorizationIntents, TokenType, TokenV2 } from '../types';

const authorizedIntentsBits: {[key in keyof AuthorizationIntents]: number} = {
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