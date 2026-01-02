# Contribly - Architecture Guide

## Multi-Tenancy Model

Contribly uses a **workspace-based multi-tenancy** model:

```
Organization (Tenant)
└── Workspace (Database Isolation via Row-Level Security)
    ├── Members (Users with roles)
    ├── Contributions (Main domain entity)
    └── Comments (Collaborative feedback)
```

### Key Design Decisions

**Single Database, Row-Level Security (RLS)**
- All tenants share the same PostgreSQL database
- `workspaceId` foreign key isolates data at the row level
- More cost-efficient and operationally simpler than separate databases
- Easier to implement features like cross-tenant search or analytics

**Tenant Context Middleware**
- Every API request includes tenant information (header-based for MVP)
- Backend automatically filters queries by workspace
- Frontend never displays data from other workspaces

## Technology Stack

### Frontend (`apps/web`)
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios (can be replaced with fetch or SWR)
- **Multi-tenancy:** Subdomain routing (tenant.contribly.app)
- **State:** Built with client components (can add Zustand/Redux)

### Backend (`apps/api`)
- **Framework:** Express.js (lightweight, flexible)
- **Language:** TypeScript
- **ORM:** Prisma (type-safe database access)
- **Authentication:** JWT-ready (not implemented, framework-agnostic)
- **Database:** PostgreSQL 16+
- **Middleware Stack:** CORS, JSON parsing, tenant extraction

### Shared Packages
- **@contribly/types:** TypeScript interfaces for frontend/backend alignment
- **@contribly/utils:** Validators, helpers, constants
- **@contribly/config:** ESLint, Prettier, TypeScript base config
- **@contribly/database:** Prisma schema, migrations, seeders

### Build & Monorepo
- **Monorepo Tool:** Turborepo (fast, incremental builds)
- **Package Manager:** pnpm (efficient, monorepo-friendly)
- **Database Migrations:** Prisma Migrate
- **Container:** Docker Compose (PostgreSQL + future services)

## Database Schema

### Core Tables

**User**
- Stores user accounts across all workspaces
- `email` is globally unique
- Password hashing recommended (bcrypt)

**Workspace**
- Tenant container
- `slug` used for URL routing (tenant.contribly.app)
- Metadata: name, description, logo

**WorkspaceMember**
- Bridges users and workspaces
- Role-based access control (OWNER, ADMIN, MEMBER)
- `unique(userId, workspaceId)` enforces one membership per user per workspace

**Contribution**
- Main domain entity
- `status`: DRAFT → SUBMITTED → APPROVED/REJECTED
- Belongs to workspace and author

**Comment**
- Collaborative feedback on contributions
- Linked to both contribution and author

### Indexes & Constraints
- Foreign key constraints with CASCADE delete for data integrity
- Indexes on frequently queried fields (workspaceId, authorId, slug)
- Unique constraints prevent duplicate data

## API Design

### Base URL
```
http://localhost:3001/api
```

### Multi-Tenancy Header
Every request requires tenant context:
```http
X-Workspace-Id: uuid-here
X-User-Id: uuid-here
X-User-Role: OWNER|ADMIN|MEMBER
```

### Response Format
```json
{
  "success": true,
  "data": { /* response payload */ }
}

// Error response
{
  "success": false,
  "error": {
    "message": "Human-readable error",
    "code": "ERROR_CODE"
  }
}
```

### Endpoints (MVP)

**Health Check**
```
GET /health
```

**Workspaces**
```
GET /api/workspaces
GET /api/workspaces/:id
```

**Contributions**
```
GET /api/contributions
POST /api/contributions
```

Future endpoints will include workspace members, comments, and full CRUD operations.

## Frontend Architecture

### File Structure
```
apps/web/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── globals.css         # Global Tailwind styles
│   ├── page.tsx            # Home page (workspace list)
│   ├── [workspace]/        # Dynamic workspace pages
│   └── api/                # API routes (can be used for backend proxying)
└── public/                 # Static assets
```

### Page Routing
```
/                       → Home (all workspaces)
/[workspace]            → Workspace dashboard (contributions list)
/[workspace]/[contrib]  → Contribution detail
```

### Client Components
- Use `"use client"` for interactive elements
- Fetch data in useEffect (simple) or consider Server Components
- Error boundaries for resilience

## Backend Middleware Stack

```
Request
  ↓
CORS
  ↓
Express.json()
  ↓
Tenant Extraction
  ↓
Route Handler
  ↓
Database Query (filtered by workspace)
  ↓
Response
```

## Development Workflow

### Adding a Feature

1. **Define types** in `packages/types/src/index.ts`
2. **Create/update schema** in `packages/database/prisma/schema.prisma`
3. **Generate migration:**
   ```bash
   pnpm db:push  # or "pnpm migrate" for named migrations
   ```
4. **Add API endpoint** in `apps/api/src/index.ts`
5. **Create frontend page** in `apps/web/app/`
6. **Test with Prisma Studio:**
   ```bash
   pnpm db:studio
   ```

### Code Organization Best Practices

**Backend**
- Separate concerns: routes, middleware, database access
- Use Prisma client singleton pattern for production
- Implement error handling with custom ApiError class

**Frontend**
- Keep components small and testable
- Use `NEXT_PUBLIC_API_URL` for API base URL
- Create API client utility file for consistency

**Shared**
- Types define contracts between frontend and backend
- Utils contain reusable logic
- Config ensures consistency across all packages

## Scalability Considerations

### Short-term (MVP Phase)
✓ Single server (all services on one machine)
✓ Single PostgreSQL instance
✓ In-process caching via Prisma
✓ Synchronous API responses

### Medium-term (Growth Phase)
- Separate frontend and backend services
- Redis for session/cache management
- Job queue (Bull, RabbitMQ) for async operations
- API rate limiting and monitoring
- Implement actual JWT authentication

### Long-term (Enterprise Phase)
- Microservices architecture (contributions, comments, notifications)
- Event-driven architecture (EventStore, Kafka)
- Multi-region deployment with Postgres replication
- Full audit logging and compliance features
- Workspace-specific data residency options

## Security Best Practices (Not Yet Implemented)

- [ ] Hash passwords with bcrypt
- [ ] Implement JWT authentication
- [ ] Add CORS domain whitelist
- [ ] Row-level security policies in PostgreSQL
- [ ] Input validation and sanitization
- [ ] Rate limiting on API endpoints
- [ ] HTTPS in production
- [ ] Environment variable encryption
- [ ] Audit logging for sensitive operations

## Deployment Checklist

- [ ] Update environment variables (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Set NODE_ENV=production
- [ ] Build Docker images for frontend and backend
- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Configure PostgreSQL backups
- [ ] Set up monitoring and alerting
- [ ] Test failover and recovery procedures
- [ ] Document runbook for common operations

## References

- [Prisma Multi-tenancy Guide](https://www.prisma.io/docs/guides/multi-tenancy)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Turborepo Handbook](https://turbo.build/repo/docs)
