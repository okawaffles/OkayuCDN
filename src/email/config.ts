import { readFileSync } from 'node:fs';
import { BASE_DIRNAME, email } from '../main';
import { CreateTransport } from './smtp';
import { Transporter } from 'nodemailer';
import { join } from 'node:path';

export interface EmailConfig {
    endpoint: string,
    secure_port: number,
    smtp_username: string,
    smtp_password: string,
}

export let EMAIL_CONFIG: EmailConfig;

export let TRANSPORT: Transporter;

export let VERIFICATION_EMAIL_HTML: string;


export function SetUpMailConfig() {
    EMAIL_CONFIG = {
        endpoint: email.endpoint,
        secure_port: email.port,
        smtp_username: <string> process.env.EMAIL_SMTP_USER_NAME,
        smtp_password: <string> process.env.EMAIL_SMTP_PASSWORD
    };

    TRANSPORT = CreateTransport();

    // have to go one back because its in the /dist folder
    VERIFICATION_EMAIL_HTML = readFileSync(join(BASE_DIRNAME, '..', 'views', 'assets', 'email', 'verify.html'), 'utf-8');
}