# Contribly Frontend - Next.js Dashboard

Complete multi-tenant SaaS dashboard for Contribly contribution management platform.

## Features

### Authentication & Access Control
- Email/password registration and login
- Invite link acceptance (new user registration or existing account)
- Role-based access control (Chief Admin, Department Admin, Member)
- JWT authentication with HTTP-only cookies

### Organization Management
- Multi-organization support with org switching
- Department management (Chief Admin only)
- User role assignment and management
- Invite link generation and tracking

### Dashboards
1. **Chief Admin Dashboard**
   - Organization-wide contribution summaries
   - Department-wise performance overview
   - Member list with payment references
   - Year-based filtering

2. **Department Admin Dashboard**
   - Department-specific metrics
   - Member balances and contribution history
   - Quick actions (generate invites, request withdrawals)
   - Pending claims for approval

3. **Member Dashboard**
   - Personal balance and contribution summary
   - Months cleared calculation
   - Pending carry-forward amount
   - Quick actions (record payment, view claims)

### Core Features
- **Payment Management**: Record payments, match to members, track status
- **Carry-Forward Calculation**: Dynamic monthly clearance tracking
- **Payment Claims**: Submit claims for unmatched payments, approve/reject flow
- **Withdrawals**: Request funds with OTP verification and Chief Admin approval
- **Audit Logging**: Track all sensitive operations

## Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx                          # Root layout with org context
│   ├── page.tsx                            # Home page (redirects to login)
│   ├── login/page.tsx                      # Login page
│   ├── register/page.tsx                   # Registration page
│   ├── invites/[code]/page.tsx            # Invite acceptance flow
│   ├── orgs/[orgId]/
│   │   ├── page.tsx                        # Main dashboard (routes by role)
│   │   ├── payments/page.tsx               # Payment management
│   │   ├── claims/page.tsx                 # Claims management
│   │   ├── withdrawals/page.tsx            # Withdrawal requests
│   │   └── departments/[deptId]/page.tsx  # Department details
│   └── globals.css                         # Global styles
├── components/
│   ├── sidebar.tsx                         # Main navigation sidebar
│   ├── ui.tsx                              # Reusable UI components
│   ├── payments-view.tsx                   # Payments list & filters
│   ├── claims-view.tsx                     # Claims list & approval
│   ├── withdrawal-form.tsx                 # Withdrawal request form
│   └── dashboards/
│       ├── chief-admin.tsx                 # Chief admin dashboard
│       ├── dept-admin.tsx                  # Department admin dashboard
│       └── member.tsx                      # Member dashboard
├── lib/
│   ├── api-client.ts                       # API wrapper with auto header injection
│   ├── types.ts                            # TypeScript interfaces
│   └── org-context.tsx                     # React org/dept context
├── next.config.ts                          # Next.js configuration
├── tailwind.config.ts                      # Tailwind CSS config
├── postcss.config.js                       # PostCSS config
├── tsconfig.json                           # TypeScript config
└── .env.example                            # Environment variables template
```

## Setup & Installation

### Prerequisites
- Node.js 18+
- Backend API running on http://localhost:3001/api

### Installation

1. **Install dependencies**
```bash
cd apps/web
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env.local
```

Then edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

3. **Run development server**
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## API Integration

### API Client (`lib/api-client.ts`)

The API client automatically:
- Injects `x-organization-id` and `x-department-id` headers on every request
- Handles authentication (JWT cookies)
- Provides type-safe methods for all backend endpoints

#### Usage
```typescript
import { apiClient } from '@/lib/api-client';

// Authentication
await apiClient.login(email, password);
await apiClient.register({ email, password, firstName, lastName });
await apiClient.logout();

// Organizations
await apiClient.listOrganizations();
await apiClient.getOrganization(orgId);

// Departments
await apiClient.listDepartments(orgId);
await apiClient.createDepartment(orgId, { name, monthlyAmount });

// Payments
await apiClient.recordPayment(orgId, { amount, reference, transactionDate, departmentId });
await apiClient.listPayments(orgId, status);
await apiClient.matchPayment(orgId, paymentId, { userId, departmentId });

// Claims
await apiClient.submitClaim(orgId, { amount, userId, departmentId });
await apiClient.approveClaim(orgId, claimId);
await apiClient.rejectClaim(orgId, claimId);

// Withdrawals
await apiClient.requestWithdrawal(orgId, { amount, accountInformation });
await apiClient.listWithdrawals(orgId, { departmentId });
```

## State Management

### Organization Context (`lib/org-context.tsx`)

Global state for:
- Current user profile
- Active organization
- Active department
- Available departments
- Loading and error states

```typescript
import { useOrg } from '@/lib/org-context';

export function MyComponent() {
  const { user, activeOrgId, activeOrg, activeDeptId, setActiveDeptId } = useOrg();
  
  return <div>{activeOrg?.name}</div>;
}
```

## Component Architecture

### Reusable Components (`components/ui.tsx`)

- **Card**: Container with title and content
- **Table**: Data table with headers and rows
- **Badge**: Status indicator with color coding
- **Loading**: Spinner with message
- **Error**: Error alert box
- **EmptyState**: Call-to-action for empty lists

### Dashboard Components

Each dashboard component handles:
- Data fetching with org/dept context
- Loading/error/empty states
- User role-based rendering
- Quick action buttons

## Authentication Flow

1. **Login/Register** → Sets JWT cookie
2. **Home Page** → Checks auth status, redirects to org dashboard if authenticated
3. **Org Context** → Fetches user, orgs, departments on mount
4. **Sidebar** → Allows org/dept switching
5. **Protected Routes** → API calls include org/dept headers; backend validates access

## Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables (Production)
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## Key Design Patterns

### 1. Org Context Auto-Sync
- Context fetches user/orgs on mount
- Auto-fetches departments when org changes
- Sidebar allows switching without page reload

### 2. Header-Based Isolation
- Every API call includes org/dept headers
- Backend validates user has access to that org/dept
- No client-side data leakage

### 3. Role-Based Routing
- Dashboard auto-routes based on user.role
- Components receive role and conditionally render
- Sensitive actions only shown to authorized roles

### 4. Component Composition
- Small, reusable UI components
- Dashboard components compose them
- Page components compose dashboards

## Common Tasks

### Adding a New Page
1. Create file in `app/orgs/[orgId]/new-feature/page.tsx`
2. Use `useOrg()` hook for context
3. Fetch data via `apiClient.methodName()`
4. Return JSX with loading/error/empty states

### Adding a New API Endpoint
1. Add method to `lib/api-client.ts`
2. Ensure org/dept headers are injected via `options`
3. Export TypeScript types from `lib/types.ts`
4. Use in components via `apiClient.methodName()`

### Styling
- All components use Tailwind CSS
- Extend colors/spacing in `tailwind.config.ts`
- Global styles in `app/globals.css`

## Troubleshooting

### API Connection Issues
- Check `NEXT_PUBLIC_API_URL` environment variable
- Ensure backend is running on configured port
- Check browser DevTools Network tab for CORS errors

### Authentication Issues
- Clear cookies and localStorage: `DevTools → Application → Storage`
- Login again and check network tab for auth token
- Verify backend is setting HTTP-only cookies

### State Not Updating
- Check React DevTools for context provider
- Verify `useOrg()` is called inside OrgProvider
- Check browser console for error messages

## Performance Optimizations

- Suspense boundaries for async components
- Loading states prevent flickering
- API responses cached at browser level
- Tailwind CSS with tree-shaking

## Next Steps

- [ ] Add dark mode toggle
- [ ] Implement data export (CSV/PDF)
- [ ] Add real-time notifications
- [ ] Implement member search/filtering
- [ ] Add bulk payment import
- [ ] Implement audit log viewer
- [ ] Add two-factor authentication
