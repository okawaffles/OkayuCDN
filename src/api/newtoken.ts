import { AuthorizationIntents } from '../types';

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

