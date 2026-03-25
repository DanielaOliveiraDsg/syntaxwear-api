import { FastifyInstance } from "fastify";
import { listOrders, getOrder, createOrderHandler, updateOrderHandler } from "../controllers/orders.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

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
            status: { type: "string", enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED", "DELIVERED"] },
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

  // POST /orders - Create a new order
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Orders"],
        description: "Create a new order",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["items", "shippingAddress", "paymentMethod"],
          properties: {
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "number"},
                  size: { type: "string" },
                },
              },
            },
            shippingAddress: {
              type: "object",
              required: ["zipcode", "street", "number", "city", "state", "country"],
              properties: {
                zipcode: { type: "string" },
                street: { type: "string" },
                number: { type: "string" },
                complement: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                country: { type: "string" },
              },
            },
            paymentMethod: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Order created successfully",
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
        },
      },
    },
    createOrderHandler
  );

  // PATCH /orders/:id - Update order status
  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Orders"],
        description: "Update order status",
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
            status: { type: "string", enum: ["PENDING", "PAID", "SHIPPED", "CANCELLED", "DELIVERED"] },
            shippingAddress: {
              type: "object",
              properties: {
                zipcode: { type: "string" },
                street: { type: "string" },
                number: { type: "string" },
                complement: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                country: { type: "string" },
              },
            },
          },
        },
        response: {
          200: {
            description: "Order updated successfully",
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
                  },
                },
              },
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
    updateOrderHandler
  );
}