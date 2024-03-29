export interface OTPConfig {
    data: string
}

export interface UserSecureData {
    password: string,
    password_salt: string,
    passwordIsLegacy: boolean,
    two_factor: boolean,
    two_factor_data?: {
        usesOTP: boolean,
        usesPasskey: boolean,
        OTPConfig?: OTPConfig,
        PasskeyConfig: unknown // i want to make this an actual data type sometime but thats so much work
    } 
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
    size: number
}

export interface StorageData {
    used: number,
    total: number,
    content: Array<ContentItem>
}