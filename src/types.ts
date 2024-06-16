export interface OTPConfig {
    secret: string,
    setup?: {
        data: string
    }
}

export interface UserSecureData {
    password: string,
    password_salt: string,
    passwordIsLegacy: boolean,
    two_factor: boolean,
    twoFactorData?: {
        usesOTP: boolean,
        usesPasskey: boolean,
        OTPConfig?: OTPConfig,
        PasskeyConfig: unknown // i want to make this an actual data type sometime but thats so much work, help wanted!
    },
    IPHistory?: Array<string> // not going to require it since it's not THAT important + backwards compat
}

export enum LanguagesAvailable {
    EN_US,
    //JA_JP
}

export interface LocalUserSettings {
    language: LanguagesAvailable
}

export interface UserModel {
    username: string,
    userId: number,
    email: string,
    realname?: string,
    storageAmount: number,
    hasLargeStorage: boolean,
    preferences: LocalUserSettings,
    SecureData?: UserSecureData
}

export enum UploadResult {
    UPLOAD_OK,
    UPLOAD_FAILED_UNKNOWN,
    UPLOAD_FAILED_STORAGE,
    UPLOAD_FAILED_DISABLED,
    UPLOAD_FAILED_AUTHORIZATION,
    UPLOAD_FAILED_SANITIZER
}

export interface ContentItem {
    name: string,
    size: number,
    date: number
}

export interface StorageData {
    used: number,
    total: number,
    content: Array<ContentItem>,
    protected_files: Array<string>
}

export interface ShortenedLink {
    user: string,
    content: string,
    isViewPage: boolean,
}

export interface ShortenedLinksList {
    [key: string]: ShortenedLink
}

export enum TokenType {
    TOKEN_TYPE_USER, // a user's login token
    TOKEN_TYPE_AUTHORIZATION // an authorized app which holds extra info
}

export interface TokenV2 {
    username: string
    tokenType: TokenType
    authorizedAppId?: number // only used if a token is for an authorization, such as the desktop app
    intents: AuthorizationIntents
}

export interface AuthorizationIntents {
    canUseWebsite?: boolean // is this token allowed to authorize the website?
    canUseDesktop?: boolean // is this token allowed to authorize the desktop app?
    canGetStorage?: boolean // can this token be used to get the user's storage info?
    canViewPublicItems?: boolean // can this token be used to view user's public box items?
    canViewPrivateItems?: boolean // can this token be used to view user's privated box items?
    canChangeItemPrivacy?: boolean // can this token be used to change a box item to private or public?
    canDeleteItem?: boolean // can this token be used to delete mybox items?
    canUpload?: boolean // can this token be used to upload to the user's account?
    canChangeAccountOptions?: boolean // can this token be used to change a user's security/account info?   
}

export interface IPBan {
    user?: string,
    reason: string,
}

export interface IPBanList {
    [key: string]: IPBan
}