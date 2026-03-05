import { FastifyReply, FastifyRequest } from "fastify";
import { CategoryFilter } from "../types";
import { getCategories, getCategoryById } from "../services/categories.service";
import { categoryFilterSchema } from "../utils/validators";

export const listCategories = async (
  request: FastifyRequest<{ Querystring: CategoryFilter }>,
  reply: FastifyReply
) => {
  const query = categoryFilterSchema.parse(request.query);
  const result = await getCategories(query);
  return reply.status(200).send(result);
};

export const getCategory = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const category = await getCategoryById(id);
  return reply.status(200).send(category);
};
