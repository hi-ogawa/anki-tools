import { useEffect, useRef, useCallback } from "react";

export function useResize(options: {
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !panelRef.current) return;
      const {
        onWidthChange,
        minWidth = 0,
        maxWidth = Infinity,
      } = optionsRef.current;
      const panelRight = panelRef.current.getBoundingClientRect().right;
      const newWidth = panelRight - e.clientX;
      onWidthChange(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  return { panelRef, startResize };
}
