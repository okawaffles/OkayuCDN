export interface OTPConfig {
    data: string
}

export interface UserSecureData {
    username: string,
    userId: number,
    password: string,
    passwordIsLegacy: boolean,
    two_factor: boolean,
    two_factor_data?: {
        usesOTP: boolean,
        usesPasskey: boolean,
        OTPConfig?: OTPConfig,
        PasskeyConfig: unknown // i want to make this an actual data type sometime but thats so much work
    } 
}

enum LanguagesAvailable {
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