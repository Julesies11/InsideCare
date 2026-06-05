import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useLocation } from 'react-router';
import { useLoadingBar } from 'react-top-loading-bar';
import { AppRoutingSetup } from './app-routing-setup';

export function AppRouting() {
  const { start, complete } = useLoadingBar({
    color: 'var(--color-primary)',
    shadow: false,
    waitingTime: 400,
    transitionTime: 200,
    height: 2,
  });

  const { loading } = useAuth();
  const [previousLocation, setPreviousLocation] = useState('');
  const location = useLocation();
  const path = location.pathname.trim();

  useEffect(() => {
    if (!loading) {
      start('static');
      setPreviousLocation(path);
      complete();
      if (path === previousLocation) {
        setPreviousLocation('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, loading]);

  useEffect(() => {
    if (!CSS.escape(window.location.hash)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [path]);

  return <AppRoutingSetup />;
}
