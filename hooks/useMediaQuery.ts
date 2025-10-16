import { useState, useEffect } from 'react';

/**
 * A custom hook to check if the viewport matches a given media query.
 * It's optimized to prevent re-renders and handles server-side rendering gracefully.
 * @param query The media query string (e.g., '(max-width: 767px)')
 * @returns boolean indicating if the query matches.
 */
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use the modern `addEventListener` which is more performant
    mediaQueryList.addEventListener('change', listener);

    // Ensure the state is correct on mount
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};

export default useMediaQuery;
