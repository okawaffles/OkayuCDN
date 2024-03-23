import express, { Express, Request, Response, static as staticFiles } from "express";
import { Logger } from 'okayulogger';
import { join } from 'node:path';
import { RegisterRoutes } from './routes';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { port } = require(join(__dirname, 'config.json'));
export const BASE_DIRNAME: string = __dirname;

const L: Logger = new Logger('main');
L.info('Starting OkayuCDN...');
L.warn('The TypeScript rewrite is UNFINISHED! You should not use the typescript files unless you are a developer/tester.');

/* configure the server */
export const Router: Express = express();

Router.set('view engine', 'ejs');
Router.use('/assets', staticFiles(join(__dirname, '../views/assets'))); // may need to be changed


/* routes.ts will manage loading all routes */
RegisterRoutes();


Router.listen(port).on('listening', () => {
    L.info(`Listening on port ${port}!`);
});