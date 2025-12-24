import { useEffect, useRef, useState } from "react";

/**
 * Ensures loading state is shown for at least `minTime` ms to avoid quick flash.
 * Returns true while either: actual loading is in progress, OR minimum time hasn't elapsed.
 */
export function useMinLoadingTime(isLoading: boolean, minTime = 300): boolean {
  const [minTimeActive, setMinTimeActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (isLoading) {
      // Clear any existing timer and start fresh
      if (timerRef.current) clearTimeout(timerRef.current);
      setMinTimeActive(true);
      timerRef.current = setTimeout(() => {
        setMinTimeActive(false);
      }, minTime);
    }
    // Don't cleanup here - let timer run to completion
  }, [isLoading, minTime]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return isLoading || minTimeActive;
}
