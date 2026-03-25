import { FastifyReply, FastifyRequest } from "fastify";
import { CategoryFilter, CreateCategoryType, UpdateCategoryType } from "../types/index.js";
import { getCategories, getCategoryById, createCategory, saveUpdatedCategory, deleteCategory } from "../services/categories.service.js";
import { categoryFilterSchema, createCategorySchema, updateCategorySchema, deleteCategorySchema } from "../utils/validators.js";
import _slugify from "slugify";

const slugify = _slugify as unknown as (str: string, options?: any) => string;

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

export const removeCategory = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = deleteCategorySchema.parse(request.params);
  await deleteCategory(id);
  return reply.status(204).send();
};