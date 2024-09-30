import { Logger } from 'okayulogger';
import { TRANSPORT, RESET_EMAIL_HTML } from './config';

const L = new Logger('email (verify)');

export async function SendPasswordResetEmail(email: string, username: string, link: string) {
    const info = await TRANSPORT.sendMail({
        from: '"OkayuCDN" <noreply@okayucdn.com>',
        to: email,
        subject: '[OkayuCDN] Reset your password',
        html: RESET_EMAIL_HTML.replace('$NAME', username).replace('$LINK', link),
    });

    L.info(`Verification email has been sent to ${email}. (${info.messageId})`);
}