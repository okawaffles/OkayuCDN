import { createTransport, } from 'nodemailer';
import { EMAIL_CONFIG } from './config';

export function CreateTransport() {
    return createTransport({
        host: EMAIL_CONFIG.endpoint,
        port: EMAIL_CONFIG.secure_port,
        secure: true,
        auth: {
            user: EMAIL_CONFIG.smtp_username,
            pass: EMAIL_CONFIG.smtp_password
        } 
    });
}