import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/prisma.js";

export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
    await request.jwtVerify();

    // extract user id from token payload
    const userId = (request.user as any).userId;

    if (!userId) {
      return reply.status(401).send({ error: "Unauthorized. Invalid token." });
    }


    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(401).send({ error: "User not found." });
    }

    const { passwordHash, ...userwithoutPassword } = user;

    request.user = {
      ...userwithoutPassword,
      userId: user.id,
    };

  } catch (err) {
    reply.status(401).send({ error: "Unauthorized. Invalid or missing token." });
  }
};
