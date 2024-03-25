import { BASE_DIRNAME } from '../main';
import { paths } from '../main';
import { join } from 'node:path';


export let DATABASE_PATH: string = '';
export let UPLOADS_PATH: string = '';

export function PreparePaths() {
    // If paths are relative, we want to join them with the main's `__dirname`,
    // otherwise, we will just append a blank string.
    const AppendedDirname: string = paths.paths_are_relative?'':BASE_DIRNAME;

    DATABASE_PATH = join(AppendedDirname, paths.DATABASE);
    UPLOADS_PATH = join(AppendedDirname, paths.UPLOADS);
}