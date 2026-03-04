import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import { ReactElement, ReactNode } from 'react';
import { SettingsProvider } from '@/providers/settings-provider';
import { AuthContext } from '@/auth/context/auth-context';
import { UserModel } from '@/auth/lib/models';

// Create a custom render function that includes providers
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  route?: string;
  queryClient?: QueryClient;
  user?: UserModel;
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
});

const defaultTestUser: UserModel = {
  id: 'test-user-id',
  email: 'test@example.com',
  fullname: 'Test User',
  staff_id: 'staff-1',
};

export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    user = defaultTestUser,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <AuthContext.Provider value={{
            loading: false,
            setLoading: () => {},
            saveAuth: () => {},
            user,
            setUser: () => {},
            login: async () => {},
            register: async () => {},
            requestPasswordReset: async () => {},
            resetPassword: async () => {},
            resendVerificationEmail: async () => {},
            getUser: async () => user,
            updateProfile: async () => user,
            logout: () => {},
            verify: async () => {},
            isAdmin: true,
            isStaff: true,
          }}>
            <MemoryRouter initialEntries={[route]}>
              {children}
            </MemoryRouter>
          </AuthContext.Provider>
        </SettingsProvider>
      </QueryClientProvider>
    );
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { userEvent };
