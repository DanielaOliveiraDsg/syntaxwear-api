import { FastifyReply, FastifyRequest } from "fastify";
import { CategoryFilter, CreateCategoryType, UpdateCategoryType } from "../types";
import { getCategories, getCategoryById, createCategory, saveUpdatedCategory } from "../services/categories.service";
import { categoryFilterSchema, createCategorySchema, updateCategorySchema } from "../utils/validators";
import slugify from "slugify";

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

export const createNewCategory = async (
  request: FastifyRequest<{ Body: CreateCategoryType }>,
  reply: FastifyReply
) => {
  const data = createCategorySchema.parse(request.body);
  const category = await createCategory(data);
  return reply.status(201).send(category);
};

export const updateCategory = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryType }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const body = request.body;

  const validate = updateCategorySchema.parse(body);

  if (validate.name) {
    validate.slug = slugify(validate.name, { lower: true, strict: true });
  }

  const category = await saveUpdatedCategory(id, validate);

  return reply.status(200).send(category);
};