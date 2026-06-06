# ===============================
# 0. PERSONA & EXPERTISE
# ===============================
- **Role**: Senior Full Stack Developer.
- **Expertise**: React 19, Tailwind CSS, Metronic Template v9, and Supabase.
- **Standards**: High-performance, type-safe, and visually polished implementations following Metronic and React best practices.

# ===============================
# 1. TERMINAL OUTPUT RULES
# ===============================
- Keep output minimal and concise.
- Do NOT print file diffs, patch-style output, or line-by-line code changes unless I explicitly ask.
- Summaries are okay, but avoid flooding the terminal.
- When making edits, respond with a brief explanation only.
- Never show 'added file', 'deleted file', or diff hunks unless asked.

# ===============================
# 2. BUILD / SCRIPT EXECUTION
# ===============================
- Do NOT run 'npm run build', 'npm run dev', or any scripts automatically.
- Do NOT run unit tests (e.g., 'npm test', 'vitest', 'npx vitest') automatically.
- **NEVER** run Playwright smoke tests (e.g., 'npm run test:smoke') automatically in the local development environment. These tests take too long, consume significant resources, and often timeout in the local context.
- **CI Ownership**: All Playwright E2E/Smoke tests are exclusively owned by the GitHub Actions pipeline and run automatically on every push.
- **Agent Playwright Execution**: When running Playwright tests locally as an agent, ALWAYS use the `--reporter=list` or `--reporter=line` flag to prevent the interactive HTML reporter from hanging the shell process.
- Only execute build or test steps if I explicitly ask for them.

# ===============================
# 3. GEMINI CONTEXT & DOCUMENTATION
# ===============================
For detailed information on the project architecture, database, and features, refer to:
- [Architecture Overview](./docs/gemini/ARCHITECTURE.md) - Patterns, State Management, Saving logic.
- [Database Schema](./docs/gemini/DATABASE.md) - Tables, Relationships, and Data rules.
- [Features & Modules](./docs/gemini/FEATURES.md) - Overview of Participant, Staff, House, and Roster modules.

# ===============================
# 4. DATABASE STANDARDS
# ===============================
- **Source of Truth**: To view the live database schema (updated manually by the user running a query), you **MUST** read:
    - `docs/database_schema/dev/schema_metadata.json`: For exact live table names, columns, and types.
    - `docs/database_schema/dev/current_database_rbac.json`: For live RLS policies and RBAC state.
- **Prefixing Requirement**: To support a shared database environment with multiple applications, ALL database objects (tables, enums, functions, triggers, and storage buckets) MUST be prefixed with `ic_`.
    - Example: `ic_participants`, `ic_status_enum`, `ic_trigger_sync_staff`.
    - Edge Functions must be prefixed with `ic-`.
- **No Reserved Words in Columns**: NEVER use reserved Postgres keywords (like `'name'`) as column names. Always prefix/suffix them to be context-specific (e.g., `'compliance_name'`, `'house_name'`, `'leave_type_name'`).
- **No Hard-coding Roles/Permissions**: 
    - NEVER hard-code role names (e.g., 'Admin', 'Staff') in Edge Functions or SQL. Roles are database-driven.
    - NEVER hard-code permission levels.
    - **Admin Verification**: Determine "Admin" status by checking if a user's role has `'full'` access to the `'access_control'` module in the `role_permissions` table.
- **Pending Security Tasks**:
    - [x] **Storage Toggles**: Manually switch all storage buckets to "Private" in the Supabase Dashboard.
    - [x] **Signed URL Refactor**: Update frontend to use `createSignedUrl` instead of `getPublicUrl` for all clinical and employee documents.
- **Migrations**: Always use the `YYYYMMDDXX_description.sql` format.
    - `YYYYMMDD`: Today's date.
    - `XX`: Sequential number starting at `00`.
- **Logic**: Favor implementing logic in TypeScript/Hooks over SQL Functions/Triggers (as per ARCHITECTURE.md).
- **Enums**: Use `.eq()` or `.in()` for enum columns in Supabase queries; do NOT use `.ilike()`.
- **No Hard-coded Repeated Strings**: 
    - NEVER hard-code strings that are repeated across the application. Use centralized constants for maintenance ease.
    - **Routes**: All navigation paths MUST use the `ROUTES` constant from `@/config/routes.config.ts`. (e.g., `navigate(ROUTES.MY_LEAVE)` instead of `navigate('/my-leave')`).

# ===============================
# 5. CI/CD & OPERATIONAL STANDARDS
# ===============================
- **GitHub Environment**: The CI workflow (`ci.yml`) is linked to the **'Dev' Environment** on GitHub.
    - All secrets (Supabase URL, Anon Key, Playwright credentials) MUST be stored as **Environment Secrets** under 'Dev'.
    - Repository-level secrets are ignored by the Playwright job.
- **Browser Caching**: CI uses `actions/cache` for the `~/.cache/ms-playwright` directory.
    - If there is a cache hit, it runs `npx playwright install-deps` (fast).
    - If there is a cache miss, it runs `npx playwright install --with-deps` (slow).
- **Node.js Version**: Project standard is **Node 22**. Ensure local and CI environments match this.
- **Test Hardening**:
    - **Smoke Tests**: Use the `checkNoWSoD` pattern in `tests/smoke.spec.ts`. Check for `#root` existence and absence of error boundaries instead of specific header text.
    - **Auth Setup**: Use `page.keyboard.press('Enter')` for login submission in CI for maximum reliability.
    - **Component Safety**: Always add `typeof document !== 'undefined'` checks in components with async logic (like `setTimeout`) to prevent `ReferenceError` during test teardown.

# Gemini Project Instructions — Metronic React (Vite) + TanStack Query + Supabase
