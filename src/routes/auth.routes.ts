import { FastifyInstance } from "fastify";
import { login, register } from "../controllers/auth.controller";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", {
    schema: {
      tags: ['Auth'],
      description: 'Register a new user and returns a JWT token',
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address'},
          password: { type: 'string', minLength: 6, description: 'User password' },
          firstName: { type: 'string', description: 'User first name'},
          lastName: { type: 'string', description: 'User last name'},
          phone: { type: 'string', description: 'User phone number'},
          birthDate: { type: 'string', format: 'date', description: 'User birth date'},
        }
      },
      response: {
        201: {
          description: 'Successful registration',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string', format: 'email' },
                firstName: { type: 'string' },
                lastName: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true },
                birthDate: { type: 'string', format: 'date', nullable: true },
                role: { type: 'string', enum: ['USER', 'ADMIN'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              }
            },
            token: { type: 'string', description: 'JWT token' }
          }
        },
        400: {
          description: 'Bad Request',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        409: {
          description: 'Conflict - User already exists',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, register)

  fastify.post("/login", {
    schema: {
      tags: ['Auth'],
      description: 'Login an existing user and returns a JWT token',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address'},
          password: { type: 'string', description: 'User password' }
        }
      },
      response: {
        200: {
          description: 'Successful login',
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string', format: 'email' },
                firstName: { type: 'string' },
                lastName: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true },
                birthDate: { type: 'string', format: 'date', nullable: true },
                role: { type: 'string', enum: ['USER', 'ADMIN'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              }
            },
            token: { type: 'string', description: 'JWT token' }
          }
        },
        400: {
          description: 'Bad Request',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: {
          description: 'Unauthorized - Invalid credentials',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, login)
}