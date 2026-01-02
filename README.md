# Contribly Monorepo
> Multi-tenant SaaS platform for collaborative contributions

## Quick Start

### Prerequisites
- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose

### Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
pnpm docker:up

# Setup database
pnpm db:setup

# Run development servers
pnpm dev
```

**Frontend:** http://localhost:3000  
**Backend:** http://localhost:3001  
**Database:** localhost:5432

## Project Structure

```
contribly/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Node.js backend
├── packages/
│   ├── database/         # Prisma schema & migrations
│   ├── types/            # Shared TypeScript types
│   ├── utils/            # Shared utilities
│   └── config/           # ESLint, Prettier, tsconfig
├── docker-compose.yml    # PostgreSQL service
├── package.json          # Root workspace config
└── turbo.json           # Turborepo config
```

## Available Commands

```bash
# Development
pnpm dev                 # Start all dev servers
pnpm build              # Build all apps
pnpm test               # Run tests
pnpm lint               # Run ESLint
pnpm format             # Format with Prettier
pnpm type-check         # TypeScript type checking

# Database
pnpm db:setup           # Apply migrations + seed
pnpm db:reset           # Reset database (dev only)
pnpm db:push            # Push schema changes
pnpm db:studio          # Open Prisma Studio

# Docker
pnpm docker:up          # Start PostgreSQL
pnpm docker:down        # Stop PostgreSQL
```

## Architecture

### Frontend (apps/web)
- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS (pre-configured)
- **Auth:** NextAuth.js ready
- **Multi-tenancy:** Subdomain routing

### Backend (apps/api)
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** Prisma ORM + PostgreSQL
- **API:** REST API with middleware stack
- **Multi-tenancy:** Tenant context middleware

### Database (packages/database)
- **ORM:** Prisma
- **Database:** PostgreSQL 16
- **Migrations:** Automated with Prisma Migrate
- **Seeding:** Seed script ready for dev data

### Shared Packages
- **types:** Shared TypeScript interfaces & enums
- **utils:** Helper functions, validators, constants
- **config:** ESLint, Prettier, TypeScript base config

## Environment Setup

Create `.env.local` files:

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### apps/api/.env.local
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://contribly:contribly_dev_password@localhost:5432/contribly
JWT_SECRET=your-secret-key-change-in-production
```

### packages/database/.env.local
```
DATABASE_URL=postgresql://contribly:contribly_dev_password@localhost:5432/contribly
```

## Development Workflow

1. **Create feature branch:** `git checkout -b feature/your-feature`
2. **Make changes** across apps/packages as needed
3. **Type check:** `pnpm type-check` (required for commits)
4. **Format code:** `pnpm format`
5. **Run tests:** `pnpm test`
6. **Push and create PR**

## Multi-Tenancy Strategy

- **Workspace model:** Each tenant is a workspace with multiple members
- **Database isolation:** Row-level security with tenant ID foreign keys
- **Domain routing:** Frontend routes by subdomain (tenant.contribly.app)
- **API context:** Tenant extracted from request header or subdomain

## Database Schema

Key tables:
- `Workspace` - Tenant container
- `User` - Users with workspace memberships
- `WorkspaceMember` - User-to-workspace relationships
- `Contribution` - Main domain entity
- `Comment` - Collaborative feedback

See [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma) for full schema.

## Production Deployment

### Docker Build
```bash
docker build -f Dockerfile.prod -t contribly:latest .
```

### Environment Variables (Production)
- `DATABASE_URL` - Production PostgreSQL connection
- `JWT_SECRET` - Secure random string
- `NEXT_PUBLIC_API_URL` - Production API endpoint
- All other `.env` variables as needed

## Troubleshooting

### Database connection fails
```bash
pnpm docker:up
pnpm db:push
```

### Port conflicts
- Frontend port 3000: Change in `apps/web/package.json`
- Backend port 3001: Change in `apps/api/package.json`
- Postgres port 5432: Change in `docker-compose.yml`

### TypeScript errors
```bash
pnpm type-check
```

### Node modules issues
```bash
pnpm clean
pnpm install
pnpm db:setup
pnpm dev
```

## Additional Resources

- [Turborepo Docs](https://turbo.build)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
