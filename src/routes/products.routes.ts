import { FastifyInstance } from "fastify";
import { listProducts } from "../controllers/products.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authMiddleware);
  fastify.get("/", listProducts);
}