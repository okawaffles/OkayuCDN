import { Logger } from 'okayulogger';
import { TRANSPORT } from './config';

const L = new Logger('email (verify)');


export async function SendVerificationEmail(email: string) {
    const info = await TRANSPORT.sendMail({
        from: '"OkayuCDN" <noreply@okayucdn.com>',
        to: email,
        subject: '[OkayuCDN] Verify your email address',
        html: '<img src="https://okayucdn.com/assets/images/logo.png" /><h1>Welcome to OkayuCDN!</h1><h3>Please verify your email address here:</h3><br/><br/><p>Some link goes here</p>',
    });

    L.info(`Verification email has been sent to ${email}. (${info.messageId})`);
}