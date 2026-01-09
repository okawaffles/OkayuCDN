const boot_start_time = new Date().getTime();

import express, { Express, static as staticFiles } from 'express';
import { Logger, debug } from 'okayulogger';
import { join } from 'node:path';
import { RegisterRoutes } from './routes';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';

/* load various config settings */
// make sure config exists!
if (!existsSync(join(__dirname, '..', 'config.json'))) {
    debug('preload', 'no config was present, copying example to default');
    copyFileSync(join(__dirname, '..', 'config.json.example'), join(__dirname, '..', 'config.json')); 
}

export const { 
    paths, 
    domain, 
    announcement, 
    admins, 
    version_include_git_commit, 
    ENABLE_ACCOUNT_CREATION, ENABLE_UPLOADING, ENABLE_USE_OF_EMAIL_FEATURES, ENABLE_DEBUG_LOGGING, DISABLE_RATE_LIMITING,
    email,
    forwarding,
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
    L.warn('Email features are on. This is highly experimental.');
    if (!process.env.EMAIL_SMTP_USER_NAME || !process.env.EMAIL_SMTP_PASSWORD) {
        L.error('Missing email ENV variables. Email setup will not be executed. This can cause issues!!');
    } else SetUpMailConfig();
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

import cors from 'cors';

const origins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

Router.use(cors({
    origin: origins,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Authorization','Content-Type'],
    // credentials: true, // <- only if you start using cookies
}));

// Make sure preflight hits the same CORS config
Router.options(/.*/, cors({
    origin: origins,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Authorization','Content-Type'],
    // credentials: true,
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
import { SetUpQuickTransfer } from './api/quicktransfer';
import { createServer } from 'node:http';
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

if (DISABLE_RATE_LIMITING && process.env.NODE_ENV != 'development') {
    L.fatal('! YOU HAVE RATE LIMITING DISABLED !');
    L.fatal('OkayuCDN will not start unless NODE_ENV is set to development.');
    L.fatal('You should not be using the DISABLE_RATE_LIMITING option on a production instance.');
    process.exit();
}

if (!DISABLE_RATE_LIMITING) {
    Router.use(limiter);
} else L.warn('Rate limiting is disabled! Do not use this option in production.');

if (ENABLE_DEBUG_LOGGING) debug('init', 'express configured OK');

// this handles logging requests
RegisterRequestLogger();
Router.use(CheckIP);

/* routes.ts will manage loading all routes */
RegisterRoutes();

export const SERVER = createServer(Router);

// set up the websocket handlers for quick transfer!
SetUpQuickTransfer();

const boot_end_time = new Date().getTime();
L.info(`Startup finished in ${boot_end_time - boot_start_time}ms`);

// this will be run after registering all routes
SERVER.listen(port).on('listening', () => {
    const listen_end_time = new Date().getTime();
    if (ENABLE_DEBUG_LOGGING) L.debug('hello world!');
    L.info(`Listening on port ${port}! (took ${listen_end_time - boot_start_time}ms)`);
});