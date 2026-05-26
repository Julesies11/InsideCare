-- Add House Manager Role
INSERT INTO public.ic_roles (role_name, description)
VALUES ('House Manager', 'Management access for assigned houses')
ON CONFLICT (role_name) DO NOTHING;

-- Add Supervisor Role
INSERT INTO public.ic_roles (role_name, description)
VALUES ('Supervisor', 'Supervisory access for assigned staff and participants')
ON CONFLICT (role_name) DO NOTHING;

-- Add Permissions for House Manager
INSERT INTO public.ic_role_permissions (
    role_id,
    my_roster,
    my_timesheets,
    my_leave,
    shift_routines,
    participants,
    shift_notes,
    employees,
    timesheets,
    leave_requests,
    roster_board,
    houses,
    house_checklists,
    access_control,
    master_lists,
    activity_log
)
SELECT 
    id,
    'full',                -- my_roster
    'full',                -- my_timesheets
    'full',                -- my_leave
    'full',                -- shift_routines
    'context_read_write',  -- participants
    'context_read_write',  -- shift_notes
    'context_read_only',   -- employees
    'context_read_write',  -- timesheets
    'context_read_write',  -- leave_requests
    'context_read_write',  -- roster_board
    'context_read_only',   -- houses
    'context_read_write',  -- house_checklists
    'none',                -- access_control
    'read_only',           -- master_lists
    'read_only'            -- activity_log
FROM public.ic_roles 
WHERE role_name = 'House Manager'
ON CONFLICT (role_id) DO NOTHING;

-- Add Permissions for Supervisor
INSERT INTO public.ic_role_permissions (
    role_id,
    my_roster,
    my_timesheets,
    my_leave,
    shift_routines,
    participants,
    shift_notes,
    employees,
    timesheets,
    leave_requests,
    roster_board,
    houses,
    house_checklists,
    access_control,
    master_lists,
    activity_log
)
SELECT 
    id,
    'full',                -- my_roster
    'full',                -- my_timesheets
    'full',                -- my_leave
    'full',                -- shift_routines
    'context_read_only',   -- participants
    'context_read_only',   -- shift_notes
    'none',                -- employees
    'none',                -- timesheets
    'none',                -- leave_requests
    'context_read_only',   -- roster_board
    'context_read_only',   -- houses
    'context_read_only',   -- house_checklists
    'none',                -- access_control
    'read_only',           -- master_lists
    'none'                 -- activity_log
FROM public.ic_roles 
WHERE role_name = 'Supervisor'
ON CONFLICT (role_id) DO NOTHING;
