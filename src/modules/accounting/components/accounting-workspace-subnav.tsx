"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  accountingWorkspaceSubNavItems,
  resolveAccountingWorkspaceSubNavLabel,
} from "@/config/accounting-workspace-nav";

import "@/components/ui/organisms/settings-general-subnav/settings-general-subnav.css";

export function AccountingWorkspaceSubNav() {
  const pathname = usePathname();
  const activeLabel = resolveAccountingWorkspaceSubNavLabel(pathname);

  return (
    <div className="zelify-general-setup-subnav" role="navigation" aria-label="Accounting">
      <div className="zelify-general-setup-subnav__scroll">
        {accountingWorkspaceSubNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`zelify-general-setup-subnav__tab ${item.label === activeLabel ? "is-active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
