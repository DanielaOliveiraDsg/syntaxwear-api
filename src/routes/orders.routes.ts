import { FastifyInstance } from "fastify";
import { listOrders, getOrder } from "../controllers/orders.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authMiddleware);

  // GET /orders - List orders for the authenticated user
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Orders"],
        description: "List orders for the authenticated user",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1, default: 1 },
            limit: { type: "number", minimum: 1, default: 10 },
            status: { type: "string", enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED"] },
          },
        },
        response: {
          200: {
            description: "Successful response",
            type: "object",
            properties: {
              orders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    userId: { type: "string" },
                    status: { type: "string" },
                    total: { type: "number" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          productId: { type: "string" },
                          quantity: { type: "number" },
                          unitPrice: { type: "number" },
                          totalPrice: { type: "number" },
                          product: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              slug: { type: "string" },
                              images: { type: "array", items: { type: "string" } },
                            },
                          },
                        },
                      },
                    },
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
              error: { type: "string" },
            },
          },
        },
      },
    },
    listOrders
  );

  // GET /orders/:id - Get a specific order by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Orders"],
        description: "Get a specific order by ID",
        security: [{ bearerAuth: [] }],
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
              userId: { type: "string" },
              status: { type: "string" },
              total: { type: "number" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                },
              },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    productId: { type: "string" },
                    quantity: { type: "number" },
                    unitPrice: { type: "number" },
                    totalPrice: { type: "number" },
                    product: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        slug: { type: "string" },
                        description: { type: "string" },
                        price: { type: "number" },
                        images: { type: "array", items: { type: "string" } },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Unauthorized",
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
    getOrder
  );
}
