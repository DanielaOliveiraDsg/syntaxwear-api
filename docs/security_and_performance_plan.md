# Security and Performance Audit & Improvement Plan

**Date**: March 12, 2026
**Project**: SyntaxWear API (Fastify + Prisma + PostgreSQL)
**Status**: Comprehensive Review and Roadmap

## Executive Summary

This document outlines findings from a comprehensive security and performance audit of the SyntaxWear API. The review identified critical authorization flaws, hardening opportunities, performance bottlenecks, and maintainability concerns. This roadmap prioritizes remediation efforts to establish a secure, scalable, and maintainable REST API architecture.

---

## 1. Security Audit Results

### 1.1 Critical Findings

#### Authorization Vulnerabilities ----- DONE -----
- **Registration Role Assignment**: Client-supplied roles accepted during registration, allowing privilege escalation. Users can self-assign `ADMIN` role.
- **Missing Route Protection**: Not all sensitive routes enforce `authMiddleware` consistently. Category and product creation/updates lack admin authorization checks.
- **No Admin-Only Middleware**: Authorization logic scattered across controllers; no centralized pattern for admin-only operations.

**Impact**: High - Unauthorized access to privileged operations (create/edit products, categories, orders).
**Solution**:
  - Registration Role Assignment Fix: Modified src/services/auth.service.ts and src/utils/validators.ts to ensure users are always assigned the
     USER role during registration, even if they attempt to supply an ADMIN role in the request.
  - Centralized Admin Middleware: Created src/middlewares/admin.middleware.ts to provide a consistent way to protect routes that require
     administrative privileges.
  - Route Protection Audit & Update:
  - Categories: Secured POST, PUT, and DELETE routes in src/routes/categories.routes.ts with authMiddleware and adminMiddleware.
  - Products: Removed global authMiddleware from src/routes/products.routes.ts and applied it selectively alongside adminMiddleware for create,
         update, and delete operations, while keeping read access public.
  - Validation & Types: Updated RegisterRequest in src/types/index.ts and the registration route schema in src/routes/auth.routes.ts to remove the
     role field from the expected client input.
  - Verification: Confirmed with a script that users cannot self-assign ADMIN roles and are forbidden from accessing protected administrative
     endpoints.

#### Authentication & Secrets

- **JWT_SECRET Not Validated**: Application starts without verifying `JWT_SECRET` environment variable exists, risking insecure defaults.
- **Error Information Leakage**: Zod validation errors and unhandled exceptions may expose sensitive system details in production responses.

**Impact**: Medium - Configuration bugs and information disclosure.

#### Password Security
- **Weak Password Policy**: Current minimum length unclear or insufficient (recommend 12+ characters for OAuth-free API).

**Impact**: Medium - User account compromise via brute force.

#### Network Security
- **CORS Configuration**: Default or unrestricted CORS origins may allow cross-origin attacks.
- **Missing Rate Limiting**: Auth endpoints vulnerable to credential stuffing and brute force attacks.
- **No CSRF Protection**: Unclear if CSRF protection is implemented (relevant for session-based operations).

**Impact**: Medium-High - DDoS and credential attack vectors.

#### Type Safety
- **Type Casting with `any`**: Multiple `as any` casts bypass TypeScript safety; unvalidated data may reach services.
- **Zod Validator Coverage**: Error middleware handles Zod errors but upstream source validation unclear.

**Impact**: Medium - Runtime errors and validation bypass.

### 1.2 Fastify Framework Hardening

- **JSON Schema Validation**: Verify all routes define OpenAPI schemas in route definitions for compile-time validation.
- **Secure Headers**: No evidence of `helmet` plugin or manual security header configuration (e.g., X-Frame-Options, CSP, Strict-Transport-Security).
- **Hook Security**: Auth middleware and global hooks must not leak sensitive data (e.g., full error traces, user IDs in logs).

**Impact**: Medium - Framework-level vulnerabilities and information leakage.

### 1.3 Database & Supabase Concerns

- **RLS Policies**: External to code; must verify Row-Level Security policies enforce least privilege for `anon` and `service_role` keys.
- **Service Role Key**: Risk of exposure in client code or repository commits; must audit deployment secrets.
- **No Database Indexes**: Foreign key columns (`categoryId`, `userId`, `status`) lack indexes, risking slow queries and locking under load.

**Impact**: Medium - Data leakage, performance degradation, unauthorized access.

---

## 2. Performance Concerns

### 2.1 Database Performance

#### Missing Indexes
- `Product.categoryId` – Foreign key filtering (list by category)
- `Order.userId` – User order history queries
- `Order.status` – Status-based filtering and reporting
- `OrderItem.orderId` – Aggregate queries for order details

**Impact**: Linear table scans on each filtered query; degraded performance under concurrent load.

#### N+1 Query Risk
- Product list endpoints may fetch category data in loops without `include()` optimization.
- Order details may trigger separate queries per item.

**Impact**: Database connection exhaustion, latency spikes.

#### Decimal Handling
- Price fields may use floating-point arithmetic, causing precision loss (e.g., $19.99 + $19.99 ≠ $39.98).
- Consider storing prices in cents (integers) or consistent Decimal.js usage.

**Impact**: Financial inaccuracy and customer issues.

### 2.2 API Response Optimization

#### Over-fetching Relations
- Product endpoints return all related data without option to exclude relations.
- Unnecessary data transfer increases payload size and response time.

**Impact**: Higher bandwidth consumption, slower mobile clients.

#### No Caching Strategy
- GET endpoints for products/categories are cache-friendly but uncached.
- Redis or CDN caching could reduce database load for read-heavy operations.

**Impact**: Repeated database hits for immutable or slowly-changing data.

### 2.3 Middleware & Plugin Efficiency
- Global hooks must be non-blocking and lightweight.
- Error middleware catches all exceptions; ensure efficiency under high load.

**Impact**: Potential request queuing or timeout issues.

---

## 3. Prioritized Improvement Checklist

### Phase 1: Critical Security (Week 1)

Priority: **Immediate** – Prevents privilege escalation and data breach.

- [ ] **Remove client-supplied roles from registration**
  - Modify `auth.controller.ts` to always set `role: "USER"` during registration
  - Update Zod schema to exclude `role` field from request

- [ ] **Implement admin-only authorization middleware**
  - Create `src/middlewares/adminOnly.middleware.ts` to check `request.user.role === "ADMIN"`
  - Apply to all sensitive routes: category CRUD, product CRUD admin paths, order management

- [ ] **Enforce authMiddleware on all protected routes**
  - Audit `src/routes/*.ts` to verify all non-auth endpoints use `onRequest: [authMiddleware]`
  - Add admin checks to product/category creation/deletion endpoints

- [ ] **Validate JWT_SECRET at startup**
  - Update `src/app.ts` to throw descriptive error if `JWT_SECRET` missing
  - Example: `if (!process.env.JWT_SECRET) throw Error("JWT_SECRET must be set"`

### Phase 2: Enhanced Security (Week 2)

Priority: **High** – Reduces attack surface and information disclosure.

- [ ] **Harden password policy**
  - Update Zod `registerSchema` in `src/utils/validators.ts` to require minimum 12 characters
  - Add complexity requirements if desired (uppercase, numbers, special chars)

- [ ] **Sanitize error responses in production**
  - Modify `src/middlewares/error.middleware.ts` to return generic error messages in production
  - Log full error details internally for debugging

- [ ] **Configure CORS with environment restrictions**
  - Update `src/app.ts` to accept `CORS_ORIGINS` env var (comma-separated list)
  - Default to strict policy (e.g., only frontend domain(s))

- [ ] **Add rate limiting**
  - Install `@fastify/rate-limit` plugin
  - Apply global rate limit (e.g., 100 req/min per IP) and stricter limit to `/auth/*` endpoints (e.g., 5 attempts/15 min)

- [ ] **Replace `any` type casts with explicit validation**
  - Search codebase for `as any` patterns
  - Replace with Zod validation or explicit type definitions

### Phase 3: Performance & Reliability (Week 3)

Priority: **Medium** – Improves scalability and user experience.

- [ ] **Add database indexes**
  - Update `prisma/schema.prisma` with index directives:
    ```prisma
    model Product {
      // ... existing fields
      categoryId String
      @@index([categoryId])
    }

    model Order {
      // ... existing fields
      userId String
      status String
      @@index([userId])
      @@index([status])
    }

    model OrderItem {
      orderId String
      @@index([orderId])
    }
    ```
  - Run migration: `npx prisma migrate dev --name "add_performance_indexes"`

- [ ] **Optimize product queries**
  - Add optional `includeRelations` query parameter (or separate endpoints) to exclude category/color data when not needed
  - Use Prisma `select` to fetch only required fields on list endpoints

- [ ] **Standardize decimal handling for prices**
  - Decide: store in cents (integers) OR use Decimal.js consistently
  - Update schema and migrations if switching to integer cents
  - Document in code comments and README

- [ ] **Implement caching for read-heavy endpoints**
  - (Optional) Integrate Redis for product/category caching with TTL
  - Cache invalidation on updates
  - Monitor cache hit rates

### Phase 4: Architecture & Testing (Week 4)

Priority: **Medium** – Improves maintainability and confidence.

- [ ] **Repository pattern or service abstraction**
  - Consider extracting Prisma queries into a repository layer if scaling (e.g., `PrismaRepository` class)
  - Enables easier testing and query optimization

- [ ] **Add unit tests for authorization**
  - Test `adminOnly` middleware rejects non-admin users
  - Test role assignment in registration

- [ ] **TypeScript strict mode verification**
  - Run `npm run build` to confirm all `any` removals compile cleanly
  - Run `npm run lint` to catch any lint violations

- [ ] **Add integration tests for sensitive operations**
  - Test unauthorized product creation (unauthenticated and non-admin)
  - Test category deletion permissions

- [ ] **CSRF risk decision**
  - Document decision: Option A (token-based), Option B (rely on JWT + same-origin), or Option C (note risk)
  - If API consumed by SPA, same-origin JWT strategy typically sufficient

### Phase 5: Infrastructure & Monitoring (Ongoing)

Priority: **Medium-Low** – Enables proactive issue detection.

- [ ] **Document environment configuration**
  - Create `.env.example` with all required variables and documentation
  - Add README section on JWT_SECRET setup, CORS origins, rate limit thresholds

- [ ] **Security scanning automation**
  - Integrate OWASP ZAP or Snyk into CI/CD pipeline
  - Run on every pull request

- [ ] **Audit Supabase RLS policies**
  - Review external Supabase console for Row-Level Security policies
  - Verify anon key has minimal permissions (only select public data)
  - Confirm service_role key is never exposed in client code

- [ ] **Monitor database performance**
  - Enable PostgreSQL slow query log (e.g., `log_min_duration_statement = 1000`)
  - Use `EXPLAIN ANALYZE` on critical queries after index additions
  - Set up alerts for query execution time > 500ms

---

## 4. Implementation Steps & Roadmap

### Week 1: Critical Authorization Fix
1. Remove role from registration endpoint
2. Create admin-only middleware
3. Audit and apply auth middleware to all routes
4. Validate JWT_SECRET at startup
5. **Verification**: Attempt to register as admin (should fail), verify non-admin cannot create products

### Week 2: Network & Error Hardening
1. Implement password policy (12+ characters)
2. Sanitize error responses
3. Configure CORS and rate limiting
4. Remove `as any` casts
5. **Verification**: Test rate limiting with cURL, verify error messages don't leak DB details

### Week 3: Database & Query Optimization
1. Add indexes to schema and run migration
2. Optimize product queries with selective `select`/`include`
3. Standardize decimal handling
4. (Optional) Add Redis caching layer
5. **Verification**: Run `EXPLAIN ANALYZE` on filtered queries; verify index usage

### Week 4: Testing & Architecture
1. Add authorization middleware tests
2. Add integration tests for sensitive endpoints
3. Remove remaining type casting issues
4. Document CSRF decision
5. **Verification**: Run full test suite with coverage, `npm run build` passes with strict mode

### Ongoing: Monitoring & Documentation
1. Add `.env.example` and README security section
2. Set up CI/CD security scanning
3. Audit Supabase RLS policies
4. Monitor slow queries and performance metrics

---

## 5. Next Steps & Decisions

### Immediate Actions (This Week)
1. **Prioritize Phase 1** (critical authorization) – highest impact, lowest effort
2. **Review session**: Stakeholder sign-off on rate limiting thresholds and CORS origin list
3. **Begin Phase 2** – coordinate with UI team on password policy changes if enforced on existing Users

### Configuration Decisions Required
1. **CORS Origins**: What domain(s) should be allowed? (e.g., `https://syntaxwear.com,http://localhost:3000`)
2. **Rate Limits**: Global limit? Auth endpoint limit? (Suggested: 100 req/min global, 5 attempts/15 min for `/auth/register` and `/auth/login`)
3. **Decimal Strategy**: Store prices in cents or use Decimal.js? (Recommend cents for simplicity)
4. **CSRF Protection**: Accept same-origin JWT strategy or implement token-based protection?
5. **Caching**: Prioritize Redis implementation or defer to scaling phase?

### External Dependencies
- **Supabase RLS Policies**: Must be reviewed separately in Supabase console (not in repo)
- **Secret Management**: Ensure `JWT_SECRET` (and any API keys) are stored in secure vault, not committed
- **Database Backups**: Confirm backup strategy before making schema changes

### Success Criteria
- ✅ No unauthorized privilege escalation (non-admin cannot create products)
- ✅ All sensitive routes enforce authentication and authorization
- ✅ Startup fails with clear error if `JWT_SECRET` missing
- ✅ Database queries with indexes execute < 200ms under 100 concurrent users
- ✅ Error responses don't leak sensitive data in production
- ✅ All TypeScript builds with strict type checking, no `any` casts
- ✅ Security scanning (OWASP ZAP) finds no critical/high vulnerabilities

---

## 6. References & Resources

### Tools &_COMMANDS
- **Type Checking**: `npm run build` (TypeScript compilation)
- **Linting**: `npm run lint` (catch type/style issues)
- **Database Migrations**: `npx prisma migrate dev --name "description"`
- **Query Analysis**: PostgreSQL `EXPLAIN ANALYZE` command
- **Security Scanning**: [OWASP ZAP](https://www.zaproxy.org/), [Snyk](https://snyk.io/)
- **Rate Limiting**: [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit)

### Related DOCUMENTATION
- [Fastify Security](https://www.fastify.io/docs/latest/Guides/Security/)
- [Prisma Best Practices](https://www.prisma.io/docs/orm/more/help-center/performance-optimization)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Security](https://tools.ietf.org/html/rfc8725)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)

---

**Document Version**: 1.0
**Last Updated**: March 12, 2026
**Next Review**: After Phase 1 completion (1 week)
