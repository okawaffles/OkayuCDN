import { join } from 'node:path';
import { describe } from 'node:test';
import request from 'supertest';

const SERVER_URL = 'http://localhost:2773';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CONFIG = require(join(__dirname, '..', '..', 'config.json'));

describe('Content API', () => {
    it('should return 200 for found content', async () => {
        const response = await request(SERVER_URL).get(`/@${CONFIG.test.content.username}/${CONFIG.test.content.file}`);
        expect(response.status).toBe(200);
    });

    it('should return 404 for nonexistent content', async () => {
        const response = await request(SERVER_URL).get(`/@${CONFIG.test.content.username}/__NONEXISTENTFILE__.png`);
        expect(response.status).toBe(404);
    });

    it('should return 401 for protected content', async () => {
        const response = await request(SERVER_URL).get(`/@${CONFIG.test.content.username}/${CONFIG.test.content.protected_file}`);
        expect(response.status).toBe(401);
    });
});