import { email } from '../main';
import { CreateTransport } from './smtp';
import { Transporter } from 'nodemailer';

export interface EmailConfig {
    endpoint: string,
    secure_port: number,
    smtp_username: string,
    smtp_password: string,
}

export let EMAIL_CONFIG: EmailConfig;

export let TRANSPORT: Transporter;

export function SetUpMailConfig() {
    EMAIL_CONFIG = {
        endpoint: email.endpoint,
        secure_port: email.port,
        smtp_username: <string> process.env.EMAIL_SMTP_USER_NAME,
        smtp_password: <string> process.env.EMAIL_SMTP_PASSWORD
    };

    TRANSPORT = CreateTransport();
}