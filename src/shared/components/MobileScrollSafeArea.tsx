"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const MOBILE_QUERY = "(max-width: 900px)";

/** Long scroll pages where iOS bottom jitter needs overscroll + end spacer tweaks. */
const SCROLL_SAFE_PATHS = new Set(["/hire-me", "/arsenal"]);

function isScrollSafePath(pathname: string) {
  return SCROLL_SAFE_PATHS.has(pathname);
}

export function MobileScrollSafeArea() {
  const pathname = usePathname();

  useEffect(() => {
    const apply = () => {
      const mobile = window.matchMedia(MOBILE_QUERY).matches;
      if (!mobile || !isScrollSafePath(pathname)) {
        delete document.documentElement.dataset.mobileScrollSafe;
        return;
      }
      document.documentElement.dataset.mobileScrollSafe = "true";
    };

    apply();
    return () => {
      delete document.documentElement.dataset.mobileScrollSafe;
    };
  }, [pathname]);

  return null;
}
