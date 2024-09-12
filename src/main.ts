import express, { Express, static as staticFiles } from 'express';
import { Logger, debug } from 'okayulogger';
import { join } from 'node:path';
import { RegisterRoutes } from './routes';

/* load various config settings */
export const { 
    paths, 
    domain, 
    announcement, 
    admins, 
    version_include_git_commit, 
    ENABLE_ACCOUNT_CREATION, ENABLE_UPLOADING, ENABLE_USE_OF_EMAIL_FEATURES, ENABLE_DEBUG_LOGGING,
    email 
// eslint-disable-next-line @typescript-eslint/no-var-requires
} = require(join(__dirname, '..', 'config.json'));
if (ENABLE_DEBUG_LOGGING) debug('preload', 'exported config variables loaded successfully');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { port, DISABLE_ASCII_ART } = require(join(__dirname, '..', 'config.json'));
if (ENABLE_DEBUG_LOGGING) debug('preload', 'local config variables loaded successfully');

export const BASE_DIRNAME: string = __dirname;
if (ENABLE_DEBUG_LOGGING) debug('preload', `BASE_DIRNAME will be exported as ${BASE_DIRNAME}`);

import { PreparePaths } from './util/paths';
PreparePaths(); // called to prepare exported paths

// eslint-disable-next-line @typescript-eslint/no-var-requires
export let { version } = require(join(__dirname, '..', 'package.json')); // maybe change later...
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (version_include_git_commit) version = `${version} (${require('child_process').execSync('git rev-parse HEAD').toString().trim().slice(0, 7)})`;
if (ENABLE_DEBUG_LOGGING) debug('preload', `loaded OkayuCDN version: ${version}`);

// ascii art isn't necessary but i think its a nice touch
import { readFileSync } from 'node:fs';
const asciiart: string = readFileSync(join(__dirname, '..', 'asciiart.txt'), 'utf-8');
if (!DISABLE_ASCII_ART) console.log(asciiart);


const L: Logger = new Logger('main');
L.info('Starting OkayuCDN...');

if (process.argv[0].includes('bun')) L.warn('Bun support is not guaranteed. It is recommended that you use NodeJS until it is guaranteed 100% support.');


/* load env variables */
import {config} from 'dotenv';
import { CreateNewToken } from './util/secure';
config({path:join(__dirname, '..', '.ENV')});
if (ENABLE_DEBUG_LOGGING) debug('init', 'environment variables loaded successfully');
if (!process.env.SESSION_SECRET) process.env.SESSION_SECRET = CreateNewToken();

import { SetUpMailConfig } from './email/config';
if (ENABLE_USE_OF_EMAIL_FEATURES) { 
    // TODO: Check if variables are missing
    if (ENABLE_DEBUG_LOGGING) debug('init', 'email is on, checking for missing variables is not present.');
    L.warn('Email features are on. This is highly experimental.');
    SetUpMailConfig();
}


/* configure the server */
if (ENABLE_DEBUG_LOGGING) debug('init', 'configuring express...');
export const Router: Express = express();

Router.set('view engine', 'ejs');
Router.use('/assets', staticFiles(join(__dirname, '..', 'views' , 'assets'))); // may need to be changed

import CookieParser from 'cookie-parser';
Router.use(CookieParser());


// sorry. it works i guess.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const session = require('cookie-session');
// import Session from 'cookie-session';
import { RegisterRequestLogger } from './util/requestinfo';
Router.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    name:'okayu-session',
    cookie: {
        secure: true
    }
}));

import { csrf, xssProtection } from 'lusca';
Router.use(csrf({allowlist:[
    'http://localhost:2773',
    'https://okayucdn.com',
    domain
]}), xssProtection());

import {urlencoded} from 'body-parser';
Router.use(urlencoded({extended:true}));

import { rateLimit } from 'express-rate-limit';
import { IsUpload, RateLimitHandler } from './routes/api';
import { LoadIPs, CheckIP } from './util/ipManage';
LoadIPs();
const limiter = rateLimit({
    windowMs: 5*60*1000, // 5 minutes
    limit: 100, // 100 requests
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: RateLimitHandler,
    skip: IsUpload,
});
Router.set('trust proxy', 1);

Router.use('*', limiter);

if (ENABLE_DEBUG_LOGGING) debug('init', 'express configured OK');

// this handles logging requests
RegisterRequestLogger();
Router.use('*', CheckIP);

/* routes.ts will manage loading all routes */
RegisterRoutes();

// this will be run after registering all routes
Router.listen(port).on('listening', () => {
    if (ENABLE_DEBUG_LOGGING) L.debug('hello world!');
    L.info(`Listening on port ${port}!`);
});