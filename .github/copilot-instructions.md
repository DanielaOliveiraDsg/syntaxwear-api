# SyntaxWear API - Copilot Instructions

## Architecture Overview

**Tech Stack**: Fastify + Prisma + PostgreSQL + TypeScript (ES modules)

**Three-Layer Pattern**:

1. **Routes** (`src/routes/*.ts`) – Register endpoints with Fastify, define OpenAPI schemas
2. **Controllers** (`src/controllers/*.ts`) – Validate input, call services, format responses (HTTP layer)
3. **Services** (`src/services/*.ts`) – Business logic, database operations, error throwing

**Data Flow**: HTTP Request → Route Handler → Controller (validate with Zod) → Service (DB operation) → Response

## Critical Patterns

### Input Validation

- **Always** validate in controllers before service calls using Zod schemas from `src/utils/validators.ts`
- Controllers parse request body/query, services expect validated data only
- Example: `const validation = registerSchema.parse(request.body as RegisterRequest);`

### Error Handling

- Services **throw `Error` objects** with descriptive messages (e.g., `throw new Error("User not found")`)
- Error middleware catches and formats them (see `src/middlewares/error.middleware.ts`)
- Zod errors auto-convert to 400 with `z.treeifyError()` formatting all field errors
- Return plain 500 for unhandled errors with `error.message` for debugging

### Product-Specific Patterns

- **Slug generation**: Controller generates from product name using `slugify()`, never in service
- **Price range**: Queries use `minPrice` (gte) and `maxPrice` (lte) for inclusive filtering
- **Search**: Case-insensitive search across `name` OR `description` fields
- **Soft deletes**: Products marked `active: false` instead of removed; queries filter `active: true`
- **Pagination**: Default `page=1, limit=10`; return `totalPages` in meta for frontend navigation
- **Performance**: Use `Promise.all()` for parallel queries (count + find) in `getProducts`

### Authentication

- JWT-based via `@fastify/jwt` plugin; token stored in auth header
- Auth routes exempt from middleware; product routes require `authMiddleware` hook
- Middleware verifies token via `request.jwtVerify()` or returns 401

## File Reference & Examples

| File                                                                       | Purpose                                                               |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| app                                                   | Fastify setup: plugins, hooks, global error handler, health endpoints |
| routes                                               | Endpoint definitions with full OpenAPI schemas for /docs              |
| controllers                                      | HTTP handlers: validate, call services, format responses              |
| services                                           | Business logic; services don't know about HTTP                        |
| validators                         | All Zod schemas (auth, products, filters)                             |
| types                                  | TypeScript interfaces for requests/responses                          |
| middlewares | Global error catch (Zod + Fastify + generic)                          |
| schemas                              | DB schema: User (CUID, role-based), Product (slug-unique)             | 

## Developer Workflows

**Start Development**:

```bash
npm run dev  # tsx watch src/app.ts (hot reload)
```

**Build & Run**:

```bash
npm run build  # tsc -> dist/
npm start      # node dist/server.js
```

**Database Schema Changes**:

```bash
npx prisma migrate dev --name "description"  # Create + apply migration
npx prisma db push                           # Quick dev schema sync (no migrations)
```

**API Documentation**: http://localhost:3000/docs (Swagger + Scalar UI)

## Conventions & Rules

1. **Never** call services without validation in controllers
2. **Always** define OpenAPI schemas in route definitions (tags, description, body, response codes)
3. Use **`const where: any = {}`** pattern for dynamic Prisma filters (see products.service for example)
4. JWT payload stores only `{ userId: string }` on sign/verify
5. Role field defaults to `USER`; check with `request.server.jwt.verify()` for authorization
6. HTTP status codes: 201 (created), 200 (success), 401 (auth), 400 (validation), 404 (not found), 500 (server error)
7. Keep services domain-specific: no HTTP status codes or request/reply objects
