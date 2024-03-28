// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request, Response } from 'express';
import { error } from 'okayulogger';
import { cookie, header, body, query, param, validationResult } from 'express-validator';

export const ValidateContentRequest = () => [
    param('user').notEmpty().escape(),
    param('item').notEmpty().escape()
];

export const ValidateToken = () => cookie('token').notEmpty().escape().isLength({min:32,max:32});
export const ValidateHeaderToken = () => header('authorization').notEmpty().escape().isLength({min:32,max:32});
export const ValidateLoginGET = () => [
    query('redir').optional().escape().optional(),
];
export const ValidateLoginPOST = () => [
    body('username').notEmpty().escape(),
    body('password').notEmpty().escape()
];

export const ValidateUploadPOST = () => [
    body('filename').notEmpty().escape().isLength({min:1,max:50})
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