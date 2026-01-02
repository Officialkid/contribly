# Contribly Monorepo - Development Environment Setup

This guide will help you get the Contribly monorepo running locally.

## Prerequisites

Ensure you have the following installed:
- **Node.js** (v18+)
- **pnpm** (v8+) - [Install pnpm](https://pnpm.io/installation)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **PostgreSQL client** (optional, for manual database management)

## Step 1: Install Dependencies

```bash
cd C:\Users\DANIEL\Documents\Website Projects\contribly
pnpm install
```

This installs all dependencies across the monorepo including:
- Root workspaces
- Shared packages (config, types, utils, database)
- Frontend (Next.js app)
- Backend (Node.js API)

## Step 2: Set Up Environment Variables

Copy example environment files to `.env.local`:

```bash
# Backend API
cp apps/api/.env.local.example apps/api/.env.local

# Frontend
cp apps/web/.env.local.example apps/web/.env.local

# Database
cp packages/database/.env.local.example packages/database/.env.local
```

These files contain default development credentials. **Change them in production!**

## Step 3: Start PostgreSQL

```bash
pnpm docker:up
```

This starts a PostgreSQL container with:
- User: `contribly`
- Password: `contribly_dev_password`
- Database: `contribly`
- Port: `5432`

Verify it's running:
```bash
docker ps
```

## Step 4: Set Up Database Schema

```bash
pnpm db:setup
```

This:
1. Applies all Prisma migrations
2. Seeds the database with demo data (user, workspace, sample contribution)

After this step, you'll have:
- Demo user: `demo@contribly.app`
- Demo workspace: `demo`
- Sample contribution for testing

## Step 5: Start Development Servers

In a new terminal, run:

```bash
pnpm dev
```

This starts all development servers in parallel:
- **Frontend:** http://localhost:3000 (Next.js)
- **Backend:** http://localhost:3001 (Express API)

You'll see output like:
```
contribly-web: ▲ Next.js 14.0.0
contribly-web: - Local:        http://localhost:3000
contribly-api: 🚀 API server running at http://localhost:3001
```

## Verification

### Check Frontend
Open http://localhost:3000 in your browser. You should see:
- Contribly header
- List of workspaces (including "Demo Workspace")
- Stats on members and contributions

### Check Backend
Visit http://localhost:3001/health in your browser or use curl:
```bash
curl http://localhost:3001/health
# Response: {"status":"ok","timestamp":"2024-01-02T10:00:00.000Z"}
```

### Check Database
Open Prisma Studio to browse database:
```bash
pnpm db:studio
```

This opens an interactive database explorer at http://localhost:5555

## Common Development Tasks

### Creating a New Contribution
The API expects a request with tenant headers:
```bash
curl -X POST http://localhost:3001/api/contributions \
  -H "Content-Type: application/json" \
  -H "X-Workspace-Id: [workspace-id]" \
  -H "X-User-Id: [user-id]" \
  -d '{
    "title": "New Feature Request",
    "description": "Detailed description here"
  }'
```

### Running Type Checking
```bash
pnpm type-check
```

### Formatting Code
```bash
pnpm format
```

### Running Linting
```bash
pnpm lint
```

### Resetting Database (CAUTION: Deletes all data)
```bash
pnpm db:reset
```

### Stopping PostgreSQL
```bash
pnpm docker:down
```

## Turborepo Commands

The monorepo uses Turborepo for efficient builds and caching:

```bash
pnpm dev              # Run all dev servers
pnpm build            # Build all apps
pnpm test             # Run tests (when configured)
pnpm lint             # Lint all packages
pnpm format           # Format all code
pnpm clean            # Remove all build artifacts
```

Turborepo intelligently caches builds and only rebuilds changed packages!

## Troubleshooting

### Port Already in Use

**3000 (Frontend):**
```bash
# Change in apps/web/package.json
"dev": "next dev -p 3002"
```

**3001 (Backend):**
```bash
# Change in apps/api/.env.local
PORT=3002
```

**5432 (PostgreSQL):**
```bash
# Change in docker-compose.yml
ports:
  - "5433:5432"
```

### Database Connection Error

Ensure PostgreSQL is running:
```bash
docker ps
# Should show contribly-postgres container running
```

If not running:
```bash
pnpm docker:up
pnpm db:setup
```

### Type Errors

Clear and rebuild:
```bash
pnpm clean
pnpm install
pnpm type-check
```

### Next.js Build Issues

Clear Next.js cache:
```bash
rm -rf apps/web/.next
pnpm dev
```

## Project Structure Reference

```
contribly/
├── apps/
│   ├── web/                # Next.js 14+ frontend (App Router)
│   │   ├── app/           # App Router pages and components
│   │   ├── public/        # Static assets
│   │   └── .env.local
│   │
│   └── api/                # Node.js/Express backend
│       ├── src/           # TypeScript source
│       └── .env.local
│
├── packages/
│   ├── config/            # Shared ESLint, Prettier, tsconfig
│   ├── types/             # Shared TypeScript types
│   ├── utils/             # Shared utilities & validators
│   └── database/          # Prisma schema & migrations
│       ├── prisma/
│       │   ├── schema.prisma  # Database schema
│       │   └── seed.ts        # Seed script
│       └── .env.local
│
├── docker-compose.yml     # PostgreSQL service definition
├── turbo.json            # Turborepo configuration
├── package.json          # Root workspace configuration
└── README.md             # Project overview
```

## Next Steps

After setup:
1. **Explore the frontend:** Check out [apps/web/app/page.tsx](apps/web/app/page.tsx)
2. **Review API endpoints:** See [apps/api/src/index.ts](apps/api/src/index.ts)
3. **Understand the schema:** Check [packages/database/prisma/schema.prisma](packages/database/prisma/schema.prisma)
4. **Read the main README:** [README.md](README.md)

## Questions or Issues?

Refer to:
- [Turborepo Documentation](https://turbo.build)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com)
