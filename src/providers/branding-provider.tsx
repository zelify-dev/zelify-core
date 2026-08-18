"use client";

import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BrandingState = {
  displayName: string;
  tagline: string;
  primaryHex: string;
  accentHex: string;
  logoUrl: string;
  loginMessage: string;
};

type BrandingContextValue = {
  branding: BrandingState;
  setBranding: (next: BrandingState) => void;
  resetBranding: () => void;
};

const STORAGE_KEY = "zelify-branding-settings";

export const DEFAULT_BRANDING: BrandingState = {
  displayName: "Zelify",
  tagline: "Core banking para equipos modernos",
  primaryHex: "#1a2740",
  accentHex: "#c4f542",
  logoUrl: "/zelifyLogo_dark.svg",
  loginMessage: "Mensaje opcional en la pantalla de acceso.",
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const safe = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(safe, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function shiftHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const next = [r, g, b].map((channel) => clamp(channel + amount, 0, 255));
  return `#${next.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function getReadableText(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#102033" : "#f8fafc";
}

function applyBrandingToDocument(branding: BrandingState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const [accentR, accentG, accentB] = hexToRgb(branding.accentHex);
  const [primaryR, primaryG, primaryB] = hexToRgb(branding.primaryHex);

  root.style.setProperty("--zelify-brand-primary", branding.primaryHex);
  root.style.setProperty("--zelify-brand-primary-rgb", `${primaryR}, ${primaryG}, ${primaryB}`);
  root.style.setProperty("--zelify-brand-green", branding.accentHex);
  root.style.setProperty("--zelify-brand-green-hover", shiftHex(branding.accentHex, -18));
  root.style.setProperty("--zelify-brand-green-active", shiftHex(branding.accentHex, -34));
  root.style.setProperty("--zelify-brand-on-green", getReadableText(branding.accentHex));
  root.style.setProperty("--zelify-brand-green-rgb", `${accentR}, ${accentG}, ${accentB}`);
}

function getStoredBranding(): BrandingState {
  if (typeof window === "undefined") return DEFAULT_BRANDING;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_BRANDING;
  try {
    const parsed = JSON.parse(raw) as Partial<BrandingState>;
    return { ...DEFAULT_BRANDING, ...parsed };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_BRANDING;
  }
}

export function BrandingProvider({ children }: PropsWithChildren) {
  const [branding, setBrandingState] = useState<BrandingState>(getStoredBranding);

  useEffect(() => {
    applyBrandingToDocument(branding);
  }, [branding]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      branding,
      setBranding: (next) => {
        setBrandingState(next);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      },
      resetBranding: () => {
        setBrandingState(DEFAULT_BRANDING);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRANDING));
        }
      },
    }),
    [branding]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return context;
}