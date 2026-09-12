"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { GlassSurface } from "./GlassSurface";
import styles from "./Button.module.css";

type Size = "sm" | "md" | "lg";
type Variant = "solid" | "glass" | "overlay";

type Common = {
  children: ReactNode;
  iconSrc?: string;
  iconAlt?: string;
  iconSize?: number;
  size?: Size;
  glow?: boolean;
  active?: boolean;
  variant?: Variant;
  className?: string;
  decryptIcon?: boolean;
};

type ButtonAsButton = Common &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = Common & {
  href: string;
  download?: boolean;
  onClick?: () => void;
};

export function Button({
  children,
  iconSrc,
  iconAlt = "",
  iconSize,
  size = "lg",
  glow = false,
  active = false,
  variant = "solid",
  className,
  decryptIcon = false,
  ...rest
}: ButtonAsButton | ButtonAsLink) {
  const iconPx = iconSize ?? (size === "sm" ? 18 : size === "lg" ? 27 : 18);

  const content = (
    <>
      <span>{children}</span>
      {iconSrc ? (
        <img
          src={iconSrc}
          alt={iconAlt}
          width={iconPx}
          height={iconPx}
          className={`${styles.icon} ${decryptIcon ? styles.decryptIcon : ""}`}
        />
      ) : null}
    </>
  );

  if (variant === "glass") {
    const wrapClass = [
      styles.glassWrap,
      styles[`glass_${size}`],
      glow ? styles.glassGlow : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    const glass = (
      <GlassSurface variant="pill" active={active}>
        {content}
      </GlassSurface>
    );

    if ("href" in rest && rest.href) {
      const { href, download, onClick } = rest;
      if (download) {
        return (
          <a href={href} download className={wrapClass} onClick={onClick}>
            {glass}
          </a>
        );
      }
      return (
        <Link href={href} className={wrapClass} onClick={onClick}>
          {glass}
        </Link>
      );
    }

    const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button type="button" className={wrapClass} {...buttonProps}>
        {glass}
      </button>
    );
  }

  const classNames = [
    styles.button,
    styles[size],
    variant === "overlay" ? styles.overlay : "",
    glow ? styles.glow : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in rest && rest.href) {
    const { href, download, onClick } = rest;
    if (download) {
      return (
        <a href={href} download className={classNames} onClick={onClick}>
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={classNames} onClick={onClick}>
        {content}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classNames} {...buttonProps}>
      {content}
    </button>
  );
}
