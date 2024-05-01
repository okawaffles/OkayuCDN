/*
    This file will manage the accounts page and its routes
*/

import { Request, Response } from 'express';
import { Router } from '../main';
import { ValidateToken } from '../util/sanitize';
import { PrefersLogin } from '../util/secure';

export function RegisterAccountRoutes() {
    Router.get('/account', ValidateToken(), PrefersLogin, (req: Request, res: Response) => {
        res.render('account.ejs');
    });
}