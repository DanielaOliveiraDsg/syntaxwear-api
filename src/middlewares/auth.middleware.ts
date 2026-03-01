import { FastifyRequest, FastifyReply } from "fastify";

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized. Invalid or missing token." });
  }
};
