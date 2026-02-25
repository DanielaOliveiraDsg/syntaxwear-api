# Product Requirements Document — Footwear Store Backend API

## TL;DR

A Fastify + TypeScript REST API backed by Supabase/Postgres (Prisma) providing:

- Product catalog with SKUs (size, color) and per-SKU stock
- Category hierarchies (tree)
- User accounts with JWT auth and role-based access (ADMIN, CUSTOMER)
- Server-side persistent carts, checkout flow, and order lifecycle
- Stripe payment placeholder integration
- Strict typing, atomic stock validation, and Vitest testing strategy

## Assumptions & Scope

- Market: United States (US ZIP validation for shipping)
- Server-side carts for logged-in users; localStorage for anonymous users, merged on login
- Payment: include payment flow design (Stripe placeholder)
- Auth: simple stateless JWT access tokens (no refresh tokens)
- Images: stored and served as public URLs (Supabase Storage or S3)

---

## Functional Requirements

### Product Management

- Products support multiple SKUs (size + color variants).
- Stock tracked on each SKU.
- Price stored as cents (`priceCents`) to avoid floating precision.
- Admin CRUD for products, SKUs, and product images.
- Bulk stock updates (CSV or JSON endpoint) for inventory operations.

### Category Hierarchies

- Categories form a parent/child tree.
- Products have one primary category; optional tags/secondary categories via M:N as future enhancement.
- Public endpoint to retrieve full category tree and category-specific products (paginated).

### User Profiles & Authentication

- Signup fields: `firstName`, `lastName`, `email`, `password`, optional `phone`, `birthDate`, `cpf`.
- Passwords hashed with `bcrypt`.
- Login returns signed JWT with `sub` and `role` claims.
- Roles: `ADMIN` and `CUSTOMER`. Enforce admin checks on protected endpoints.

### Shopping Cart Persistence

- Server-side `Cart` with `CartItem`s referencing `ProductSKU` and `quantity`.
- Merge logic: when user logs in, client-side cart merges into server cart (quantities summed, capped by stock).
- Checkout converts cart into an `Order`, reserves/decrements stock in an atomic transaction.

### Orders & Payments

- Order lifecycle: `CREATED -> PAYMENT_PENDING -> PAID -> FULFILLED | CANCELED | REFUNDED`.
- Payment integration: placeholder endpoints for Stripe PaymentIntent creation; real payment processing via provider webhooks.
- Idempotency support for order creation (`Idempotency-Key` header).

### Admin Controls

- Admin endpoints to manage products, categories, SKUs, orders, and reports.

### Validation & Security

- Stock check on add-to-cart and final re-check on checkout (atomic).
- Rate-limiting for auth endpoints and sensitive routes.
- Input validation via Zod (or TypeBox) on all endpoints.

---

## Data Schema (Prisma models)

See `docs/schema.prisma` for full Prisma schema. Key models:

- `User` (id, email, passwordHash, role, profile fields)
- `Category` (tree links parent/children)
- `Product` with `ProductSKU` for variant-level price/stock
- `Cart` and `CartItem`
- `Order` and `OrderItem` (snapshotting SKU data)
- `Payment`

Refer to `schema.prisma` for exact types and relations.

---

## Mermaid DB Diagram

See `docs/db_diagram.mmd` for the Mermaid ER diagram. (Mermaid snippet included later in this file.)

---

## Endpoint Mapping

Endpoints are namespaced under `/api/v1`. Authentication: `Authorization: Bearer <JWT>`. Admin-only endpoints require `role: ADMIN` in token claims.

### Products & Categories

| Method |                 Path | Auth  | Request Body                                                 | Response          | Notes                      |
| ------ | -------------------: | ----- | ------------------------------------------------------------ | ----------------- | -------------------------- |
| GET    |     /api/v1/products | No    | query: `?q&category&size&color&minPrice&maxPrice&page&limit` | { items, meta }   | paginated                  |
| GET    | /api/v1/products/:id | No    | —                                                            | ProductDetailDTO  | includes `skus` with stock |
| POST   |     /api/v1/products | Admin | ProductCreateDTO                                             | ProductDTO        | images as public URLs      |
| PUT    | /api/v1/products/:id | Admin | ProductUpdateDTO                                             | ProductDTO        | partial update             |
| DELETE | /api/v1/products/:id | Admin | —                                                            | 204               | soft-delete recommended    |
| GET    |   /api/v1/categories | No    | —                                                            | CategoryTreeDTO[] | nested tree                |
| POST   |   /api/v1/categories | Admin | { name, slug, parentId? }                                    | CategoryDTO       | create category            |

### SKUs & Stock

| Method |                             Path | Auth  | Body               | Response        | Notes                   |
| ------ | -------------------------------: | ----- | ------------------ | --------------- | ----------------------- |
| POST   | /api/v1/products/:productId/skus | Admin | SKUCreateDTO       | ProductSKU      | create variant          |
| PUT    |              /api/v1/skus/:skuId | Admin | SKUUpdateDTO       | ProductSKU      | update price/stock      |
| POST   |          /api/v1/skus/bulk-stock | Admin | [{ skuId, delta }] | { updated: [] } | idempotent bulk updates |

### Auth & Users

| Method |                     Path | Auth | Body                                | Response        | Notes           |
| ------ | -----------------------: | ---- | ----------------------------------- | --------------- | --------------- |
| POST   |    /api/v1/auth/register | No   | { email, password, firstName, ... } | { user, token } | password hashed |
| POST   |       /api/v1/auth/login | No   | { email, password }                 | { user, token } | returns JWT     |
| GET    |         /api/v1/users/me | User | —                                   | UserProfileDTO  | profile         |
| PUT    |         /api/v1/users/me | User | UserUpdateDTO                       | UserProfileDTO  | update fields   |
| POST   | /api/v1/users/me/address | User | AddressDTO                          | Address         | add address     |

### Cart & Checkout

| Method |                       Path | Auth | Body                                                    | Response                   | Notes                          |
| ------ | -------------------------: | ---- | ------------------------------------------------------- | -------------------------- | ------------------------------ |
| GET    |               /api/v1/cart | User | —                                                       | CartDTO                    | view server cart               |
| POST   |         /api/v1/cart/items | User | { skuId, quantity }                                     | CartDTO                    | validate stock                 |
| PUT    | /api/v1/cart/items/:itemId | User | { quantity }                                            | CartDTO                    | update quantity                |
| DELETE | /api/v1/cart/items/:itemId | User | —                                                       | CartDTO                    | remove item                    |
| POST   |         /api/v1/cart/merge | User | { items: [...] }                                        | CartDTO                    | merge client cart              |
| POST   |           /api/v1/checkout | User | { shippingAddressId, paymentMethodId, idempotencyKey? } | { orderId, paymentIntent } | creates order & payment intent |

### Orders & Payments

| Method |                                  Path | Auth       | Body           | Response              | Notes              |
| ------ | ------------------------------------: | ---------- | -------------- | --------------------- | ------------------ |
| GET    |                        /api/v1/orders | User       | ?page          | { items: OrderDTO[] } | list user orders   |
| GET    |                    /api/v1/orders/:id | User/Admin | —              | OrderDTO              | admin can view all |
| POST   | /api/v1/payments/stripe/create-intent | User       | { orderId }    | { clientSecret }      | Stripe placeholder |
| POST   |               /api/v1/webhooks/stripe | Public     | Stripe payload | 200                   | verify signature   |

### Admin (Orders/Reports)

| Method |                            Path | Auth  | Body         | Response  | Notes          |
| ------ | ------------------------------: | ----- | ------------ | --------- | -------------- |
| GET    |            /api/v1/admin/orders | Admin | ?status,page | { items } | filterable     |
| PUT    | /api/v1/admin/orders/:id/status | Admin | { status }   | OrderDTO  | manual updates |

---

## Business Rules

### Stock Validation

- On add-to-cart: require `sku.stock >= requestedQuantity`.
- On checkout: atomic transaction:
  1. Re-check stock for all SKUs.
  2. Lock rows (SELECT FOR UPDATE) or use equivalent mutex.
  3. Decrement stock if available; otherwise abort and return 409 with details.
- Support partial fulfillment policy configurable by merchant.

### Password Hashing & Auth

- Use `bcrypt` (cost ~12) for hashing.
- Store `passwordHash` only.
- JWT payload: `{ sub: userId, role, iat, exp }`, `exp` ≈ 1h.
- Stateless tokens: logout handled client-side; optional revocation list if required later.

### RBAC

- Middleware validates JWT and `role` claim.
- Admin endpoints require `role === 'ADMIN'`.

### Data Integrity

- Order items snapshot price/image/name to preserve history.
- Price source: `ProductSKU.priceCents` but copy to `OrderItem.priceCents`.

### Idempotency & Rate Limits

- `Idempotency-Key` required for `POST /checkout`.
- Rate-limit auth endpoints (e.g., 10 req/min/IP).

---

## Testing Strategy (Vitest)

- Unit tests: domain utilities and validation schemas.
- Integration tests: Fastify routes via `fastify.inject()` or SuperTest against test Postgres database (Prisma).
- Key test cases:
  - Auth: register (dup email), login success/failure.
  - Products: CRUD for admin, read-only for customers.
  - SKUs & stock updates.
  - Cart: add/update/remove items; enforce stock caps.
  - Merge cart: merging behavior and stock caps.
  - Checkout: success flow, stock decrement, idempotency, concurrent checkout race preventing oversell.
  - Payments/webhooks: signature verification and order status change.
  - RBAC enforcement.

Test infra:

- Use Prisma test DB (reset between tests with transactions/truncation).
- Factories for deterministic fixtures.
- Run integration tests in CI with `DATABASE_URL` pointing to ephemeral test DB (Docker or Supabase test instance).

---

## Operational Notes & Env

Required env:

- `DATABASE_URL` (Supabase/Postgres)
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STORAGE_BASE_URL` (optional)
- `EMAIL_*` (optional for verification)

Deployment:

- Run Prisma migrations in CI/CD.
- Use structured logs and error tracking (Sentry).
- Monitor metrics: orders/min, payment failures, stock-outs.

---

## Deliverables Saved

- Prisma schema: `docs/schema.prisma`
- Mermaid diagram: `docs/db_diagram.mmd`
- Full PRD: `docs/PRD.md`

---

## Mermaid (inline copy)

```
mermaid
erDiagram
  USER ||--o{ CART : owns
  USER ||--o{ ORDER : places
  USER ||--o{ ADDRESS : has
  CART ||--o{ CARTITEM : contains
  PRODUCT ||--o{ PRODUCTSKU : has
  CARTITEM }o--|| PRODUCTSKU : references
  ORDER ||--o{ ORDERITEM : contains
  ORDERITEM }o--|| PRODUCTSKU : snapshot
  CATEGORY ||--o{ PRODUCT : contains
```
