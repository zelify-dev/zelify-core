"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/common/language-switcher/language-switcher";
import {
  type ZelifyTopNavItem,
  isAccountingPath,
  isAdministrationPath,
  resolveActiveAccountingSubNavId,
  resolveActiveAdminSubNavId,
  zelifyAccountingSubNavItems,
  resolveActiveTopNavId,
  zelifyAdminSubNavItems,
  zelifyTopNavItems,
} from "@/config/navigation";
import { getTopNavDropdown, resolveTopNavDropdown } from "@/config/top-nav-dropdowns";
import { NavTabDropdown } from "@/components/ui/molecules/nav-tab-dropdown/nav-tab-dropdown";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { ContextSelector } from "@/components/ui/molecules/context-selector/context-selector";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu/dropdown-menu";
import { NavTab } from "@/components/ui/molecules/nav-tab/nav-tab";
import { ProfileMenu } from "@/components/ui/molecules/profile-trigger/profile-menu";
import { TopbarSearchBox } from "@/components/ui/molecules/search-box/topbar-search-box";
import { useI18n } from "@/providers/i18n-provider";

import "./zelify-top-navbar.css";

const CREATE_MENU_KEYS = [
  "topbar.createMenu.client",
  "topbar.createMenu.organization",
  "topbar.createMenu.group",
  "topbar.createMenu.account",
  "topbar.createMenu.user",
  "topbar.createMenu.communication",
] as const;

const VIEW_MENU_KEYS = [
  "topbar.viewMenu.clients",
  "topbar.viewMenu.organizations",
  "topbar.viewMenu.accounts",
  "topbar.viewMenu.transactions",
  "topbar.viewMenu.activities",
  "topbar.viewMenu.users",
  "topbar.viewMenu.communications",
  "topbar.viewMenu.reports",
] as const;

type ZelifyTopNavbarProps = {
  /** Si se omite, se infiere desde la ruta actual. */
  activeNavId?: string;
  organizationLabel?: string;
  userName?: string;
  userInitials?: string;
  items?: ZelifyTopNavItem[];
};

export function ZelifyTopNavbar({
  activeNavId: activeNavIdProp,
  organizationLabel: organizationLabelProp,
  userName = "Juan Carlos",
  userInitials = "JC",
  items = zelifyTopNavItems,
}: ZelifyTopNavbarProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const activeNavId = activeNavIdProp ?? resolveActiveTopNavId(pathname, items);
  const adminSubActiveId = resolveActiveAdminSubNavId(pathname);
  const accountingSubActiveId = resolveActiveAccountingSubNavId(pathname);
  const showAdminSubBar = isAdministrationPath(pathname);
  const showAccountingSubBar = isAccountingPath(pathname);
  const organizationLabel = organizationLabelProp ?? t("org.allOrganizations");

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
          <BrandBlock organizationLabel={organizationLabel} brandAlt={t("topbar.brandAlt")} />
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
              {t("topbar.create")}
            </TopbarActionButton>
            {openMenu === "create" ? (
              <DropdownMenu
                className="zelify-topbar-dropdown"
                items={CREATE_MENU_KEYS.map((key) => t(key))}
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
              {t("topbar.view")}
            </TopbarActionButton>
            {openMenu === "view" ? (
              <DropdownMenu
                className="zelify-topbar-dropdown"
                items={VIEW_MENU_KEYS.map((key) => t(key))}
              />
            ) : null}
          </div>

          <TopbarSearchBox
            placeholder={t("topbar.searchPlaceholder")}
            results={[
              {
                group: t("topbar.search.groupClients"),
                label: t("topbar.search.sampleOrg"),
              },
              {
                group: t("topbar.search.groupAccounts"),
                label: t("topbar.search.sampleAccount"),
              },
              {
                group: t("topbar.search.groupTransactions"),
                label: t("topbar.search.sampleTx"),
              },
              {
                group: t("topbar.search.groupUsers"),
                label: t("topbar.search.sampleUser"),
              },
            ]}
          />
          <AppIconButton
            ariaLabel={t("topbar.notifications")}
            className="zelify-topbar-icon-button"
          >
            <BellIcon />
          </AppIconButton>
          <ProfileMenu name={userName} initials={userInitials} />
          <LanguageSwitcher />
        </div>
        {/* Fin Nivel Superior Actions */}
      </div>
      {/* Fin Nivel Superior Primary */}

      {/* Nivel Inferior: Navegación de rutas */}
      <div className="zelify-topbar-secondary">
        <nav className="zelify-topbar__nav" aria-label={t("topbar.navPrimary")}>
          {items.map((item) => {
            const rawDropdown = getTopNavDropdown(item.id);
            const dropdown = rawDropdown ? resolveTopNavDropdown(rawDropdown, t) : null;
            if (dropdown?.length) {
              return (
                <NavTabDropdown
                  key={item.id}
                  instanceId={item.id}
                  label={t(item.labelKey)}
                  href={item.href}
                  isActive={item.id === activeNavId}
                  entries={dropdown}
                />
              );
            }
            return (
              <NavTab
                key={item.id}
                label={t(item.labelKey)}
                href={item.href}
                isActive={item.id === activeNavId}
                trailingIcon={item.hasDropdown ? <ChevronDownIcon /> : null}
              />
            );
          })}
        </nav>
      </div>

      {showAccountingSubBar ? (
        <div className="zelify-topbar-tertiary">
          <nav
            className="zelify-topbar__nav"
            aria-label={t("topbar.navAccounting")}
          >
            {zelifyAccountingSubNavItems.map((item) => (
              <NavTab
                key={item.href}
                label={t(item.labelKey)}
                href={item.href}
                variant="adminSub"
                isActive={item.id === accountingSubActiveId}
              />
            ))}
          </nav>
        </div>
      ) : null}

      {showAdminSubBar ? (
        <div className="zelify-topbar-tertiary">
          <nav className="zelify-topbar__nav" aria-label={t("topbar.navAdministration")}>
            {zelifyAdminSubNavItems.map((item) => (
              <NavTab
                key={item.href}
                label={t(item.labelKey)}
                href={item.href}
                variant="adminSub"
                isActive={item.id === adminSubActiveId}
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
  brandAlt: string;
};

function BrandBlock({ organizationLabel, brandAlt }: BrandBlockProps) {
  return (
    <div className="zelify-topbar__brand">
      <Image
        src="/zelifyLogo_dark.svg"
        alt={brandAlt}
        width={106}
        height={30}
        priority
      />

      <ContextSelector label={organizationLabel} icon={<ChevronDownIcon />} />
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
