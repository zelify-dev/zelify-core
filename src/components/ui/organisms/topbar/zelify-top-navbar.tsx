"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  type ZelifyTopNavItem,
  isAdministrationPath,
  resolveActiveAdminSubNavLabel,
  resolveActiveTopNavLabel,
  zelifyAdminSubNavItems,
  zelifyTopNavItems,
} from "@/config/navigation";
import { getTopNavDropdown } from "@/config/top-nav-dropdowns";
import { NavTabDropdown } from "@/components/ui/molecules/nav-tab-dropdown/nav-tab-dropdown";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { ContextSelector } from "@/components/ui/molecules/context-selector/context-selector";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu/dropdown-menu";
import { NavTab } from "@/components/ui/molecules/nav-tab/nav-tab";
import { ProfileTrigger } from "@/components/ui/molecules/profile-trigger/profile-trigger";
import { TopbarSearchBox } from "@/components/ui/molecules/search-box/topbar-search-box";

import "./zelify-top-navbar.css";

type ZelifyTopNavbarProps = {
  /** Si se omite, se infiere desde la ruta actual. */
  activeItem?: string;
  organizationLabel?: string;
  userName?: string;
  userInitials?: string;
  items?: ZelifyTopNavItem[];
};

export function ZelifyTopNavbar({
  activeItem: activeItemProp,
  organizationLabel = "ALL ORGANIZATIONS",
  userName = "Juan Carlos",
  userInitials = "JC",
  items = zelifyTopNavItems,
}: ZelifyTopNavbarProps) {
  const pathname = usePathname();
  const activeItem =
    activeItemProp ?? resolveActiveTopNavLabel(pathname, items);
  const adminSubActiveLabel = resolveActiveAdminSubNavLabel(pathname);
  const showAdminSubBar = isAdministrationPath(pathname);

  const [isCondensed, setIsCondensed] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | "create" | "view">(null);
  const lastScrollY = useRef(0);
  const createMenuRef = useRef<HTMLDivElement | null>(null);
  const viewMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      if (currentScrollY <= 12) {
        setIsCondensed(false);
      } else if (scrollingDown && currentScrollY > 64) {
        setIsCondensed(true);
      } else if (!scrollingDown) {
        setIsCondensed(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        createMenuRef.current?.contains(target) ||
        viewMenuRef.current?.contains(target)
      ) {
        return;
      }

      setOpenMenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className={`zelify-topbar-wrapper ${isCondensed ? "is-condensed" : ""}`}>
      {/* Nivel Superior: Marca y Acciones */}
      <div className="zelify-topbar-primary">
        <div className="zelify-topbar__brand-wrap">
          <BrandBlock organizationLabel={organizationLabel} />
        </div>

      <div className="zelify-topbar__actions">
        <div className="zelify-topbar__menu-anchor" ref={createMenuRef}>
          <TopbarActionButton
            tone="primary"
            isOpen={openMenu === "create"}
            onClick={() =>
              setOpenMenu((current) => (current === "create" ? null : "create"))
            }
          >
            Create
          </TopbarActionButton>
          {openMenu === "create" ? (
            <DropdownMenu
              className="zelify-topbar-dropdown"
              items={[
                "Client",
                "Organization",
                "Group",
                "Account",
                "User",
                "Communication",
              ]}
            />
          ) : null}
        </div>

        <div className="zelify-topbar__menu-anchor" ref={viewMenuRef}>
          <TopbarActionButton
            tone="secondary"
            isOpen={openMenu === "view"}
            onClick={() =>
              setOpenMenu((current) => (current === "view" ? null : "view"))
            }
          >
            View
          </TopbarActionButton>
          {openMenu === "view" ? (
            <DropdownMenu
              className="zelify-topbar-dropdown"
              items={[
                "Clients",
                "Organizations",
                "Accounts",
                "Transactions",
                "Activities",
                "Users",
                "Communications",
                "Reports",
              ]}
            />
          ) : null}
        </div>

        <TopbarSearchBox
          results={[
            { group: "Clients", label: "Andean Treasury Group" },
            { group: "Accounts", label: "002-4481 Operating Account" },
            { group: "Transactions", label: "TX-2026-04-18-88214" },
            { group: "Users", label: "Andrea Molina" },
          ]}
        />
        <AppIconButton ariaLabel="Notifications" className="zelify-topbar-icon-button">
          <BellIcon />
        </AppIconButton>
        <ProfileTrigger
          name={userName}
          initials={userInitials}
          trailingIcon={<ChevronDownIcon />}
        />
      </div>{/* Fin Nivel Superior Actions */}
      </div>{/* Fin Nivel Superior Primary */}

      {/* Nivel Inferior: Navegación de rutas */}
      <div className="zelify-topbar-secondary">
        <nav className="zelify-topbar__nav" aria-label="Primary">
          {items.map((item) => {
            const dropdown = getTopNavDropdown(item.label);
            if (dropdown?.length) {
              return (
                <NavTabDropdown
                  key={item.label}
                  label={item.label}
                  href={item.href}
                  isActive={item.label === activeItem}
                  entries={dropdown}
                />
              );
            }
            return (
              <NavTab
                key={item.label}
                label={item.label}
                href={item.href}
                isActive={item.label === activeItem}
                trailingIcon={item.hasDropdown ? <ChevronDownIcon /> : null}
              />
            );
          })}
        </nav>
      </div>

      {showAdminSubBar ? (
        <div className="zelify-topbar-tertiary">
          <nav className="zelify-topbar__nav" aria-label="Administration">
            {zelifyAdminSubNavItems.map((item) => (
              <NavTab
                key={item.href}
                label={item.label}
                href={item.href}
                variant="adminSub"
                isActive={item.label === adminSubActiveLabel}
              />
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}

type BrandBlockProps = {
  organizationLabel: string;
};

function BrandBlock({ organizationLabel }: BrandBlockProps) {
  return (
    <div className="zelify-topbar__brand">
      <Image
        src="/zelifyLogo_dark.svg"
        alt="Zelify"
        width={106}
        height={30}
        priority
      />

      <ContextSelector
        label={organizationLabel}
        icon={<ChevronDownIcon />}
      />
    </div>
  );
}

type TopbarActionButtonProps = {
  children: string;
  tone: "primary" | "secondary";
  isOpen?: boolean;
  onClick?: () => void;
};

function TopbarActionButton({
  children,
  tone,
  isOpen = false,
  onClick,
}: TopbarActionButtonProps) {
  return (
    <AppButton
      aria-haspopup="menu"
      aria-expanded={isOpen}
      onClick={onClick}
      className={`zelify-topbar-button ${tone === "primary" ? "is-primary" : "is-secondary"} ${isOpen ? "is-open" : ""}`}
    >
      {children}
      <ChevronDownIcon />
    </AppButton>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 16.25a1.87 1.87 0 0 0 1.83-1.5H7.17A1.87 1.87 0 0 0 9 16.25ZM14.25 13.25H3.75v-.75l1.5-1.5V7.75a3.75 3.75 0 1 1 7.5 0V11l1.5 1.5v.75Z"
        fill="#F8FAFC"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
