import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/test-utils';
import { HouseRow, ParticipantRow } from '@/test/type-helpers';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLES } from '@/config/db-tables';
import { Participants } from './participants';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockParticipants: (Partial<ParticipantRow> & {
  houses: Partial<HouseRow>;
})[] = [
  {
    id: '1',
    participant_name: 'John Doe',
    email: 'john@example.com',
    ndis_number: 'NDIS001',
    house_id: 'house-1',
    status: 'active',
    houses: { house_name: 'Main House' },
  },
  {
    id: '2',
    participant_name: 'Jane Smith',
    email: 'jane@example.com',
    ndis_number: 'NDIS002',
    house_id: 'house-2',
    status: 'active',
    houses: { house_name: 'West House' },
  },
];

const mockHouses: Partial<HouseRow>[] = [
  {
    id: 'house-1',
    house_name: 'Main House',
    status: 'active',
  },
  {
    id: 'house-2',
    house_name: 'West House',
    status: 'active',
  },
];

describe('Participants Component', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.PARTICIPANTS}`, () => {
        return HttpResponse.json(mockParticipants);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.HOUSES}`, () => {
        return HttpResponse.json(mockHouses);
      }),
    );
  });

  it('should render participant list', async () => {
    renderWithProviders(<Participants />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('NDIS001')).toBeInTheDocument();
    expect(screen.getByText('Main House')).toBeInTheDocument();
  });

  it('should render search input', () => {
    renderWithProviders(<Participants />);
    const searchInput = screen.getByPlaceholderText(/search participants/i);
    expect(searchInput).toBeInTheDocument();
  });
});
