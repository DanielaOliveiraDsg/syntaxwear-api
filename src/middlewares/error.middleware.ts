import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Validation error",
      errors: error.format(),
    });
  }

  if (error.code === "FST_ERR_VALIDATION") {
    return reply.status(400).send({
      message: "Validation error (fastify)",
      errors: error.validation,
    });
  }

  // Log the full error for internal monitoring
  request.log.error(error);

  const response = {
    message: "Internal Server Error",
    ...(isProduction ? {} : { debug: error.message, stack: error.stack }),
  };

  return reply.status(500).send(response);
};
