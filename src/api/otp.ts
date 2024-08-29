import * as speakeasy from 'speakeasy';
import { toDataURL } from 'qrcode';
import { OTPSetupOptions } from '../types';

export function GetOTPSetupOptions(username: string): OTPSetupOptions {
    const secretCode = speakeasy.generateSecret({
        name: `OkayuCDN (${username})`, 
    });

    return {
        otpauthUrl: <string> secretCode.otpauth_url,
        base32: secretCode.base32
    };
}

export function CheckOTP(token: string, secret: string): boolean {
    return speakeasy.totp.verify({secret, token});
}

export async function GenerateQRImage(data: string) {
    return await toDataURL(data);
}