import { FastifyRequest, FastifyReply } from "fastify";

export const adminMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  if (!request.user || request.user.role !== "ADMIN") {
    reply.status(403).send({ error: "Forbidden. Admin access required." });
  }
};
