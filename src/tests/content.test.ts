import { join } from 'node:path';
import { describe } from 'node:test';
import request from 'supertest';

const SERVER_URL = 'http://localhost:2773';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CONFIG = require(join(__dirname, '..', '..', 'config.json'));

describe('Content API', () => {
    // Raw content
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

    // Viewpage
    it('should return 200 for found content', async () => {
        const response = await request(SERVER_URL).get(`/@${CONFIG.test.content.username}/${CONFIG.test.content.file}`);
        expect(response.status).toBe(200);
    });
    it('should return 404 for nonexistent viewpage', async () => {
        const response = await request(SERVER_URL).get(`/view/@${CONFIG.test.content.username}/__NONEXISTENTFILE__.png`);
        expect(response.status).toBe(404);
    });

    it('should return 401 for protected viewpage', async () => {
        const response = await request(SERVER_URL).get(`/view/@${CONFIG.test.content.username}/${CONFIG.test.content.protected_file}`);
        expect(response.status).toBe(401);
    });
    
    // Short URLs
    let short_url: string;
    it('should be able to create short links', async () => {
        const response = await request(SERVER_URL).get(`/api/shorturl/${CONFIG.test.content.username}/${CONFIG.test.content.file}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        short_url = response.body.id;
    });

    it('should be able to open a valid short link', async () => {
        const response = await request(SERVER_URL).get(`/.${short_url}`);
        expect(response.status).toBe(302);
    });

    it('should not be able to open invalid short links', async () => {
        const response = await request(SERVER_URL).get('/.ABCDEF');
        expect(response.status).toBe(404);
        expect(response.text).toBe('This shortened link has expired. Please ask the sender to create a new link.'); 
    });
    it('should be able to handle mp4 range streaming', async () => {
        const response = await request(SERVER_URL).get(`/@${CONFIG.test.content.username}/${CONFIG.test.content.mp4_file}/stream`);
        expect([200, 206]).toContain(response.status); // ! this allows us to check either 200 or 206 (both are accepted response codes)
    });
    it('should return 400 for a non-video stream request', async () => {
        const response = await request(SERVER_URL).get(`/@${CONFIG.test.content.username}/${CONFIG.test.content.file}/stream`);
        expect(response.status).toBe(400);
    });
});