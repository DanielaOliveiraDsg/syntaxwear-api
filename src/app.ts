// Require the framework and instantiate it

// ESM
import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import productRoutes from "./routes/products.routes";
import swagger from "@fastify/swagger";
import scalar from "@scalar/fastify-api-reference";
import jwt from "@fastify/jwt";
import authRoutes from "./routes/auth.routes";

const PORT = parseInt(process.env.PORT ?? "3000");

const fastify = Fastify({
  logger: true,
});

fastify.register(jwt,{
  secret: process.env.JWT_SECRET!
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

fastify.register(swagger, {
  openapi: {
    openapi: "3.0.0",
    info: {
      title: "SyntaxWear E-commerce API",
      description: "API documentation for SyntaxWear E-commerce platform",
      version: "1.0.0",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer",
        },
      },
    },
  },
});

fastify.register(scalar, {
  routePrefix: "/docs",
  configuration: {
    theme: 'default',
  }
})

fastify.register(productRoutes, { prefix: "/products" });

fastify.register(authRoutes, { prefix: "/auth" });

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
fastify.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  // Server is now listening on ${address}
});

export default fastify;
