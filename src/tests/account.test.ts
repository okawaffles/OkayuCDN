import { cpSync, existsSync, rmdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe } from 'node:test';
import request from 'supertest';

const SERVER_URL = 'http://localhost:2773';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CONFIG = require(join(__dirname, '..', '..', 'config.json'));

describe('Account API', () => {
    it('should return good health', async () => {
        const response = await request(SERVER_URL).get('/api/health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('health', 'OK');
    });

    // signup

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
                rmSync(join(USER_DB_PATH, 'demoUsername', 'private.json'));
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
    
    // login
    let auth_token: string;

    it('should return 200 and a token for a successful login', async () => {
        const response = await request(SERVER_URL).post('/api/login').type('form').send({
            username: 'demoUsername',
            password: 'CatGirls:333'
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');

        auth_token = response.body.token;
    });

    it('should return 401 for an invalid login', async () => {
        const response = await request(SERVER_URL).post('/api/login').type('form').send({username:'NotARealUser',password:'NotCatGirls:333'});
        expect(response.status).toBe(401);
    });

    // account info
    it('should return account information on an authenticated whoami call', async () => {
        const response = await request(SERVER_URL).get('/api/whoami').set('Cookie', `token=${auth_token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('username', 'demoUsername');
    });
    it('should not return account information on an unauthenticated whoami call', async () => {
        const response = await request(SERVER_URL).get('/api/whoami');

        expect(response.status).not.toBe(200);
    });

    // storage/mybox

    // keep this one first so we don't test /api/storage twice
    it('should be able to change item privacy', async () => {
        // need to copy a demo file first of all
        const CONTENT_PATH = join(__dirname, '..', '..', 'content', 'demoUsername');
        cpSync(join(__dirname, 'resource', 'file.png'), join(CONTENT_PATH, 'file.png'));
        
        // change its privacy
        const response = await request(SERVER_URL)
            .patch('/api/changeVisibility')
            .type('form')
            .set('Cookie', `token=${auth_token}`)
            .send({id:'file.png'});

        expect(response.statusCode).toBe(204);
    });
    it('should return valid storage information', async () => {
        // call /api/storage and see if it exists
        const response = await request(SERVER_URL).get('/api/storage').set('Cookie', `token=${auth_token}`);
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('used', 16276); // file.png is 16276 bytes
        expect(response.body).toHaveProperty('content[0].name', 'file.png'); // does it exist?
        expect(response.body).toHaveProperty('protected_files', ['file.png']); // is it private?
    });
    it('should be able to delete an item', async () => {
        const response = await request(SERVER_URL)
            .delete('/api/deleteItem')
            .type('form')
            .set('Cookie', `token=${auth_token}`)
            .send({id:'file.png'});

        expect(response.statusCode).toBe(204);
    });

    // updating account info
    it('should return 200 on a successful password change', async () => {
        const response = await request(SERVER_URL)
            .patch('/api/password')
            .set('Cookie', `token=${auth_token}`)
            .type('form')
            .send({current_password:'CatGirls:333',new_password:'NewCatGirls:333'});

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
    });
});