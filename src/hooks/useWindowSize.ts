import { useState, useEffect } from 'react';

/**
 * A performant declarative hook for tracking window resizing.
 * Implements debouncing to prevent excessive React re-renders during aggressive window scaling.
 * @param delayMs Debounce delay in milliseconds
 * @returns [width, height] tuple
 */
export function useWindowSize(delayMs: number = 250): [number, number] {
  const [size, setSize] = useState<[number, number]>([0, 0]);
  
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function handleResize() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize([window.innerWidth, window.innerHeight]);
      }, delayMs);
    }

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler immediately on mount to establish baseline
    handleResize();
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [delayMs]);
  
  return size;
}
