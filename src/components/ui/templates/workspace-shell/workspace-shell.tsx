"use client";

import { usePathname } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { resolveActiveTopNavLabel, zelifyTopNavItems } from "@/config/navigation";

type WorkspaceShellProps = {
  children: React.ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  
  const activeItem = resolveActiveTopNavLabel(pathname, zelifyTopNavItems);

  return (
    <div className="zelify-workspace-shell">
      <ZelifyTopNavbar activeItem={activeItem} />
      {children}
    </div>
  );
}
