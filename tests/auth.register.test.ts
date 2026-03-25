import { describe, it, expect, afterAll } from 'vitest';
import { fastify } from '../src/app';
import { prisma } from '../src/utils/prisma';

describe('Auth Register', () => {
  const testEmails: string[] = [];

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

  it('should register a new user successfully', async () => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    testEmails.push(email);

    const response = await fastify.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email,
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('token');
    expect(body.user).toMatchObject({
      email,
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('should return 409 when email is already registered', async () => {
    const timestamp = Date.now();
    const email = `duplicate-${timestamp}@example.com`;
    testEmails.push(email);

    // Register first user
    await fastify.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email,
        password: 'Password123!',
        firstName: 'First',
        lastName: 'User',
      },
    });

    // Try to register with same email
    const response = await fastify.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email,
        password: 'AnotherPassword123!',
        firstName: 'Second',
        lastName: 'User',
      },
    });

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.payload);
    expect(body.message).toMatch(/already exists/i);
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: `missing-${Date.now()}@example.com`,
        // password, firstName, and lastName are missing
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.message).toMatch(/validation/i);
  });
});
