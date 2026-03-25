import { FastifyInstance } from "fastify";
import { getCategory, listCategories, createNewCategory, updateCategory, removeCategory } from "../controllers/categories.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { CategoryFilter, CreateCategoryType, UpdateCategoryType } from "../types/index.js";

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: CategoryFilter }>(
    "/",
    {
      schema: {
        tags: ["Categories"],
        description: "List categories with optional filters",
        querystring: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            search: { type: "string" },
            active: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Successful response",
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    description: { type: "string", nullable: true },
                    active: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
              meta: {
                type: "object",
                properties: {
                  total: { type: "number" },
                  page: { type: "number" },
                  limit: { type: "number" },
                  totalPages: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    listCategories
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        tags: ["Categories"],
        description: "Get a category by ID",
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Successful response",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string", nullable: true },
              active: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              _count: {
                type: "object",
                properties: {
                  products: { type: "number" },
                },
              },
            },
          },
          404: {
            description: "Not Found",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    getCategory
  );

  fastify.post<{ Body: CreateCategoryType }>(
    "/",
    {
      onRequest: [authMiddleware, adminMiddleware],
      schema: {
        tags: ["Categories"],
        description: "Create a new category",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name", "slug"],
          properties: {
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string", nullable: true },
            active: { type: "boolean" },
          },
        },
        response: {
          201: {
            description: "Category created successfully",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string", nullable: true },
              active: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
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
            description: "Unauthorized",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          403: {
            description: "Forbidden. Admin access required.",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    createNewCategory
  );

  fastify.put<{ Params: { id: string }; Body: UpdateCategoryType }>(
    "/:id",
    {
      onRequest: [authMiddleware, adminMiddleware],
      schema: {
        tags: ["Categories"],
        description: "Update an existing category",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string", nullable: true },
            active: { type: "boolean" },
          },
        },
        response: {
          200: {
            description: "Category updated successfully",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string", nullable: true },
              active: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
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
            description: "Unauthorized",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          403: {
            description: "Forbidden. Admin access required.",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          404: {
            description: "Not Found",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    updateCategory
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [authMiddleware, adminMiddleware],
      schema: {
        tags: ["Categories"],
        description: "Delete a category by ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        response: {
          204: {
            description: "Category deleted successfully",
            type: "null",
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
            description: "Unauthorized",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          403: {
            description: "Forbidden. Admin access required.",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          404: {
            description: "Not Found",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    removeCategory
  );
}