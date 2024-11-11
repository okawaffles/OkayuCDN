// import { existsSync, rmdirSync, rmSync } from 'node:fs';
// import { join } from 'node:path';
import { describe } from 'node:test';
import request from 'supertest';

const SERVER_URL = 'http://localhost:2773';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const CONFIG = require(join(__dirname, '..', '..', 'config.json'));

describe('simple API', () => {
    it('should return a status 500 error', async () => {
        const response = await request(SERVER_URL).get('/test').query({invokeError: 500});
        expect(response.status).toBe(500);
    });
    it('should return status 400 for bad request', async () => {
        const response = await request(SERVER_URL).get('/test').query({invokeError: '!400'});
        expect(response.status).toBe(400);
    });
});