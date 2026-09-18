"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";
import styles from "./GlassArrowCta.module.css";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function GlassArrowCta({ href, children, className, onClick }: Props) {
  return (
    <Button
      href={href}
      variant="glass"
      size="lg"
      iconSrc="/assets/icons/arrow-circle.svg"
      iconSize={24}
      className={[styles.cta, className ?? ""].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
