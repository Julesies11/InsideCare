# Metronic 9 | All-in-One Tailwind based HTML/React/Next.js Template for Modern Web Applications

## Getting Started

Refer to the [Metronic Vite Documentation](https://docs.keenthemes.com/metronic-react)
for comprehensive guidance on setting up and getting started your project with Metronic.

## ReUI Components

Metronic now leverages [ReUI](https://reui.io), our open-source React component library.

Star the [ReUI on GitHub](https://github.com/keenthemes/reui) to help us grow the project and stay updated on new features!

## Project Overview & Architecture

InsideCare is a comprehensive care‑management platform built on the Metronic 9 template. It provides full‑stack management of participants, staff, houses, rostering, checklists, and real‑time notifications.

### Tech Stack
- **Frontend:** React 19 (Vite), TypeScript, Tailwind CSS 4, Shadcn/ui
- **State Management:** TanStack Query (React Query) for server‑state caching
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Testing:** Vitest, React Testing Library, Playwright smoke tests
- **Tooling:** Prettier, ESLint, Vite, Tailwind CSS via `@tailwindcss/vite`

### Key Modules
- **Participant Management** – profiles, medications, funding, documents, goals, contacts
- **Staff Management** – profiles, compliance, training, contracts, timesheets, leave
- **House Management** – house types, staff assignments, resources, calendars
- **Roster & Shifts** – roster board, shift templates, timesheets, leave requests
- **Checklists** – master templates, house‑specific checklists, shift‑assigned execution
- **Notifications** – real‑time alerts for timesheet approvals, shift assignments, etc.
- **Activity Logging** – detailed audit trail using `json‑diff‑ts` for optimized saves

### Architecture Highlights
- **Business Logic in TypeScript** – All data transformations, joins, and business rules are implemented in custom hooks and utility functions; no database‑side SQL functions or triggers are used.
- **Optimized Save System** – The participant detail page uses `json‑diff‑ts` to send only changed fields, reducing network payloads by up to 90%.
- **Row‑Level Security (RLS)** – Granular Supabase RLS policies enforce secure access per user role.
- **Real‑Time Notifications** – A centralized notification service broadcasts alerts via Supabase Realtime.
- **Mobile‑First Design** – Responsive layouts with mobile‑specific optimizations (priority hiding, compact tables, touch‑friendly interactions).

### Suggested Improvements
- **Consolidate Legacy Migrations** – The `migrations/old_consolidated/` folder could be archived or removed after verifying baseline schema.
- **Strengthen TypeScript Generics** – Some hooks could benefit from stricter generic typing to improve type safety.
- **Optimistic UI Updates** – Consider adding optimistic updates for mutations (e.g., shift assignments, checklist completions) for smoother user experience.
- **Enhanced Error Boundaries** – Expand error‑boundary coverage to gracefully handle failures in data‑heavy components.

## Login with Supabase Auth

This project uses Supabase for authentication. Follow these steps to set up and test the login functionality:

### Prerequisites

- Node.js 16.x or higher
- Npm or Yarn
- Tailwind CSS 4.x
- React 19.x
- A Supabase account and project

### Database & Migrations
The database schema is managed via timestamped SQL migrations in the `migrations/` folder.

- **Current Baseline:** `2026032000_baseline_schema.sql`
- **Archived Migrations:** Historical files are stored in `migrations/old_consolidated/`.

New changes to the database must be added as a new migration file following the `YYYYMMDDHH_description.sql` format.

### Installation
To set up the project dependencies, including those required for React 19, use the `--force` flag to resolve any dependency conflicts:

```bash
npm install --force
```

### Environment Setup

1. Make sure your `.env` file is configured with Supabase credentials:

```

VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-for-admin-functions

```

### Creating a Demo User

For testing purposes, you can create a demo user with:

```bash
npm run create-demo-user
```

This will create a user with the following credentials:

- Email: demo@kt.com
- Password: demo123

### Login Features

The login implementation includes:

- Email/Password authentication
- Google OAuth integration
- Password reset flow
- Error handling
- Token management
- Protected routes

### Setting Up the Demo Layout

Follow the [Metronic Vite Documentation](https://docs.keenthemes.com/metronic-vite/guides/layouts) to configure and use the demo layout of your choice.

### Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173/auth/signin` to test the login functionality.

### Testing Login

You can test login using:

1. The demo account credentials
2. Register a new account (when implemented)
3. Google Sign-in (requires proper OAuth setup in Supabase)

### Reporting Issues

If you encounter any issues or have suggestions for improvement, please contact us at [support@keenthemes.com](mailto:support@keenthemes.com).
Include a detailed description of the issue or suggestion, and we will work to address it in the next stable release.
