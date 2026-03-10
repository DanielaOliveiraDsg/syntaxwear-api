## Plan: Add Orders CRUD (with Product Integration)

**TL;DR**: Add `Order` and `OrderItem` models to Prisma, then build standard CRUD layers (routes → controllers → services → Prisma) following existing patterns. Orders will be tied to authenticated users and will include line items linking to `Product`. We'll validate requests with Zod and expose OpenAPI schema in routes.

---

## Steps

### 1) Prisma schema updates (Data model)
1. Add `OrderStatus` enum (`PENDING`, `PAID`, `SHIPPED`, `CANCELLED`).
2. Add `Order` model with fields:
   - `id`, `userId` (FK to `User`), `status`, `total` (Decimal), `createdAt`, `updatedAt`.
   - Relationship: `user` (User), `items` (OrderItem[]).
3. Add `OrderItem` model with fields:
   - `id`, `orderId` (FK), `productId` (FK), `quantity`, `unitPrice` (Decimal), `totalPrice` (Decimal), `createdAt`.
   - Relationship: `order` (Order), `product` (Product).
4. Store only `productId` for each order item (no denormalized product snapshot in this version). 

### 2) Types + Validators
1. Define request/response types in `src/types/index.ts` for:
   - `CreateOrderItemType` (productId, quantity)
   - `CreateOrderType` (items: CreateOrderItemType[], optionally other fields like `shippingAddress` if required)
   - `UpdateOrderStatusType` (status)
   - `OrderFilter` for listing orders (page, limit, status?)
2. Add Zod schemas in `src/utils/validators.ts` to validate order creation and updates.
   - Order creation should ensure at least one item with quantity > 0 and productId non-empty.
   - Order status update should validate allowed statuses.

### 3) Services (Business Logic)
Follow existing service patterns (no HTTP concerns, throw Errors with messages).

1. `src/services/orders.service.ts` (new)
   - `getOrders(filter, userId)`:
     - List orders for a user (and optionally allow admin to list all).
     - Apply pagination and optional status filter.
     - Include `items` and optionally `items.product` for product info.
   - `getOrderById(id, userId)`:
     - Ensure order exists and belongs to user (or admin). Throw "Order not found" or "Access denied".
   - `createOrder(userId, data)`:
     - Validate products exist and are active.
     - Fetch current `price` for each product to calculate line totals and order total.
     - No stock adjustments; orders only record what was requested.
     - Create `Order` and `OrderItem` records in a transaction.
     - Return created order.
   - `updateOrderStatus(id, status, userId)`:
     - For admin actions or allow user cancellations (depending on desired rules).
     - Update status and return updated order.
   - `cancelOrder(id, userId)` (optional):
     - Update status to `CANCELLED` (no stock adjustments).

### 4) Controllers (HTTP layer)
Create `src/controllers/orders.controller.ts` with Fastify handlers following existing patterns.

1. `listOrders` (GET `/orders`):
   - Parse query (filter) with Zod.
   - Use `request.user.userId` (from JWT) to scope orders.
   - Return paginated response (orders + meta).
2. `getOrder` (GET `/orders/:id`):
   - Ensure order belongs to user.
3. `createOrder` (POST `/orders`):
   - Parse body with Zod.
   - Call service; return `201` with created order info.
4. `updateOrder` (PUT/PATCH `/orders/:id`):
   - For status updates (if in scope).
   - Validate body and pass to service.
5. `deleteOrder` or `cancelOrder` (DELETE `/orders/:id`):
   - Soft-cancel using status update; return `204` or message.

### 5) Routes (Fastify + OpenAPI schema)
Create `src/routes/orders.routes.ts`.

1. Register routes under `/orders` and apply `authMiddleware` to all (orders are authenticated).
2. Add full OpenAPI schema for each endpoint (request params/body and response shapes), mimicking existing route style.
3. Ensure error responses include 400/401/404 patterns.

### 6) App registration
Update `src/app.ts` to register order routes with prefix `/orders`.

### 7) Database migrations
1. Run `npx prisma migrate dev --name add_orders`.
2. Ensure `prisma client` is rebuilt (usually automatic via ts-node or build step).

### 8) Optional: Tests (if repo has tests)
1. Add unit/integration tests for order service + controller.
2. Use existing test patterns (if present). If repo has no tests, note as future work.

---

## Verification (How to confirm it works)
1. Run dev server (`npm run dev`) and confirm app starts.
2. Use Postman/HTTP client to: create a user, log in, create products, then create an order.
3. Validate that order contains correct items with current product prices, and owner can fetch their orders.
4. Confirm unauthorized access is rejected (e.g., user B cannot fetch user A's order).

---

## Decisions / Notes
- **Order ownership**: Orders are scoped to `userId` from JWT; admin access not yet defined (could be added later).
- **Stock handling**: No stock adjustments on order creation; orders just record requested quantities.
- **Denormalization**: Order items store only `productId` (no snapshot fields) and rely on current product data when needed.

---

## Next action
Now that requirements are clarified, you can confirm and I’ll produce the detailed implementation steps (file-by-file changes).
