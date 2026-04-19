"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  generalSetupSubNavItems,
  resolveGeneralSetupSubNavLabel,
} from "@/config/general-setup-nav";

import "./settings-general-subnav.css";

export function GeneralSetupSubNav() {
  const pathname = usePathname();
  const activeLabel = resolveGeneralSetupSubNavLabel(pathname);

  return (
    <div className="zelify-general-setup-subnav" role="navigation" aria-label="General setup">
      <div className="zelify-general-setup-subnav__scroll">
        {generalSetupSubNavItems.map((item) => (
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
