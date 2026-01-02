# Dashboard Layout Component

A comprehensive, reusable layout component for authenticated dashboard pages in the Contribly application.

## Features

✅ **Responsive Sidebar Navigation**
- Collapsible sidebar on desktop (72px → 20px width)
- Full mobile drawer menu
- Active route highlighting
- Role-based navigation items

✅ **Top Navigation Bar**
- Fixed header with notifications
- User profile display
- Mobile menu toggle
- Responsive layout

✅ **Organization Management**
- Organization selector dropdown
- Role badge (Chief Admin / Member)
- Department quick-switcher

✅ **Design System Integration**
- Uses existing Tailwind design tokens
- Consistent colors from `tailwind.config.ts`
- Utility classes from `globals.css`
- Smooth animations and transitions

✅ **Accessibility**
- Keyboard navigation support
- Screen reader friendly
- Focus states on all interactive elements
- ARIA labels where needed

## Usage

### Option 1: Automatic Layout Wrapping (Recommended)

Create a `layout.tsx` file in your route directory to automatically wrap all child pages:

\`\`\`tsx
// app/orgs/[orgId]/layout.tsx
"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
\`\`\`

Now all pages under `/orgs/[orgId]/` will automatically have the dashboard layout:

\`\`\`tsx
// app/orgs/[orgId]/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      {/* Your page content */}
    </div>
  );
}
\`\`\`

### Option 2: Individual Page Wrapping

Wrap individual pages when you need more control:

\`\`\`tsx
// app/orgs/[orgId]/page.tsx
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        {/* Your page content */}
      </div>
    </DashboardLayout>
  );
}
\`\`\`

## Layout Structure

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar                                         │
│  - Notifications, User Profile                              │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  Sidebar     │  Main Content Area                           │
│              │                                              │
│  - Logo      │  <div className="p-6 lg:p-8">               │
│  - Org       │    {children}                               │
│  - Nav       │  </div>                                      │
│  - Depts     │                                              │
│  - User      │                                              │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
\`\`\`

## Navigation Items

The layout includes role-based navigation:

| Item      | Route                          | Icon      | Visible To    |
|-----------|--------------------------------|-----------|---------------|
| Dashboard | `/orgs/{orgId}`                | Home      | All Users     |
| Payments  | `/orgs/{orgId}/payments`       | Credit Card | Chief Admin |
| Claims    | `/orgs/{orgId}/claims`         | Document  | Chief Admin   |
| Members   | `/orgs/{orgId}/members`        | Users     | Chief Admin   |
| Settings  | `/orgs/{orgId}/settings`       | Gear      | Chief Admin   |

To add more navigation items, edit the `navigationItems` array in `dashboard-layout.tsx`:

\`\`\`tsx
const navigationItems = [
  {
    name: "Your Page",
    href: \`/orgs/\${activeOrgId}/your-route\`,
    icon: <YourSVGIcon />,
    show: true, // or role-based condition
  },
  // ... other items
];
\`\`\`

## Component Classes

The layout uses utility classes from your design system:

### Cards
\`\`\`tsx
<div className="card">
  <div className="card-header">
    <h2>Title</h2>
  </div>
  <div className="card-body">
    Content
  </div>
</div>
\`\`\`

### Buttons
\`\`\`tsx
<button className="btn btn-primary">Primary Action</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-outline">Outline</button>
\`\`\`

### Inputs
\`\`\`tsx
<label className="label">Field Name</label>
<input className="input" type="text" placeholder="Enter value" />
\`\`\`

### Badges
\`\`\`tsx
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
\`\`\`

## Responsive Behavior

### Desktop (≥1024px)
- Sidebar visible (collapsible)
- Top bar aligned to right
- Spacious padding (p-8)

### Tablet (768px - 1023px)
- Sidebar hidden
- Mobile menu button visible
- Medium padding (p-6)

### Mobile (<768px)
- Full-width layout
- Hamburger menu
- Drawer navigation
- Compact padding (p-4)

## Customization

### Sidebar Width
Edit the width classes in `dashboard-layout.tsx`:

\`\`\`tsx
// Expanded: w-72 (288px)
// Collapsed: w-20 (80px)
\`\`\`

### Colors
All colors use design tokens from `tailwind.config.ts`:

- `primary` - Main brand color (#0A4D8C)
- `accent` - Secondary color (#3FAE7A)
- `background` - Page background (#F8FAFC)
- `card` - Card background (#FFFFFF)
- `border` - Border color (#E5E7EB)
- `text-primary` - Main text (#0F172A)
- `text-muted` - Secondary text (#64748B)

### Animations
Transition durations can be adjusted:

\`\`\`tsx
// Sidebar toggle: duration-300
// Hover states: transition-all
// Focus rings: ring-primary/10
\`\`\`

## Advanced Features

### Department Switcher
The layout includes a built-in department switcher that:
- Lists all departments
- Highlights active department
- Updates app context on click
- Shows "Add Department" button for Chief Admins

### User Profile Display
Shows current user information:
- Avatar (initials from email)
- Email address
- Organization name
- Role badge

### Notifications
Bell icon with red dot indicator for unread notifications (placeholder for future implementation)

## Context Dependencies

The layout requires the `OrgContext` provider:

\`\`\`tsx
// app/layout.tsx or higher level
import { OrgProvider } from "@/lib/org-context";

export default function RootLayout({ children }) {
  return (
    <OrgProvider>
      {children}
    </OrgProvider>
  );
}
\`\`\`

## Performance Considerations

- **Code splitting**: Layout is client-side only ("use client")
- **State management**: Uses React hooks for UI state
- **Transitions**: CSS transitions (no JavaScript animations)
- **Lazy loading**: Icons use inline SVG for instant rendering

## Example Dashboard Page

See `components/layouts/dashboard-layout-example.tsx` for a complete example with:
- Stats grid (4 metric cards)
- Recent activity feed
- Quick action buttons
- Responsive layout

## Troubleshooting

### Sidebar not showing
- Ensure you're wrapping pages with `<DashboardLayout>`
- Check that `OrgProvider` is in parent layout
- Verify user is authenticated

### Navigation not highlighting
- Route matching uses `usePathname()`
- Ensure `href` matches exact route
- Check for trailing slashes

### Mobile menu not working
- Verify z-index stacking context
- Check that overlay click handler fires
- Ensure state management is working

## Future Enhancements

Potential improvements:
- [ ] Notification center with real data
- [ ] User preferences (theme, sidebar state)
- [ ] Breadcrumb navigation
- [ ] Command palette (Cmd+K)
- [ ] Multi-organization quick switcher
- [ ] Keyboard shortcuts
- [ ] Real-time updates via WebSocket

## Support

For issues or questions:
1. Check existing dashboard pages for examples
2. Review design system in `tailwind.config.ts`
3. Inspect component classes in `globals.css`
4. Refer to Next.js App Router documentation
