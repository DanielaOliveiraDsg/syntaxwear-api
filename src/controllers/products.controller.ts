//usign fastify
import { FastifyReply, FastifyRequest } from "fastify";
import { ProductFilter } from "../types";
import { getProductById, getProducts } from "../services/products.service";
import { productFilterSchema } from "../utils/validators";
import { request } from "node:http";

export const listProducts = async (
  request: FastifyRequest<{ Querystring: ProductFilter }>,
  reply: FastifyReply,
) => {
  // validate query parameters
  const query = productFilterSchema.parse(request.query);
  const result = await getProducts(query);
  return reply.status(200).send(result);
};

export const getProduct = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  const product = await getProductById(request.params.id);
  return reply.status(200).send(product);
}