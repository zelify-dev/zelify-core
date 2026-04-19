"use client";

import "./general-setup-section-placeholder.css";

type GeneralSetupSectionPlaceholderProps = {
  title: string;
};

export function GeneralSetupSectionPlaceholder({
  title,
}: GeneralSetupSectionPlaceholderProps) {
  return (
    <div className="zelify-general-setup-placeholder">
      <h1 className="zelify-general-setup-placeholder__title">{title}</h1>
      <p className="zelify-general-setup-placeholder__hint">Contenido próximamente.</p>
    </div>
  );
}
