import { http, HttpResponse } from 'msw';
import { TABLES } from '@/config/db-tables';
import {
  ActivityLogRow,
  HouseRow,
  LeaveRequestRow,
  NotificationRow,
  ParticipantRow,
  Row,
  ShiftRow,
  StaffRow,
  TimesheetRow,
} from '../type-helpers';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://rdnaqrzqpcicskylmsyl.supabase.co';

export const handlers = [
  // Auth Mocks
  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'test-user-id',
      email: 'test@example.com',
      staff_id: 'staff-1',
      user_metadata: { is_admin: true, staff_id: 'staff-1' },
    });
  }),

  // Edge Function Mocks
  http.post(`${SUPABASE_URL}/functions/v1/ic-admin-auth-status`, () => {
    return HttpResponse.json([
      {
        id: 'test-user-id',
        email: 'test@example.com',
        last_sign_in_at: '2026-05-25T10:00:00Z',
        created_at: '2026-01-01T10:00:00Z',
        invited_at: '2026-01-01T10:00:00Z',
      },
    ]);
  }),

  // Database Mocks - Houses
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSES}`, ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    const houses: Partial<HouseRow>[] = [
      {
        id: 'house-1',
        house_name: 'Test House 1',
        status: 'active',
        capacity: 5,
        address: '123 Test St',
      },
      {
        id: 'house-2',
        house_name: 'Test House 2',
        status: 'inactive',
        capacity: 3,
        address: '456 Mock Ave',
      },
    ];

    if (idParam && idParam.startsWith('eq.')) {
      const id = idParam.replace('eq.', '');
      const house = houses.find((h) => h.id === id);
      if (house) {
        if (request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
          return HttpResponse.json(house);
        }
        return HttpResponse.json([house]);
      }
    }

    return HttpResponse.json(houses);
  }),

  // Database Mocks - Participants
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.PARTICIPANTS}`, ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    const participants: (Partial<ParticipantRow> & {
      houses?: Partial<HouseRow>;
    })[] = [
      {
        id: 'participant-1',
        participant_name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
        house_id: 'house-1',
        houses: { house_name: 'Test House 1' },
        ndis_number: 'NDIS123',
      },
    ];

    if (idParam && idParam.startsWith('eq.')) {
      const id = idParam.replace('eq.', '');
      const participant = participants.find((p) => p.id === id);
      if (participant) {
        if (request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
          return HttpResponse.json(participant);
        }
        return HttpResponse.json([participant]);
      }
    }

    return HttpResponse.json(participants);
  }),

  http.patch(
    `${SUPABASE_URL}/rest/v1/${TABLES.PARTICIPANTS}`,
    async ({ request }) => {
      const body = await request.json();
      return HttpResponse.json({
        id: 'participant-1',
        participant_name: 'John Doe',
        ...body,
      });
    },
  ),

  // Database Mocks - Activity Log
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.ACTIVITY_LOG}`, () => {
    const logs: Partial<ActivityLogRow>[] = [
      {
        id: 'log-1',
        activity_type: 'create',
        entity_type: 'participant',
        entity_id: 'participant-1',
        entity_name: 'John Doe',
        description: 'New participant created: John Doe',
        user_name: 'admin@example.com',
        created_at: new Date().toISOString(),
      },
    ];
    return HttpResponse.json(logs);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/${TABLES.ACTIVITY_LOG}`, () => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  // Database Mocks - Staff
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF}`, ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    const staff: (Partial<StaffRow> & { role?: { role_name: string } })[] = [
      {
        id: 'staff-1',
        staff_name: 'John Staff',
        email: 'john.staff@example.com',
        status: 'active',
        auth_user_id: 'test-user-id',
        role: { role_name: 'Administrator' },
      },
    ];

    if (idParam && idParam.startsWith('eq.')) {
      const id = idParam.replace('eq.', '');
      const member = staff.find((s) => s.id === id);
      if (member) {
        if (request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
          return HttpResponse.json(member);
        }
        return HttpResponse.json([member]);
      }
    }

    return HttpResponse.json(staff);
  }),

  // Database Mocks - Shift Notes
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.SHIFT_NOTES}`, () => {
    const notes: (Partial<Row<'ic_shift_notes'>> & {
      participant?: Partial<ParticipantRow>;
      staff?: Partial<StaffRow>;
    })[] = [
      {
        id: 'note-1',
        participant_id: 'participant-1',
        staff_id: 'staff-1',
        start_date: new Date().toISOString().split('T')[0],
        notes: 'Everything went well.',
        participant: { id: 'participant-1', participant_name: 'John Doe' },
        staff: { id: 'staff-1', staff_name: 'Admin User' },
      },
    ];
    return HttpResponse.json(notes);
  }),

  // Database Mocks - Staff Shifts
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.STAFF_SHIFTS}`, ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    const shifts: (Partial<ShiftRow> & { house?: Partial<HouseRow> })[] = [
      {
        id: 'shift-1',
        staff_id: 'staff-1',
        house_id: 'house-1',
        start_date: '2026-03-10',
        end_date: '2026-03-10',
        start_time: '08:00:00',
        end_time: '16:00:00',
        shift_template: 'Morning Shift',
        house: { house_name: 'Test House 1' },
      },
    ];

    if (idParam && idParam.startsWith('eq.')) {
      const id = idParam.replace('eq.', '');
      const shift = shifts.find((s) => s.id === id);
      if (shift) {
        if (request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
          return HttpResponse.json(shift);
        }
        return HttpResponse.json([shift]);
      }
    }

    return HttpResponse.json(shifts);
  }),

  // Database Mocks - Timesheets
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () => {
    return HttpResponse.json([]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/${TABLES.TIMESHEETS}`, () => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  // Database Mocks - Shift Assigned Checklists
  http.get(
    `${SUPABASE_URL}/rest/v1/${TABLES.SHIFT_ASSIGNED_CHECKLISTS}`,
    () => {
      return HttpResponse.json([]);
    },
  ),

  // Database Mocks - Leave Types
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.LEAVE_TYPES}`, () => {
    const leaveTypes: Partial<Row<'ic_leave_types'>>[] = [
      { id: 'leave-type-1', leave_type_name: 'Annual Leave', is_active: true },
      { id: 'leave-type-2', leave_type_name: 'Sick Leave', is_active: true },
    ];
    return HttpResponse.json(leaveTypes);
  }),

  // Database Mocks - Leave Requests
  http.get(
    `${SUPABASE_URL}/rest/v1/${TABLES.LEAVE_REQUESTS}`,
    ({ request }) => {
      const url = new URL(request.url);
      const idParam = url.searchParams.get('id');

      const requests: Partial<LeaveRequestRow>[] = [
        {
          id: 'leave-1',
          staff_id: 'staff-1',
          leave_type_id: 'leave-type-1',
          start_date: '2026-06-01',
          end_date: '2026-06-05',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ];

      if (idParam && idParam.startsWith('eq.')) {
        const id = idParam.replace('eq.', '');
        const req = requests.find((r) => r.id === id);
        if (req) {
          if (
            request.headers.get('Accept')?.includes('vnd.pgrst.object+json')
          ) {
            return HttpResponse.json(req);
          }
          return HttpResponse.json([req]);
        }
      }
      return HttpResponse.json(requests);
    },
  ),

  // Database Mocks - Role Permissions
  http.get(`${SUPABASE_URL}/rest/v1/${TABLES.ROLE_PERMISSIONS}`, () => {
    const perms: Partial<Row<'ic_role_permissions'>>[] = [
      {
        role_id: 'role-1',
        participants: 'full',
        shift_notes: 'full',
        houses: 'full',
        roster_board: 'full',
        employees: 'full',
      },
      {
        role_id: 'role-2',
        participants: 'context_read_write',
        shift_notes: 'context_read_write',
        houses: 'context_read_write',
        roster_board: 'read_only',
        employees: 'read_only',
      },
    ];
    return HttpResponse.json(perms);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/${TABLES.ROLE_PERMISSIONS}`, () => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  // Generic handler for all other rest requests to avoid "unhandled request" errors
  // This MUST be last
  http.get(`${SUPABASE_URL}/rest/v1/:table`, () => {
    return HttpResponse.json([]);
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/:table`, () => {
    return HttpResponse.json({ success: true });
  }),
];
