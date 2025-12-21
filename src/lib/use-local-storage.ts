import { useState, useEffect, useCallback, useRef } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void] {
  const getDefault = () =>
    typeof defaultValue === "function"
      ? (defaultValue as () => T)()
      : defaultValue;

  const defaultValueRef = useRef<() => T>(getDefault);
  defaultValueRef.current = getDefault;

  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : getDefault();
    } catch {
      return getDefault();
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  // Reset when key changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      setValue(stored ? JSON.parse(stored) : defaultValueRef.current());
    } catch {
      setValue(defaultValueRef.current());
    }
  }, [key]);

  const updateValue = useCallback((updater: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof updater === "function"
        ? (updater as (prev: T) => T)(prev)
        : updater,
    );
  }, []);

  return [value, updateValue];
}
