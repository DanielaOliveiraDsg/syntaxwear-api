import { FastifyInstance } from "fastify";
import { getCategory, listCategories, createNewCategory } from "../controllers/categories.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export default async function categoryRoutes(fastify: FastifyInstance) {
  // fastify.addHook("onRequest", authMiddleware);

  fastify.get(
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
                    description: { type: "string" },
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
          401: {
            description: "Unauthorized",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    listCategories
  );

  fastify.get(
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
              description: { type: "string" },
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
          401: {
            description: "Unauthorized",
            type: "object",
            properties: {
              message: { type: "string" },
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

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Categories"],
        description: "Create a new category",
        body: {
          type: "object",
          required: ["name", "slug"],
          properties: {
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
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
              description: { type: "string" },
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
            },
          },
          401: {
            description: "Unauthorized",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    createNewCategory
  );
}
