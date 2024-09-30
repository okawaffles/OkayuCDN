import { readFileSync } from 'node:fs';
import { BASE_DIRNAME, email, ENABLE_DEBUG_LOGGING } from '../main';
import { CreateTransport } from './smtp';
import { Transporter } from 'nodemailer';
import { join } from 'node:path';
import { debug } from 'okayulogger';

export interface EmailConfig {
    endpoint: string,
    secure_port: number,
    smtp_username: string,
    smtp_password: string,
}

export let EMAIL_CONFIG: EmailConfig;

export let TRANSPORT: Transporter;

export let VERIFICATION_EMAIL_HTML: string;
export let RESET_EMAIL_HTML: string;


export function SetUpMailConfig() {
    EMAIL_CONFIG = {
        endpoint: email.endpoint,
        secure_port: email.port,
        smtp_username: <string> process.env.EMAIL_SMTP_USER_NAME,
        smtp_password: <string> process.env.EMAIL_SMTP_PASSWORD
    };
    if (ENABLE_DEBUG_LOGGING) debug('mail', `endpoint: ${EMAIL_CONFIG.endpoint}:${EMAIL_CONFIG.secure_port}`);
    if (ENABLE_DEBUG_LOGGING) debug('mail', `EMAIL_SMTP_USER_NAME=${EMAIL_CONFIG.smtp_username.substring(0, 3)}*** : EMAIL_SMTP_PASSWORD=${EMAIL_CONFIG.smtp_password.substring(0, 3)}***`);

    TRANSPORT = CreateTransport();

    // have to go one back because its in the /dist folder
    VERIFICATION_EMAIL_HTML = readFileSync(join(BASE_DIRNAME, '..', 'views', 'assets', 'email', 'verify.html'), 'utf-8');
    RESET_EMAIL_HTML = readFileSync(join(BASE_DIRNAME, '..', 'views', 'assets', 'email', 'reset_passwd.html'), 'utf-8');
}