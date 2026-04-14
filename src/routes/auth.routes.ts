import { FastifyInstance } from "fastify";
import {
  googleLogin,
  login,
  logout,
  profile,
  register,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Auth"],
        description: "Register a new user and returns a JWT token",
        body: {
          type: "object",
          required: ["email", "password", "firstName", "lastName"],
          properties: {
            email: { type: "string", description: "User email address" },
            password: { type: "string", description: "User password" },
            firstName: { type: "string", description: "User first name" },
            lastName: { type: "string", description: "User last name" },
            phone: { type: "string", description: "User phone number" },
            birthDate: { type: "string", description: "User birth date" },
          },
        },
        response: {
          201: {
            description: "Successful registration",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string", format: "email" },
                  firstName: { type: "string" },
                  lastName: { type: "string", nullable: true },
                  phone: { type: "string", nullable: true },
                  birthDate: { type: "string", format: "date", nullable: true },
                  role: { type: "string", enum: ["USER", "ADMIN"] },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              token: { type: "string", description: "JWT token" },
            },
          },
          400: {
            description: "Bad Request",
            type: "object",
            properties: {
              message: { type: "string" },
              errors: {
                oneOf: [
                  { type: "object", additionalProperties: true },
                  {
                    type: "array",
                    items: { type: "object", additionalProperties: true },
                  },
                ],
              },
            },
            required: ["message"],
            additionalProperties: true,
          },
          409: {
            description: "Conflict - User already exists",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    register,
  );

  fastify.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["Auth"],
        description: "Login an existing user and returns a JWT token",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", description: "User email address" },
            password: { type: "string", description: "User password" },
          },
        },
        response: {
          200: {
            description: "Successful login",
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string", format: "email" },
                  firstName: { type: "string" },
                  lastName: { type: "string", nullable: true },
                  phone: { type: "string", nullable: true },
                  birthDate: { type: "string", format: "date", nullable: true },
                  role: { type: "string", enum: ["USER", "ADMIN"] },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
              token: { type: "string", description: "JWT token" },
            },
          },
          400: {
            description: "Bad Request",
            type: "object",
            properties: {
              message: { type: "string" },
              errors: {
                oneOf: [
                  { type: "object", additionalProperties: true },
                  {
                    type: "array",
                    items: { type: "object", additionalProperties: true },
                  },
                ],
              },
            },
            required: ["message"],
            additionalProperties: true,
          },
          401: {
            description: "Unauthorized - Invalid credentials",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    login,
  );

  fastify.get(
    "/profile",
    {
      preHandler: [authMiddleware], // protect this route with authentication middleware
      schema: {
        tags: ["Auth"],
        description: "Get the profile of the authenticated user",
        security: [{ cookieAuth: [] }],
      },
    },
    profile,
  );

  fastify.post(
    "/google-login",
    {
      schema: {
        tags: ["Auth"],
        description: "Login with Google and returns a JWT token",
        body: {
          type: "object",
          required: ["credential"],
          properties: {
            credential: { type: "string", description: "Google ID token" },
          },
        },
      },
    },
    googleLogin,
  );

  fastify.post(
    "/logout",
    {
      preHandler: [authMiddleware], // protect this route with authentication middleware
      schema: {
        tags: ["Auth"],
        description: "Logout the authenticated user by clearing the JWT cookie",
        security: [{ cookieAuth: [] }],
      },
    },
    logout,
  );
}
