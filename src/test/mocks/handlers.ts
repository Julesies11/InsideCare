import { http, HttpResponse } from 'msw';

// Mock data
const mockParticipants = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0001',
    date_of_birth: '1990-01-15',
    ndis_number: 'NDIS001',
    house_id: 'house-1',
    house_name: 'Main House',
    is_active: true,
    photo_url: null,
    address: '123 Main St',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0002',
    date_of_birth: '1985-05-20',
    ndis_number: 'NDIS002',
    house_id: 'house-2',
    house_name: 'West House',
    is_active: true,
    photo_url: null,
    address: '456 Oak Ave',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    phone: '555-0003',
    date_of_birth: '1992-08-10',
    ndis_number: 'NDIS003',
    house_id: 'house-1',
    house_name: 'Main House',
    is_active: false,
    photo_url: null,
    address: '789 Pine Rd',
  },
];

const mockHouses = [
  {
    id: 'house-1',
    name: 'Main House',
    address: '100 Main St',
    status: 'active',
  },
  {
    id: 'house-2',
    name: 'West House',
    address: '200 West St',
    status: 'active',
  },
];

export const handlers = [
  // Get participants
  http.get('*/rest/v1/participants', () => {
    return HttpResponse.json(mockParticipants);
  }),

  // Get houses
  http.get('*/rest/v1/houses', () => {
    return HttpResponse.json(mockHouses);
  }),

  // Get single participant
  http.get('*/rest/v1/participants/:id', ({ params }) => {
    const participant = mockParticipants.find(p => p.id === params.id);
    if (participant) {
      return HttpResponse.json(participant);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Update participant
  http.patch('*/rest/v1/participants/:id', async ({ request, params }) => {
    const updates = await request.json();
    const participant = mockParticipants.find(p => p.id === params.id);
    if (participant) {
      return HttpResponse.json({ ...participant, ...updates });
    }
    return new HttpResponse(null, { status: 404 });
  }),
];
