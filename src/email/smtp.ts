import { createTransport, } from 'nodemailer';
import { EMAIL_CONFIG } from './config';

export function CreateTransport() {
    return createTransport({
        host: EMAIL_CONFIG.endpoint,

    });
}