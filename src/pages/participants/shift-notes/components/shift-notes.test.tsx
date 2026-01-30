import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { Participants } from './shift-notes';

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

// Mock the hooks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock hooks
vi.mock('@/hooks/use-participants', () => ({
  useParticipants: vi.fn(() => ({
    participants: mockParticipants,
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-houses', () => ({
  useHouses: vi.fn(() => ({
    houses: mockHouses,
    loading: false,
    error: null,
  })),
}));

// Mock useNavigate
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Participants Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<Participants />);
    expect(container).toBeTruthy();
  });

  it('should render participant names', async () => {
    render(<Participants />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render NDIS numbers', async () => {
    render(<Participants />);

    await waitFor(() => {
      expect(screen.getByText('NDIS001')).toBeInTheDocument();
      expect(screen.getByText('NDIS002')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render house assignments', async () => {
    render(<Participants />);

    await waitFor(() => {
      const mainHouseElements = screen.getAllByText('Main House');
      expect(mainHouseElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('should render search input', () => {
    render(<Participants />);
    const searchInput = screen.getByPlaceholderText('Search Participants...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should render active users toggle', () => {
    render(<Participants />);
    const activeToggle = screen.getByLabelText(/active users/i);
    expect(activeToggle).toBeInTheDocument();
  });

  it('should render house filter button', () => {
    render(<Participants />);
    const houseButton = screen.getByRole('button', { name: /^house$/i });
    expect(houseButton).toBeInTheDocument();
  });

  it('should filter by search term', async () => {
    const user = userEvent.setup();
    render(<Participants />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search Participants...');
    await user.clear(searchInput);
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should show only active participants by default', async () => {
    render(<Participants />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      // Bob Johnson is inactive, should not appear
      expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should toggle to show all participants', async () => {
    const user = userEvent.setup();
    render(<Participants />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const activeToggle = screen.getByRole('switch');
    await user.click(activeToggle);

    await waitFor(() => {
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
