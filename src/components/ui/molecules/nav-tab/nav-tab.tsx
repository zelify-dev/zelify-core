import type { ReactNode } from "react";

type NavTabProps = {
  label: string;
  isActive?: boolean;
  trailingIcon?: ReactNode;
};

export function NavTab({ label, isActive = false, trailingIcon }: NavTabProps) {
  return (
    <button
      type="button"
      className={`zelify-nav-tab ${isActive ? "is-active" : ""}`}
    >
      <span>{label}</span>
      {trailingIcon}
    </button>
  );
}
