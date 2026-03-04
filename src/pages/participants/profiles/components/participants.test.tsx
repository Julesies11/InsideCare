import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { Participants } from './participants';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const mockParticipants = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    ndis_number: 'NDIS001',
    house_id: 'house-1',
    status: 'active',
    houses: { name: 'Main House' },
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    ndis_number: 'NDIS002',
    house_id: 'house-2',
    status: 'active',
    houses: { name: 'West House' },
  },
];

const mockHouses = [
  {
    id: 'house-1',
    name: 'Main House',
    status: 'active',
  },
  {
    id: 'house-2',
    name: 'West House',
    status: 'active',
  },
];

describe('Participants Component', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/participants`, () => {
        return HttpResponse.json(mockParticipants);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/houses`, () => {
        return HttpResponse.json(mockHouses);
      })
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
