"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";

import "./settings-workspace-shared.css";
import "./branding-screen.css";

export function BrandingScreen() {
  const [displayName, setDisplayName] = useState("Zelify");
  const [tagline, setTagline] = useState("Core banking para equipos modernos");
  const [primaryHex, setPrimaryHex] = useState("#1a2740");
  const [accentHex, setAccentHex] = useState("#c4f542");
  const [logoUrl, setLogoUrl] = useState("https://zelify.com/logo.svg");
  const [loginMessage, setLoginMessage] = useState("Entorno de demostración. Los cambios no afectan producción.");

  return (
    <div className="zelify-settings-workspace zelify-branding">
      <div className="zelify-branding__head">
        <h1 className="zelify-settings-workspace__title">Marca e identidad</h1>
        <span className="zelify-branding__chip">Datos de demostración</span>
      </div>
      <p className="zelify-branding__lead">
        Define cómo ve tu institución la aplicación: nombre visible, colores y mensajes del acceso.
      </p>

      <div className="zelify-branding__grid">
        <section className="zelify-policy-card zelify-branding__form">
          <h2>Identidad</h2>
          <label className="zelify-branding__field">
            Nombre para mostrar
            <AppInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label className="zelify-branding__field">
            Eslogan (subtítulo)
            <AppInput value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </label>
          <label className="zelify-branding__field">
            URL del logotipo
            <AppInput value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
          </label>
          <label className="zelify-branding__field">
            Mensaje en pantalla de login
            <AppInput value={loginMessage} onChange={(e) => setLoginMessage(e.target.value)} />
          </label>
        </section>

        <section className="zelify-policy-card zelify-branding__colors">
          <h2>Paleta</h2>
          <div className="zelify-branding__color-row">
            <label>
              Primario
              <input type="color" value={primaryHex} onChange={(e) => setPrimaryHex(e.target.value)} aria-label="Color primario" />
              <AppInput value={primaryHex} onChange={(e) => setPrimaryHex(e.target.value)} />
            </label>
            <label>
              Acento
              <input type="color" value={accentHex} onChange={(e) => setAccentHex(e.target.value)} aria-label="Color de acento" />
              <AppInput value={accentHex} onChange={(e) => setAccentHex(e.target.value)} />
            </label>
          </div>
          <div
            className="zelify-branding__preview"
            style={{
              background: `linear-gradient(135deg, ${primaryHex} 0%, ${primaryHex}dd 45%, ${accentHex} 100%)`,
            }}
          >
            <div className="zelify-branding__preview-card">
              <strong style={{ color: primaryHex }}>{displayName || "Institución"}</strong>
              <span style={{ color: "#475569" }}>{tagline}</span>
              <span className="zelify-branding__preview-cta" style={{ background: accentHex, color: primaryHex }}>
                Acción principal
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="zelify-policy-footer">
        <AppButton type="button" tone="neutral">
          Restablecer borrador
        </AppButton>
        <AppButton type="button" tone="primary">
          Guardar marca
        </AppButton>
      </div>
    </div>
  );
}
