// Require the framework and instantiate it

// ESM
import Fastify from "fastify";
import "dotenv/config";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { version } from "node:os";
import { timeStamp } from "node:console";

const PORT = parseInt(process.env.PORT ?? "3000");

const fastify = Fastify({
  logger: true,
});

// cors config
fastify.register(cors, {
  origin: true,
  credentials: true,
});

// helmet config
fastify.register(helmet, {
  contentSecurityPolicy: false,
});

// Declare a route
fastify.get("/", async (request, reply) => {
  return {
    message: "SyntaxWear E-commerce API is running!",
    version: "1.0.0",
    status: "running",
  };
});

// Health route
fastify.get("/health", async (request, reply) => {
  return {
    status: "ok",
    uptime: process.uptime(),
    timeStamp: new Date().toISOString(),
  };
});

// Run the server!
fastify.listen({ port: PORT }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});

export default fastify;