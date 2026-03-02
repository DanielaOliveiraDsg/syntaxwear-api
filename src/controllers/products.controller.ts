//usign fastify
import { FastifyReply, FastifyRequest } from "fastify";
import { ProductFilter } from "../types";
import { getProducts } from "../services/products.service";
import { productFilterSchema } from "../utils/validators";

export const listProducts = async (
  request: FastifyRequest<{ Querystring: ProductFilter }>,
  reply: FastifyReply,
) => {
  // validate query parameters
  const query = productFilterSchema.parse(request.query);
  const result = await getProducts(query);
  return reply.send(result);
};
