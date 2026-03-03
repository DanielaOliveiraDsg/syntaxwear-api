//usign fastify
import { FastifyReply, FastifyRequest } from "fastify";
import { CreateProductType, ProductFilter, UpdateProductType } from "../types";
import { getProductById, getProducts, saveProduct, SaveUpdatedProduct } from "../services/products.service";
import { productFilterSchema , createProductSchema, updateProductSchema} from "../utils/validators";
import { request } from "node:http";
import slugify from "slugify";
import { error } from "node:console";

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

export const createProduct = async (request: FastifyRequest<{ Body: CreateProductType }>, reply: FastifyReply) => {

  const body =request.body;

  body.slug = slugify(body.name, { lower: true, strict: true }); // Generate slug from name, e.g., "Cool T-Shirt" -> "cool-t-shirt"
  const validate = createProductSchema.parse(body);

  await saveProduct(validate);

  return reply.status(201).send({ message: "Product created successfully" });
}

export const updateProduct = async (request: FastifyRequest<{Params: { id: string}; Body:UpdateProductType}>, reply: FastifyReply) => {
  const { id } = request.params;
  const body =request.body;

  const validate = updateProductSchema.parse(body);

  if(validate.name){
    validate.slug = slugify(validate.name, { lower: true, strict: true });
  }

  const product =await SaveUpdatedProduct(id, validate);

  return reply.status(201).send(product);
}