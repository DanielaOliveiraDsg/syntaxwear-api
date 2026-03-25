import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { fastify } from '../src/app';
import { prisma } from '../src/utils/prisma';

describe('Auth Login', () => {
  const testEmails: string[] = [];
  const testPassword = 'Password123!';

  beforeAll(async () => {
    // Register a test user to be used in login tests
    const email = `login-test-${Date.now()}@example.com`;
    testEmails.push(email);

    await fastify.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email,
        password: testPassword,
        firstName: 'Login',
        lastName: 'Tester',
      },
    });
  });

  afterAll(async () => {
    // Cleanup: remove all users created during tests
    if (testEmails.length > 0) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: testEmails,
          },
        },
      });
    }
  });

  it('should login successfully with correct credentials', async () => {
    const email = testEmails[0];

    const response = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email,
        password: testPassword,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('token');
    expect(body.user).toMatchObject({
      email,
      firstName: 'Login',
      lastName: 'Tester',
    });
  });

  it('should return error for incorrect password', async () => {
    const email = testEmails[0];

    const response = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email,
        password: 'WrongPassword!',
      },
    });

    // We expect 401 based on the schema, but let's see what the implementation returns
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.payload);
    expect(body.message).toMatch(/invalid/i);
  });

  it('should return error for non-existent email', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'nonexistent@example.com',
        password: testPassword,
      },
    });

    // We expect 401 or 404, schema says 401 for unauthorized
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.payload);
    expect(body.message).toMatch(/not found|invalid/i);
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: testEmails[0],
        // password is missing
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.message).toMatch(/validation/i);
  });
});
