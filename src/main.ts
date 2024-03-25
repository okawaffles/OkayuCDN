import express, { Express, static as staticFiles } from 'express';
import { Logger } from 'okayulogger';
import { join } from 'node:path';
import { RegisterRoutes } from './routes';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { port, version } = require(join(__dirname, 'config.json'));
export const BASE_DIRNAME: string = __dirname;


const L: Logger = new Logger('main');
L.info('Starting OkayuCDN...');
L.warn('The TypeScript rewrite is UNFINISHED! You should not use the typescript files unless you are a developer/tester.');


/* load env variables */
import {config} from 'dotenv';
config({path:join(__dirname, '.ENV')});
if (!process.env.SECRET) process.env.SECRET = 'abcdef'; // replace this later.


/* configure the server */
export const Router: Express = express();

Router.set('view engine', 'ejs');
Router.use('/assets', staticFiles(join(__dirname, '../views/assets'))); // may need to be changed

import CookieParser = require('cookie-parser');
Router.use(CookieParser());

import Session from 'express-session';
import { RegisterRequestLogger } from './util/requestinfo';
Router.use(Session({secret:process.env.SECRET,resave:false,saveUninitialized:true}));



// this handles logging requests
RegisterRequestLogger();

/* routes.ts will manage loading all routes */
RegisterRoutes();

// this will be run after registering all routes
Router.listen(port).on('listening', () => {
    L.info(`Listening on port ${port}!`);
});