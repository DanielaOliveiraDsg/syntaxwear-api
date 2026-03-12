import { FastifyReply, FastifyRequest } from "fastify";
import { OrderFilter } from "../types";
import { getOrders, getOrderById, createOrder, updateOrderStatus } from "../services/orders.service";
import { orderFilterSchema, createOrderSchema, updateOrderStatusSchema } from "../utils/validators";

export const listOrders = async (
  request: FastifyRequest<{ Querystring: OrderFilter }>,
  reply: FastifyReply
) => {
  const query = orderFilterSchema.parse(request.query);
  const { userId, role } = request.user as any;
  
  // If user is ADMIN, they can see all orders (unless they filter by userId explicitly)
  // If user is regular USER, they can only see their own orders
  const filterUserId = role === "ADMIN" ? query.userId : userId;

  const result = await getOrders({ ...query, userId: filterUserId });
  
  return reply.status(200).send(result);
};

export const getOrder = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const { userId, role } = request.user as any;
  
  // ADMIN can see any order, regular USER can only see their own
  const order = await getOrderById(id, role === "ADMIN" ? undefined : userId);
  
  return reply.status(200).send(order);
};

export const createOrderHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const body = createOrderSchema.parse(request.body);
  const { userId } = request.user as any;

  const order = await createOrder({
    ...body,
    userId,
  });

  return reply.status(201).send(order);
};

export const updateOrderHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = request.params;
  const body = updateOrderStatusSchema.parse(request.body);
  const { userId, role } = request.user as any;

  const order = await updateOrderStatus(id, body as any, userId, role);

  return reply.status(200).send(order);
};
