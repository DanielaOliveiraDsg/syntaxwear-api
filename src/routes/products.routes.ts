import { FastifyInstance } from "fastify";
import { listProducts } from "../controllers/products.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authMiddleware);
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        description: "List products with optional filters",
        querystring: {
          type: "object",
          properties: {
            page: { type: "number"},
            limit: { type: "number"},
            minPrice: { type: "number"},
            maxPrice: { type: "number"},
            search: { type: "string" },
            sortBy: { type: "string", enum: ["price", "name", "createdAt"] },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
          },
        },
      },
    },
    listProducts,
  );
}
