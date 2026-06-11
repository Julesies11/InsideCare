import { GlobalErrorBoundary } from '@/errors/global-error-boundary';
import { AppRouting } from '@/routing/app-routing';
import { BrowserRouter } from 'react-router';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './auth/providers/supabase-provider';
import { I18nProvider } from './providers/i18n-provider';
import { QueryProvider } from './providers/query-provider';
import { SettingsProvider } from './providers/settings-provider';
import { ThemeProvider } from './providers/theme-provider';
import { TooltipsProvider } from './providers/tooltips-provider';

const { BASE_URL } = import.meta.env;

export function App() {
  return (
    <GlobalErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <I18nProvider>
                <TooltipsProvider>
                  <LoadingBarContainer>
                    <BrowserRouter basename={BASE_URL}>
                      <Toaster />
                      <AppRouting />
                    </BrowserRouter>
                  </LoadingBarContainer>
                </TooltipsProvider>
              </I18nProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </QueryProvider>
    </GlobalErrorBoundary>
  );
}
