import { screen, waitFor } from '@testing-library/react';
import { RolesPage } from './roles-page';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { TABLES } from '@/config/db-tables';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

describe('RolesPage Smoke Test', () => {
  beforeEach(() => {
    server.use(
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.ROLES}`, () => {
        return HttpResponse.json([
          { id: 'role-1', role_name: 'Admin', description: 'System Admin', is_active: true, assigned_count: 5 }
        ]);
      }),
      http.get(`${SUPABASE_URL}/rest/v1/${TABLES.ROLE_PERMISSIONS}`, () => {
        return HttpResponse.json([]);
      })
    );
  });

  it('renders correctly', async () => {
    renderWithProviders(<RolesPage />);
    
    expect(screen.getByText(/Roles & Permissions/i)).toBeInTheDocument();
    
    await waitFor(() => {
        expect(screen.getByText(/Permission Matrix/i)).toBeInTheDocument();
        // Check for new granular modules
        expect(screen.getByText(/House Management/i)).toBeInTheDocument();
        expect(screen.getByText(/Daily Operations/i)).toBeInTheDocument();
        expect(screen.getByText(/Checklist History/i)).toBeInTheDocument();
    });
  });
});
