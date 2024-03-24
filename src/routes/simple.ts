import { Router, version } from '../main';

/**
 * These are routes that don't change much, such as /home and /info.
 */
export function RegisterSimpleRoutes() {
    Router.get('/home', (req, res) => {
        res.render('home.ejs', {version});
    });
    Router.get('/info', (req, res) => {
        res.render('info.ejs');
    });
}