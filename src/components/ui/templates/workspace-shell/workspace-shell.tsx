"use client";

import { usePathname } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { zelifyTopNavItems } from "@/config/navigation";

type WorkspaceShellProps = {
  children: React.ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  
  // Encontrar el item activo basado en el href
  const activeItem = zelifyTopNavItems.find(item => 
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  )?.label || "Dashboard";

  return (
    <div className="zelify-workspace-shell">
      <ZelifyTopNavbar activeItem={activeItem} />
      {children}
    </div>
  );
}
