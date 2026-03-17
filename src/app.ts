// Require the framework and instantiate it

// ESM
import "dotenv/config";
import Fastify, { FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import productRoutes from "./routes/products.routes";
import categoryRoutes from "./routes/categories.routes";
import orderRoutes from "./routes/orders.routes";
import swagger from "@fastify/swagger";
import scalar from "@scalar/fastify-api-reference";
import jwt from "@fastify/jwt";
import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/error.middleware";

const PORT = parseInt(process.env.PORT ?? "3000");

if (!process.env.JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET environment variable is not defined.");
  process.exit(1);
}

const fastify = Fastify({
  logger: true,
});

fastify.register(jwt,{
  secret: process.env.JWT_SECRET
});

// cors config
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:5173"];

fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      cb(null, true);
      return;
    }

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
      cb(null, true);
      return;
    }

    cb(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
});

// rate limit config
fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
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

// globally strip JSON content-type on empty bodies (esp. DELETE requests) to avoid parser errors
fastify.addHook('preParsing', (request, reply, payload, done) => {
  // if client sent application/json without any body, fastify will throw 400 before handlers
  if (
    request.method === 'DELETE' &&
    request.headers['content-type']?.includes('application/json') &&
    (!request.headers['content-length'] || request.headers['content-length'] === '0')
  ) {
    delete request.headers['content-type'];
  }
  done();
});

fastify.register(productRoutes, { prefix: "/products" });
fastify.register(categoryRoutes, { prefix: "/categories" });
fastify.register(orderRoutes, { prefix: "/orders" });

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

fastify.setErrorHandler(errorHandler);

// Run the server!
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  fastify.listen({ port: PORT, host: "0.0.0.0" }, function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    // Server is now listening on ${address}
  });
}

export default fastify;
