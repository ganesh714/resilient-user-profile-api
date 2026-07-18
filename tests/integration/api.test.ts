import request from 'supertest';
import app from '../../src/app';
import pool from '../../src/config/database';

describe('API Integration Tests', () => {
    let createdUserId: string;
    const testEmail = `test_${Date.now()}@example.com`;

    afterAll(async () => {
        // Cleanup created user
        if (createdUserId) {
            await pool.execute('DELETE FROM users WHERE id = ?', [createdUserId]);
        }
        await pool.end();
    });

    it('should create a new user (POST /api/users)', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                name: 'Integration Test User',
                email: testEmail
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Integration Test User');
        expect(response.body.email).toBe(testEmail);
        
        createdUserId = response.body.id;
    });

    it('should reject creating a user with a duplicate email', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                name: 'Duplicate User',
                email: testEmail // Same email as above
            });

        expect(response.status).toBe(409);
        expect(response.body.errorCode).toBe('CONFLICT');
    });

    it('should get a user by id (GET /api/users/:id)', async () => {
        const response = await request(app)
            .get(`/api/users/${createdUserId}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdUserId);
        expect(response.body.name).toBe('Integration Test User');
    });

    it('should validate inputs (POST /api/users)', async () => {
        const response = await request(app)
            .post('/api/users')
            .send({
                name: '', // Invalid name
                email: 'not-an-email' // Invalid email
            });

        expect(response.status).toBe(400);
        expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should retrieve enriched user data with graceful degradation on failure', async () => {
        // By default, the mock service might succeed or fail depending on the env vars.
        // If it fails, we expect a 200 OK with enrichedDataStatus: 'unavailable'.
        // If it succeeds, we expect a 200 OK with enrichedDataStatus: 'available'.
        // Both are valid 200 responses.
        const response = await request(app)
            .get(`/api/users/${createdUserId}/enriched`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('enrichedDataStatus');
        expect(['available', 'unavailable']).toContain(response.body.enrichedDataStatus);
    }, 10000); // 10s timeout to allow for retries
});
