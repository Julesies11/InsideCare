-- Ensure all roles exist
INSERT INTO public.ic_roles (role_name, description)
VALUES 
    ('House Manager', 'Management access for assigned houses'),
    ('Supervisor', 'Supervisory access for assigned staff and participants'),
    ('Director', 'Full executive access (similar to Admin)'),
    ('Finance Manager', 'Access to financial records, timesheets, and reporting')
ON CONFLICT (role_name) DO NOTHING;

-- 1. Permissions for House Manager
INSERT INTO public.ic_role_permissions (
    role_id, my_roster, my_timesheets, my_leave, shift_routines, participants, shift_notes, employees, timesheets, leave_requests, roster_board, houses, house_checklists, access_control, master_lists, activity_log
)
SELECT id, 'full', 'full', 'full', 'full', 'context_read_write', 'context_read_write', 'context_read_only', 'context_read_write', 'context_read_write', 'context_read_write', 'context_read_only', 'context_read_write', 'none', 'read_only', 'read_only'
FROM public.ic_roles WHERE role_name = 'House Manager'
ON CONFLICT (role_id) DO NOTHING;

-- 2. Permissions for Supervisor
INSERT INTO public.ic_role_permissions (
    role_id, my_roster, my_timesheets, my_leave, shift_routines, participants, shift_notes, employees, timesheets, leave_requests, roster_board, houses, house_checklists, access_control, master_lists, activity_log
)
SELECT id, 'full', 'full', 'full', 'full', 'context_read_only', 'context_read_only', 'none', 'none', 'none', 'context_read_only', 'context_read_only', 'context_read_only', 'none', 'read_only', 'none'
FROM public.ic_roles WHERE role_name = 'Supervisor'
ON CONFLICT (role_id) DO NOTHING;

-- 3. Permissions for Director (Full Access)
INSERT INTO public.ic_role_permissions (
    role_id, my_roster, my_timesheets, my_leave, shift_routines, participants, shift_notes, employees, timesheets, leave_requests, roster_board, houses, house_checklists, access_control, master_lists, activity_log
)
SELECT id, 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full', 'full'
FROM public.ic_roles WHERE role_name = 'Director'
ON CONFLICT (role_id) DO NOTHING;

-- 4. Permissions for Finance Manager
INSERT INTO public.ic_role_permissions (
    role_id, my_roster, my_timesheets, my_leave, shift_routines, participants, shift_notes, employees, timesheets, leave_requests, roster_board, houses, house_checklists, access_control, master_lists, activity_log
)
SELECT id, 'full', 'full', 'full', 'full', 'read_only', 'read_only', 'read_only', 'full', 'full', 'read_only', 'read_only', 'read_only', 'none', 'read_only', 'read_only'
FROM public.ic_roles WHERE role_name = 'Finance Manager'
ON CONFLICT (role_id) DO NOTHING;
