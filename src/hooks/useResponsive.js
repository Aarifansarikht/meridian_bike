import { useSyncExternalStore } from 'react';

function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useResponsive() {
  const isMobile = useMediaQuery('(max-width: 760px)');
  const isTablet = useMediaQuery('(min-width: 761px) and (max-width: 1100px)');
  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet };
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
