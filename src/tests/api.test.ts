import { join } from 'node:path';
import { describe } from 'node:test';
import request from 'supertest';

const SERVER_URL = 'http://localhost:2773';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CONFIG = require(join(__dirname, '..', '..', 'config.json'));

// it('should ', async () => {
//     const response = await request(SERVER_URL).get('');
//     expect(response.status).toBe();

describe('API API', () => {
    it('should Return Good Health', async () => {
        const response = await request(SERVER_URL).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('health', 'OK');
    });
    it('should return 409 for claimed username', async () => {
        const response = await request(SERVER_URL).get(`/api/username?username=${CONFIG.test.content.username}`);
        expect(response.status).toBe(409);
    });
    it('should return 204 for unclaimed username', async () => {
        const response = await request(SERVER_URL).get('/api/username?username=nottacobella3');
        expect(response.status).toBe(204);
    });
    it('should return 200 for successful signup', async () => {
        const response = await request(SERVER_URL).post('/api/signup').type('form').send({username: 'tacobelle3',password:'CatGirls:333',realname:'Belle',email:'baubau@fuwamoco.com'});
        expect(response.status).toBe(200);
    });
});