import { useState, useEffect } from "react";

export function usePersistentToggle(key: string, defaultValue: boolean = true) {
  const [value, setValue] = useState(defaultValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(key);
    if (saved !== null) setValue(saved === "true");
  }, [key]);

  const toggle = () => {
    setValue((prev) => {
      const next = !prev;
      localStorage.setItem(key, String(next));
      return next;
    });
  };

  return [value, toggle, isMounted] as const;
}
