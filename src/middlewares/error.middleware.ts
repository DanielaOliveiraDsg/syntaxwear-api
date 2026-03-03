import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z, { ZodError } from "zod";

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation error",
      errors: z.treeifyError(error),
    });
  }

  if(error.code === "FST_ERR_VALIDATION") {
    return reply.status(400).send({
      message:"Validation error (fastify)",
      errors: error.validation,
    })
  }

  return reply.status(500).send({message: "Internal Server Error", debug: error.message});
};
