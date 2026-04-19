import Link from "next/link";
import type { ReactNode } from "react";

type NavTabProps = {
  label: string;
  href?: string;
  isActive?: boolean;
  trailingIcon?: ReactNode;
};

export function NavTab({ label, href = "#", isActive = false, trailingIcon }: NavTabProps) {
  return (
    <Link
      href={href}
      className={`zelify-nav-tab ${isActive ? "is-active" : ""}`}
    >
      <span>{label}</span>
      {trailingIcon}
    </Link>
  );
}
