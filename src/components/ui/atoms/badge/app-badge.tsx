import type { ReactNode } from "react";

type AppBadgeProps = {
  children: ReactNode;
  className?: string;
};

export function AppBadge({ children, className }: AppBadgeProps) {
  const classes = ["zelify-badge", className ?? ""].filter(Boolean).join(" ");

  return <span className={classes}>{children}</span>;
}
