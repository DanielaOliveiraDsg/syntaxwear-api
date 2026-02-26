//usign fastify
import { FastifyReply, FastifyRequest } from "fastify";
import { ProductFilter } from "../types";
import { getProducts } from "../services/products.service";

export const listProducts = async (request: FastifyRequest<{Querystring: ProductFilter}>, reply: FastifyReply) => {
  const result = await getProducts(request.query);
  return reply.send(result);
}