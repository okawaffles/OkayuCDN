// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request, Response } from 'express';
import { error } from 'okayulogger';
import { cookie, header, body, query, param, validationResult } from 'express-validator';

export const ValidateContentRequest = () => [
    param('username').notEmpty().escape(),
    param('item').notEmpty().escape(),
    query('bypass').escape().optional(),
    query('intent').escape().optional()
];

export const ValidateToken = () => cookie('token').notEmpty().escape().isLength({min:32,max:32});

export const ValidateTokenBothModes = () => [
    cookie('token').notEmpty().escape().isLength({min:32,max:32}).optional(),
    header('Authorization').notEmpty().escape().isLength({min:32,max:32}).optional()
];

export const ValidateOptionalToken = () => cookie('token').notEmpty().escape().isLength({min:32,max:32}).optional();
export const ValidateHeaderToken = () => header('Authorization').notEmpty().escape().isLength({min:32,max:32});
export const ValidateLoginGET = () => [
    query('redir').optional().escape().optional(),
];
export const ValidateLoginPOST = () => [
    body('username').notEmpty().escape().isAlphanumeric('en-US'),
    body('password').notEmpty().escape()
];

export const ValidateUploadPOST = () => [
    body('filename').notEmpty().escape().isLength({min:1,max:50}),
    body('extension').notEmpty().escape().isLength({min:1,max:25}),
];

export const ValidateOTP = () => [
    body('code').notEmpty().escape().isNumeric().isLength({min:6,max:6}),
    body('isSetup').optional().escape().isBoolean(),
    body('username').notEmpty().escape().isString().isAlphanumeric('en-US')
];

export const HandleBadRequest = (req: Request, res: Response, next: CallableFunction) => {
    if (!validationResult(req).isEmpty()) {
        error('sanitize', 'bad request, rejecting.');
        validationResult(req).array().forEach(item => {
            console.log(item);
        });
        res.status(400).render('err400.ejs');
        return;
    }

    next();
};

export const ValidateDeletionRequest = () => [
    body('id').notEmpty().escape()
];
export const ValidateAdminDeletionRequest = () => [
    body('item').notEmpty().escape(),
    body('username').notEmpty().isAlphanumeric('en-US').escape().isLength({min:6,max:25})
];

export const ValidatePasswordRequest = () => [
    body('new_password').notEmpty().escape(),
    body('current_password').notEmpty().escape()
];

export const ValidateUsernameCheck = () => [
    query('username').notEmpty().isAlphanumeric('en-US').escape().isLength({min:6,max:25})
];

export const ValidateSignupPOST = () => [
    body('username').notEmpty().isAlphanumeric('en-US').escape().isLength({min:6,max:25}),
    body('password').notEmpty().escape().isStrongPassword({minLength:8,minNumbers:2,minSymbols:2,minUppercase:2}),
    body('realname').notEmpty().escape(),
    body('email').notEmpty().escape().isEmail()
];

export const ValidateAdminStorageRequest = () => [
    query('username').notEmpty().escape().isAlphanumeric('en-US').isLength({min:6,max:25})
];

export const ValidateUploadChunk = () => [
    query('current_chunk').isNumeric().notEmpty().escape()
];

export const ValidateShortURL = () => [
    param('id').escape().notEmpty().isLength({min:6,max:6})
];

export const ValidateAuthorizationRequest = () => [
    query('appId').notEmpty().escape().isNumeric().isLength({min:1,max:16}),
    query('intents').notEmpty().escape().isNumeric()
];

export const ValidateAdminBanIP = () => [
    body('ip').notEmpty().escape(),
    body('reason').notEmpty().escape().optional()
];