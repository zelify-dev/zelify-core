"use client";

import { useEffect, useRef, useState } from "react";

import { AppInput } from "@/components/ui/atoms/input/app-input";

import "@/components/ui/organisms/topbar/zelify-top-navbar.css";

type TopbarSearchResult = {
  group: string;
  label: string;
};

type TopbarSearchBoxProps = {
  placeholder?: string;
  results?: TopbarSearchResult[];
};

export function TopbarSearchBox({
  placeholder = "Search clients, accounts, transactions",
  results = [],
}: TopbarSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (searchRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const visibleResults = query
    ? results.filter((item) =>
        `${item.group} ${item.label}`.toLowerCase().includes(query.toLowerCase())
      )
    : results.slice(0, 4);

  return (
    <div className="zelify-topbar-search-wrap" ref={searchRef}>
      <div className="zelify-topbar-search">
        <SearchIcon />
        <AppInput
          variant="ghost"
          className="zelify-topbar-search-input"
          placeholder={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
        />
      </div>

      {isOpen ? (
        <div className="zelify-topbar-search-results" role="listbox">
          {visibleResults.map((item) => (
            <button key={`${item.group}-${item.label}`} type="button" className="zelify-topbar-search-results__item">
              <span className="zelify-topbar-search-results__group">{item.group}</span>
              <strong className="zelify-topbar-search-results__label">{item.label}</strong>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <span className="zelify-topbar-search-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M11.083 10.138l3.055 3.056-.944.944-3.056-3.055a5.333 5.333 0 1 1 .945-.945ZM6.667 10.667a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
          fill="#D6DBE2"
        />
      </svg>
    </span>
  );
}
