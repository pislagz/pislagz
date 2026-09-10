"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COPYRIGHT } from "@shared/constants";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

export function Footer() {
  const onHirePage = usePathname() === "/hire-me";

  return (
    <footer className={styles.footer}>
      <div className={styles.panel}>
        <div className={styles.inner}>
          <Logo variant="footer" />
          <p className={styles.copy}>{COPYRIGHT}</p>
          <Link href={onHirePage ? "/" : "/hire-me"} className={styles.message}>
            {onHirePage ? "Homepage" : "Send message"}
            <img
              src={onHirePage ? "/assets/icons/home.svg" : "/assets/icons/send.svg"}
              alt=""
              width={12}
              height={12}
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
