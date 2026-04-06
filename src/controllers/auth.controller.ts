import { FastifyReply, FastifyRequest } from "fastify";
import { loginUser, registerUser } from "../services/auth.service.js";
import { AuthRequest, RegisterRequest } from "../types/index.js";
import { loginSchema, registerSchema } from "../utils/validators.js";

export const register = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // validate registration payload
  const validation = registerSchema.parse(request.body as RegisterRequest);
  const user = await registerUser(validation);

  const token = request.server.jwt.sign({
    userId: user.id,
    role: user.role,
  });
  reply.status(201).send({ user, token });
};

export const login = async (
  request: FastifyRequest<{ Body: AuthRequest }>,
  reply: FastifyReply,
) => {
  const validation = loginSchema.parse(request.body as AuthRequest);

  const user = await loginUser(validation);

  const token = request.server.jwt.sign({
    userId: user.id,
    role: user.role,
  });
  reply.status(200).send({ user, token });
};

export const profile = async (
  request: FastifyRequest,
  reply: FastifyReply) => reply.status(200).send({ user: request.user });