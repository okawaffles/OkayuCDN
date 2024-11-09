import { existsSync, rmdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe } from 'node:test';
import request from 'supertest';

const SERVER_URL = 'http://localhost:2773';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CONFIG = require(join(__dirname, '..', '..', 'config.json'));

describe('API API', () => {
    it('should return good health', async () => {
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
        // first delete the account if it already exists
        const USER_DB_PATH = join(__dirname, '..', '..', 'db', 'users');
        const CONTENT_PATH = join(__dirname, '..', '..', 'content');
        
        if (existsSync(join(USER_DB_PATH, 'demoUsername.json'))) {
            try {
                rmSync(join(USER_DB_PATH, 'demoUsername.json'));
                rmdirSync(join(CONTENT_PATH, 'demoUsername'), {recursive:true});
            } catch(e) {
                console.error(`unable to delete demoUsername.json and its PCI despite it existing? ${e}`);
            }
        }
        
        // re-create demo account
        const response = await request(SERVER_URL).post('/api/signup').type('form').send({username: 'demoUsername',password:'CatGirls:333',realname:'Bellers',email:'baubaubau@fuwamoco.com'});
        expect(response.status).toBe(200);
    });
    it('should return 409 for already existing account', async () => {
        const response = await request(SERVER_URL).post('/api/signup').type('form').send({username: CONFIG.test.content.username,password:'CatGirls:333',realname:'Belle',email:'baubau@fuwamoco.com'});
        expect(response.status).toBe(409);
    });
    
});