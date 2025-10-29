// src/components/ScrollToTop.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If the URL has a #hash, try to scroll to that element instead
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView(); // default is instant
        return;
      }
    }
    // Otherwise go to page top
    window.scrollTo({ top: 0, left: 0, behavior: "auto" }); // use 'smooth' if you prefer
  }, [pathname, search, hash]);

  return null;
}
