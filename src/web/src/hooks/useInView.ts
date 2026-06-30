
import { useEffect, useRef, useState } from 'react';

const supportsIO = typeof IntersectionObserver !== 'undefined';

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  const [inView, setInView] = useState(!supportsIO);

  useEffect(() => {
    if (!supportsIO) return; 
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}