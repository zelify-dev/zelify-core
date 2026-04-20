"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";

import "./settings-workspace-shared.css";
import "./internal-controls-screen.css";

export function InternalControlsScreen() {
  const [makerChecker, setMakerChecker] = useState({
    approveLoan: true,
    disburseLoan: true,
    closeAccount: false,
  });
  const [timeoutMin, setTimeoutMin] = useState("20");
  const [maxFailedLogin, setMaxFailedLogin] = useState("5");

  return (
    <div className="zelify-settings-workspace">
      <h1 className="zelify-settings-workspace__title">Internal Controls</h1>

      <section className="zelify-policy-card">
        <h2>Maker-Checker</h2>
        <div className="zelify-policy-list">
          {[
            ["approveLoan", "Aprobar Préstamo"],
            ["disburseLoan", "Desembolsar"],
            ["closeAccount", "Cerrar Cuenta"],
          ].map(([key, label]) => (
            <label key={key} className="zelify-policy-item">
              <span>{label}</span>
              <label className="zelify-switch">
                <input
                  type="checkbox"
                  checked={makerChecker[key as keyof typeof makerChecker]}
                  onChange={(e) =>
                    setMakerChecker((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                />
                <span />
              </label>
            </label>
          ))}
        </div>
      </section>

      <section className="zelify-policy-card">
        <h2>Sesión</h2>
        <div className="zelify-policy-grid">
          <label>
            Timeout inactividad (minutos)
            <AppInput type="number" value={timeoutMin} onChange={(e) => setTimeoutMin(e.target.value)} />
          </label>
          <label>
            Max intentos fallidos login
            <AppInput type="number" value={maxFailedLogin} onChange={(e) => setMaxFailedLogin(e.target.value)} />
          </label>
        </div>
      </section>

      <div className="zelify-policy-footer">
        <AppButton type="button" tone="primary">
          Guardar Políticas
        </AppButton>
      </div>
    </div>
  );
}

