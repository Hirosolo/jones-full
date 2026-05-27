import { useEffect, useState } from "react";

export default function useScrollTop() {
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    let ticking = false;
    const scrollHandler = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollTop(y);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", scrollHandler, { passive: true });
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  return scrollTop;
}
