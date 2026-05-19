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
- **Source of Truth**: Before generating any SQL, migrations, or RLS policies, you **MUST** read:
    - `migrations/schema_metadata.json`: For exact table names, columns, and types.
    - `migrations/current_database_rbac.json`: For current RLS policies and RBAC state.
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

# Gemini Project Instructions — Metronic React (Vite) + TanStack Query + Supabase
