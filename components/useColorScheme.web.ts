import { useEffect, useState } from 'react';

export function useColorScheme() {
  const [scheme, setScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateScheme = () => setScheme(mediaQuery.matches ? 'dark' : 'light');

    updateScheme();
    mediaQuery.addEventListener('change', updateScheme);

    return () => {
      mediaQuery.removeEventListener('change', updateScheme);
    };
  }, []);

  return scheme;
}
