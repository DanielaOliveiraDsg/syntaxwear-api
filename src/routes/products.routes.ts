import { FastifyInstance } from "fastify";
import {
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/products.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export default async function productRoutes(fastify: FastifyInstance) {
  // fastify.addHook("onRequest", authMiddleware);
  // get products
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        description: "List products with optional filters",
        querystring: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            minPrice: { type: "number" },
            maxPrice: { type: "number" },
            search: { type: "string" },
            sortBy: { type: "string", enum: ["price", "name", "createdAt"] },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
            categoryId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Successful response",
            type: "object",
            properties: {
              products: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    price: { type: "number" },
                    colors: { type: "array", items: { type: "string" } },
                    stock: { type: "number" },
                    sizes: { type: "array", items: { type: "string" } },
                    images: {
                      type: "array",
                      items: { type: "string", format: "uri" },
                    },
                    categoryId: { type: "string" },
                    category: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        slug: { type: "string" },
                      }
                    },
                    createdAt: { type: "string", format: "date-time" },
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
          400: {
            description: "Bad Request",
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
    listProducts,
  );

  // get product by id
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Get a product by ID",
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
              description: { type: "string" },
              price: { type: "number" },
              colors: { type: "array", items: { type: "string" } },
              categoryId: { type: "string" },
              category: {
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
              stock: { type: "number" },
              sizes: { type: "array", items: { type: "string" } },
              images: {
                type: "array",
                items: { type: "string", format: "uri" },
              },
              createdAt: { type: "string", format: "date-time" },
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
    getProduct,
  );

  // POST - create a new product
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Products"],
        description: "Create a new product",
        required: ["name", "description", "price", "slug", "active", "stock", "categoryId"],
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            colors: { type: "array", items: { type: "string" } },
            stock: { type: "number" },
            sizes: { type: "array", items: { type: "string" } },
            active: { type: "boolean" },
            images: {
              type: "array",
              items: { type: "string" },
            },
            categoryId: { type: "string" },
          },
        },
        response: {
          201: {
            description: "Product created successfully",
            type: "object",
            properties: {
              message: { type: "string" },
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
    createProduct,
  );

  // PUT - update a product
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Update a product",
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
            description: { type: "string" },
            price: { type: "number" },
            colors: { type: "array", items: { type: "string" } },
            stock: { type: "number" },
            sizes: { type: "array", items: { type: "string" } },
            active: { type: "boolean" },
            images: {
              type: "array",
              items: { type: "string" },
            },
            categoryId: { type: "string" },
          },
        },
        response: {
          200: {
            description: "Products was updated successfully",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              price: { type: "number" },
              colors: { type: "array", items: { type: "string" } },
              stock: { type: "number" },
              sizes: { type: "array", items: { type: "string" } },
              images: {
                type: "array",
                items: { type: "string", format: "uri" },
              },
              createdAt: { type: "string", format: "date-time" },
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
    updateProduct,
  );

  // DELETE - delete a product
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Delete a product",
        params: {
          type: "object",
          properties: {
            id: { type: "string", minLength: 1 },
          },
          required: ["id"],
          // if you attempt to send an empty string as the id the schema
          // validation will now trigger a 400 response with a clear message.
        },
        // allow empty delete body to avoid Fastify parsing error when client
        // sends Content-Type: application/json with no payload
        body: {
          type: "object",
          additionalProperties: false,
          nullable: true,
        },
        response: {
          200: {
            description: "Product deleted successfully",
            type: "object",
            properties: {
              message: { type: "string" },
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
    deleteProduct,
  );
}
