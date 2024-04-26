/*
    This file will manage the accounts page and its routes
*/

import { Request, Response } from 'express';
import { Router } from '../main';

export function RegisterAccountRoutes() {
    Router.get('/account', (req: Request, res: Response) => {
        res.render('account.ejs');
    });
}