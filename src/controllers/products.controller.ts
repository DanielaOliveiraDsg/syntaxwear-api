import { FastifyReply, FastifyRequest } from "fastify";
import { CreateProductType, ProductFilter, UpdateProductType } from "../types/index.js";
import {
  getProductById,
  getProducts,
  saveDeletedProduct,
  saveProduct,
  saveUpdatedProduct,
} from "../services/products.service.js";
import {
  productFilterSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from "../utils/validators.js";

import _slugify from "slugify";

const slugify = _slugify as unknown as (str: string, options?: any) => string;


export const listProducts = async (
  request: FastifyRequest<{ Querystring: ProductFilter }>,
  reply: FastifyReply,
) => {
  // validate query parameters
  const query = productFilterSchema.parse(request.query);
  const result = await getProducts(query);
  return reply.status(200).send(result);
};

export const getProduct = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const product = await getProductById(request.params.id);
  return reply.status(200).send(product);
};

export const createProduct = async (
  request: FastifyRequest<{ Body: CreateProductType }>,
  reply: FastifyReply,
) => {
  const body = request.body;

  body.slug = slugify(body.name, { lower: true, strict: true }); // Generate slug from name, e.g., "Cool T-Shirt" -> "cool-t-shirt"
  const validate = createProductSchema.parse(body);

  await saveProduct(validate);

  return reply.status(201).send({ message: "Product created successfully" });
};

export const updateProduct = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductType }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const body = request.body;

  const validate = updateProductSchema.parse(body);

  if (validate.name) {
    validate.slug = slugify(validate.name, { lower: true, strict: true });
  }

  const product = await saveUpdatedProduct(id, validate);

  return reply.status(201).send(product);
};

export const deleteProduct = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  // parse expects object
  const validate = deleteProductSchema.parse({ id });

  await saveDeletedProduct(validate.id);

  return reply.status(204);
};
