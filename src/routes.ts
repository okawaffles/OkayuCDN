import { Router, BASE_DIRNAME } from './main';
import { Request, Response } from 'express';
import { join } from 'node:path';

export function RegisterRoutes() {
    Router.get('/', (req: Request, res: Response) => {
        res.render('landing/okayu.ejs'); // this may need to be changed later
    });
}