import { existsSync, mkdirSync } from 'node:fs';
import { BASE_DIRNAME, ENABLE_DEBUG_LOGGING } from '../main';
import { paths } from '../main';
import { join } from 'node:path';
import { debug } from 'okayulogger';


export let DATABASE_PATH: string = '';
export let UPLOADS_PATH: string = '';
export let USER_DATABASE_PATH: string = '';
export let TOKEN_DATABASE_PATH: string = '';
export let APPLICATION_DATABASE_PATH: string = '';

/**
 * Set up path variables and ensure all paths exist.
 */
export function PreparePaths() {
    // If paths are relative, we want to join them with the main's `__dirname`,
    // otherwise, we will just append a blank string.
    const AppendedDirname: string = paths.paths_are_relative?BASE_DIRNAME:'';

    DATABASE_PATH = join(AppendedDirname, paths.DATABASE);
    UPLOADS_PATH = join(AppendedDirname, paths.UPLOADS);
    USER_DATABASE_PATH = join(DATABASE_PATH, 'users');
    TOKEN_DATABASE_PATH = join(DATABASE_PATH, 'tokens');
    APPLICATION_DATABASE_PATH = join(DATABASE_PATH, 'applications');
    if (ENABLE_DEBUG_LOGGING) debug('paths', `DATABASE_PATH will be exported as ${DATABASE_PATH}`);
    if (ENABLE_DEBUG_LOGGING) debug('paths', `UPLOADS_PATH will be exported as ${UPLOADS_PATH}`);
    if (ENABLE_DEBUG_LOGGING) debug('paths', `USER_DATABASE_PATH will be exported as ${USER_DATABASE_PATH}`);
    if (ENABLE_DEBUG_LOGGING) debug('paths', `TOKEN_DATABASE_PATH will be exported as ${TOKEN_DATABASE_PATH}`);
    if (ENABLE_DEBUG_LOGGING) debug('paths', `APPLICATION_DATABASE_PATH will be exported as ${APPLICATION_DATABASE_PATH}`);

    // ensure these paths exist
    if (!existsSync(DATABASE_PATH)) mkdirSync(DATABASE_PATH, {recursive: true});
    if (!existsSync(UPLOADS_PATH)) mkdirSync(UPLOADS_PATH, {recursive: true});
    if (!existsSync(USER_DATABASE_PATH)) mkdirSync(USER_DATABASE_PATH, {recursive: true});
    if (!existsSync(TOKEN_DATABASE_PATH)) mkdirSync(TOKEN_DATABASE_PATH, {recursive: true});
    if (!existsSync(APPLICATION_DATABASE_PATH)) mkdirSync(APPLICATION_DATABASE_PATH, {recursive: true});
}