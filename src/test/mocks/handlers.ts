import { http, HttpResponse } from 'msw';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jxxpufmygwbfzzpioryu.supabase.co';

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

  // Database Mocks - Houses
  http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
    return HttpResponse.json([
      {
        id: 'house-1',
        name: 'Test House 1',
        status: 'active',
        capacity: 5,
        address: '123 Test St',
      },
      {
        id: 'house-2',
        name: 'Test House 2',
        status: 'inactive',
        capacity: 3,
        address: '456 Mock Ave',
      },
    ]);
  }),

  // Database Mocks - Participants
  http.get(`${SUPABASE_URL}/rest/v1/participants`, ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    const participants = [
      {
        id: 'participant-1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
        house_id: 'house-1',
        houses: { name: 'Test House 1' },
        ndis_number: 'NDIS123',
      },
    ];

    if (idParam && idParam.startsWith('eq.')) {
      const id = idParam.replace('eq.', '');
      const participant = participants.find(p => p.id === id);
      if (participant) {
        if (request.headers.get('Accept')?.includes('vnd.pgrst.object+json')) {
          return HttpResponse.json(participant);
        }
        return HttpResponse.json([participant]);
      }
    }

    return HttpResponse.json(participants);
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/participants`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ 
      id: 'participant-1',
      name: 'John Doe',
      ...body 
    });
  }),

  // Database Mocks - Activity Log
  http.get(`${SUPABASE_URL}/rest/v1/activity_log`, () => {
    return HttpResponse.json([
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
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/activity_log`, () => {
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  // Database Mocks - Staff
  http.get(`${SUPABASE_URL}/rest/v1/staff`, ({ request }) => {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    
    const staff = [
      {
        id: 'staff-1',
        name: 'John Staff',
        email: 'john.staff@example.com',
        status: 'active',
        auth_user_id: 'test-user-id',
        role: { name: 'Administrator' }
      },
    ];

    if (idParam && idParam.startsWith('eq.')) {
      const id = idParam.replace('eq.', '');
      const member = staff.find(s => s.id === id);
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
  http.get(`${SUPABASE_URL}/rest/v1/shift_notes`, () => {
    return HttpResponse.json([
      {
        id: 'note-1',
        participant_id: 'participant-1',
        staff_id: 'staff-1',
        shift_date: new Date().toISOString().split('T')[0],
        notes: 'Everything went well.',
        participant: { id: 'participant-1', name: 'John Doe' },
        staff: { id: 'staff-1', name: 'Admin User' },
      },
    ]);
  }),

  // Generic handler for all other rest requests to avoid "unhandled request" errors
  // This MUST be last
  http.get(`${SUPABASE_URL}/rest/v1/:table`, () => {
    return HttpResponse.json([]);
  }),
];
