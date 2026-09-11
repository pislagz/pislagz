"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { NAV_ITEMS, SOCIAL } from "@shared/constants";
import { Button } from "@shared/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import styles from "./Header.module.css";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const hireActive = pathname === "/hire-me";

  return (
    <header className={styles.header}>
      <Logo />
      <nav className={styles.desktopNav} aria-label="Primary">
        <div className={styles.links}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${active ? styles.active : ""} ${
                  active && item.href === "/play" ? styles.playActive : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <Button
          href="/hire-me"
          variant="glass"
          iconSrc="/assets/icons/work.svg"
          iconSize={18}
          size="md"
          active={hireActive}
        >
          hire me
        </Button>
        <div className={styles.social}>
          <a href={SOCIAL.github} target="_blank" rel="noreferrer" aria-label="GitHub">
            <img src="/assets/icons/github.svg" alt="" width={18} height={18} />
          </a>
          <a href={SOCIAL.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <img src="/assets/icons/linkedin.svg" alt="" width={17} height={17} />
          </a>
        </div>
      </nav>
      <button
        ref={menuButtonRef}
        type="button"
        className={styles.menuButton}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} originRef={menuButtonRef} />
    </header>
  );
}
