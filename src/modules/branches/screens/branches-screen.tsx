"use client";

import { useEffect, useMemo, useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { useI18n } from "@/providers/i18n-provider";
import { branchesService } from "../services/branches.service";
import { Branch } from "../types/branch.types";

import "@/components/ui/templates/workspace-page.css";
import "./branches-screen.css";

export function BranchesScreen() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [organizationName, setOrganizationName] = useState("Organización");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"branches" | "centres">("branches");
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showCentreModal, setShowCentreModal] = useState(false);
  const [branchForm, setBranchForm] = useState({
    id: "",
    organizationId: "",
    name: "",
    status: "ACTIVE" as const,
    region: "",
  });
  const [centreForm, setCentreForm] = useState({
    id: "",
    branchId: "",
    name: "",
    meetingDay: "",
    meetingPlace: "",
    status: "ACTIVE" as const,
  });
  const nLocale = locale === "es" ? "es-EC" : "en-US";

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const payload = await branchesService.getHierarchy();
      setOrganizationName(payload.organization?.name ?? "Organización");
      setBranches(payload.branches);
      setSelected(payload.branches[0] ?? null);
      setBranchForm((prev) => ({ ...prev, organizationId: payload.organization?.id ?? "ORG-ZELIFY" }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar sucursales. Ejecuta la migración de branches/centres.";
      setErrorMessage(message);
      setOrganizationName("Organización");
      setBranches([]);
      setSelected(null);
      setBranchForm((prev) => ({ ...prev, organizationId: "ORG-ZELIFY" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.region.toLowerCase().includes(q)
    );
  }, [query, branches]);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-branches">
          <header className="zelify-branches__head">
            <div>
              <h1 className="zelify-workspace-page__title">{t("branches.title")}</h1>
              <p className="zelify-workspace-page__subtitle">
                Árbol organizacional: {organizationName} {"->"} sucursales {"->"} centros
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <AppButton type="button" tone="secondary" onClick={() => setShowCentreModal(true)}>
                Nuevo centro
              </AppButton>
              <AppButton type="button" tone="primary" onClick={() => setShowBranchModal(true)}>
                Nueva sucursal
              </AppButton>
            </div>
          </header>

          <section className="zelify-branches__toolbar">
            <AppInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("branches.searchPlaceholder")}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <AppButton type="button" tone={mode === "branches" ? "primary" : "neutral"} onClick={() => setMode("branches")}>
                /branches
              </AppButton>
              <AppButton type="button" tone={mode === "centres" ? "primary" : "neutral"} onClick={() => setMode("centres")}>
                /centres
              </AppButton>
            </div>
          </section>
          {errorMessage ? (
            <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 8, padding: 10 }}>
              {`Error cargando datos de sucursales: ${errorMessage}. Si no ejecutaste la migración, corre 20260506_branches_centres_org_es.sql en Supabase.`}
            </div>
          ) : null}

          <section className="zelify-branches__layout">
            <div className="zelify-branches__table-wrap">
              {loading ? (
                <div style={{ padding: 16 }}>Cargando sucursales y centros...</div>
              ) : mode === "branches" ? (
                <SettingsDataTable variant="clients">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Sucursal</th>
                      <th>Región</th>
                      <th className="is-numeric-header">Clientes</th>
                      <th className="is-numeric-header">Préstamos activos</th>
                      <th className="is-numeric-header">Depósitos</th>
                      <th className="is-numeric-header">Mora %</th>
                      <th>GL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id} onClick={() => setSelected(row)} className={selected?.id === row.id ? "is-selected" : ""}>
                        <td className="zelify-mono">{row.id}</td>
                        <td>{row.name}</td>
                        <td>{row.region}</td>
                        <td className="is-numeric">{(row.portfolio?.assignedCustomers ?? 0).toLocaleString(nLocale)}</td>
                        <td className="is-numeric">{(row.portfolio?.activeLoans ?? 0).toLocaleString(nLocale)}</td>
                        <td className="is-numeric">{(row.portfolio?.totalDeposits ?? 0).toLocaleString(nLocale)}</td>
                        <td className="is-numeric">{`${row.portfolio?.delinquencyRate ?? 0}%`}</td>
                        <td>{row.portfolio?.glReportLabel ?? "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </SettingsDataTable>
              ) : (
                <SettingsDataTable variant="clients">
                  <thead>
                    <tr>
                      <th>ID centro</th>
                      <th>Centro</th>
                      <th>Sucursal</th>
                      <th>Día de reunión</th>
                      <th>Lugar de reunión</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.flatMap((branch) =>
                      branch.centres.map((centre) => (
                        <tr key={centre.id} onClick={() => setSelected(branch)} className={selected?.id === branch.id ? "is-selected" : ""}>
                          <td className="zelify-mono">{centre.id}</td>
                          <td>{centre.name}</td>
                          <td>{branch.name}</td>
                          <td>{centre.meetingDay}</td>
                          <td>{centre.meetingPlace}</td>
                          <td>
                            <AppBadge tone={centre.status === "ACTIVE" ? "success" : "neutral"} size="sm">
                              {centre.status === "ACTIVE" ? "Activo" : "Inactivo"}
                            </AppBadge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </SettingsDataTable>
              )}
            </div>

            <aside className="zelify-branches__details">
              {selected ? (
                <>
                  <h3>{selected.name}</h3>
                  <p className="zelify-branches__detail-id">{selected.id}</p>
                  <ul>
                    <li>
                      <span>Centros asignados</span>
                      <strong>{selected.centres.length}</strong>
                    </li>
                    <li>
                      <span>Cartera por sucursal</span>
                      <strong>
                        {`Préstamos ${selected.portfolio?.activeLoans?.toLocaleString(nLocale) ?? 0} · Depósitos ${selected.portfolio?.totalDeposits?.toLocaleString(nLocale) ?? 0}`}
                      </strong>
                    </li>
                    <li>
                      <span>Mora</span>
                      <strong>{`${selected.portfolio?.delinquencyRate ?? 0}%`}</strong>
                    </li>
                    <li>
                      <span>Reporte GL</span>
                      <strong>{selected.portfolio?.glReportLabel ?? "N/A"}</strong>
                    </li>
                  </ul>
                  <h4 style={{ marginTop: 12, marginBottom: 8 }}>Usuarios por sucursal</h4>
                  <ul>
                    {selected.users.map((u) => (
                      <li key={u.id}>
                        <span>{u.fullName}</span>
                        <strong>{`${userRoleLabel(u.roleName)} · Transacciones en ${u.transactionsBranch}`}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="zelify-branches__detail-actions">
                    <AppButton type="button" tone="neutral">
                      Gestionar usuarios
                    </AppButton>
                    <AppButton type="button" tone="primary">
                      Editar sucursal
                    </AppButton>
                  </div>
                </>
              ) : (
                <p>{t("branches.emptySelect")}</p>
              )}
            </aside>
          </section>
        </div>
      </div>
      {showBranchModal ? (
        <div className="zelify-groups-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowBranchModal(false)}>
          <div className="zelify-groups-drawer" role="dialog" aria-modal="true">
            <h3>Nueva sucursal</h3>
            <AppInput value={branchForm.id} onChange={(e) => setBranchForm((p) => ({ ...p, id: e.target.value }))} placeholder="ID (ej. BR-MTY-01)" />
            <AppInput value={branchForm.name} onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre de sucursal" />
            <AppInput value={branchForm.region} onChange={(e) => setBranchForm((p) => ({ ...p, region: e.target.value }))} placeholder="Región" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <AppButton tone="secondary" onClick={() => setShowBranchModal(false)}>Cancelar</AppButton>
              <AppButton
                tone="primary"
                onClick={() =>
                  void (async () => {
                    await branchesService.createBranch(branchForm);
                    setShowBranchModal(false);
                    await loadData();
                  })()
                }
              >
                Guardar sucursal
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
      {showCentreModal ? (
        <div className="zelify-groups-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowCentreModal(false)}>
          <div className="zelify-groups-drawer" role="dialog" aria-modal="true">
            <h3>Nuevo centro</h3>
            <AppInput value={centreForm.id} onChange={(e) => setCentreForm((p) => ({ ...p, id: e.target.value }))} placeholder="ID (ej. CE-MTY-001)" />
            <select
              className="zelify-groups-toolbar__select"
              value={centreForm.branchId}
              onChange={(e) => setCentreForm((p) => ({ ...p, branchId: e.target.value }))}
            >
              <option value="">Selecciona sucursal</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <AppInput value={centreForm.name} onChange={(e) => setCentreForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nombre del centro" />
            <AppInput value={centreForm.meetingDay} onChange={(e) => setCentreForm((p) => ({ ...p, meetingDay: e.target.value }))} placeholder="Día de reunión (ej. Miércoles)" />
            <AppInput value={centreForm.meetingPlace} onChange={(e) => setCentreForm((p) => ({ ...p, meetingPlace: e.target.value }))} placeholder="Lugar de reunión" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <AppButton tone="secondary" onClick={() => setShowCentreModal(false)}>Cancelar</AppButton>
              <AppButton
                tone="primary"
                onClick={() =>
                  void (async () => {
                    await branchesService.createCentre(centreForm);
                    setShowCentreModal(false);
                    await loadData();
                  })()
                }
              >
                Guardar centro
              </AppButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function userRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    CREDIT_OFFICER: "Credit Officer",
    BRANCH_MANAGER: "Branch Manager",
    OPERATIONS: "Operaciones",
    TELLER: "Caja",
  };
  return labels[role] ?? role;
}

