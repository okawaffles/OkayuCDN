import { Logger } from 'okayulogger';
import { TRANSPORT, VERIFICATION_EMAIL_HTML } from './config';

const L = new Logger('email (verify)');

export async function SendVerificationEmail(email: string, username: string, link: string) {
    const info = await TRANSPORT.sendMail({
        from: '"OkayuCDN" <noreply@okayucdn.com>',
        to: email,
        subject: '[OkayuCDN] Verify your email address',
        html: VERIFICATION_EMAIL_HTML.replace('$NAME', username).replace('$LINK', link),
    });

    L.info(`Verification email has been sent to ${email}. (${info.messageId})`);
}