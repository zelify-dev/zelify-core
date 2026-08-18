"use client";

import { useMemo, useState } from "react";
import { applicationsListMock, type Application } from "@/modules/mdc/data/mdc-credit-mock";
import { SESSIONS } from "@/modules/mdc/components/mdc-payments-tab";


type ConfigSection = "general" | "roles" | "users" | "export";

type GeneralSettings = {
  companyName: string;
  legalName: string;
  taxId: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  timezone: string;
  currency: string;
};

type RoleRow = {
  name: string;
  description: string;
  permissions: string;
};

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
  requiresPasswordChange: boolean;
  otp: "DESACTIVADO" | "REQUERIDO";
};

type ExportJob = {
  id: string;
  name: string;
  date: string;
  status: "completed" | "running" | "failed";
  type: "clients" | "applications" | "payments" | "collections" | "lostPayments" | "underwritingResults" | "kycResults" | "full";
};

const STORAGE_KEYS = {
  general: "mdc:config:general:v5",
  roles: "mdc:config:roles:v2",
  users: "mdc:config:users:v2",
  exports: "mdc:config:exports:v2",
};

const MDC_STORAGE_KEYS = {
  applications: "mdc:applications",
};

const DEFAULT_GENERAL: GeneralSettings = {
  companyName: "Kumaza",
  legalName: "TuLana S.A.",
  taxId: "12313142343",
  supportEmail: "nzpf2502@outlook.com",
  supportPhone: "",
  address: "Paseo de Los Tamarindos 384, Bosques de las Lomas, Ciudad de México, CDMX, México",
  timezone: "America/Mexico_City",
  currency: "MXN",
};

const DEFAULT_ROLES: RoleRow[] = [];

const DEFAULT_USERS: UserRow[] = [
  {
    id: "USR-001",
    fullName: "Alexis Fernando Montenegro Tapia",
    email: "esotomayor878@gmail.com",
    roles: ["ORG_ADMIN", "USER_APP"],
    status: "ACTIVE",
    updatedAt: "13/8/2026, 2:47:56 p. m.",
    requiresPasswordChange: false,
    otp: "DESACTIVADO",
  },
  {
    id: "USR-002",
    fullName: "Ernesto Perez",
    email: "eperezamigo@yahoo.com",
    roles: ["USER_APP"],
    status: "ACTIVE",
    updatedAt: "23/7/2026, 11:34:01 a. m.",
    requiresPasswordChange: false,
    otp: "REQUERIDO",
  },
  {
    id: "USR-003",
    fullName: "Admin Kumaza",
    email: "nzpf2502@outlook.com",
    roles: ["ORG_ADMIN"],
    status: "ACTIVE",
    updatedAt: "13/8/2026, 2:46:23 p. m.",
    requiresPasswordChange: true,
    otp: "DESACTIVADO",
  },
  {
    id: "USR-004",
    fullName: "Juan Sanchez",
    email: "bmwgt80@gmail.com",
    roles: ["ORG_ADMIN"],
    status: "ACTIVE",
    updatedAt: "13/8/2026, 2:52:39 p. m.",
    requiresPasswordChange: true,
    otp: "DESACTIVADO",
  },
  {
    id: "USR-005",
    fullName: "Mauro Ortiz",
    email: "mauroortiz73@hotmail.com",
    roles: ["ORG_ADMIN"],
    status: "ACTIVE",
    updatedAt: "12/8/2026, 11:22:51 a. m.",
    requiresPasswordChange: true,
    otp: "DESACTIVADO",
  },
];

const DEFAULT_EXPORTS: ExportJob[] = [];

const EXPORT_OPTIONS: { value: ExportJob["type"]; label: string }[] = [
  { value: "clients", label: "Clientes" },
  { value: "applications", label: "Solicitudes" },
  { value: "payments", label: "Pagos" },
  { value: "collections", label: "Cobranza" },
  { value: "lostPayments", label: "Pagos perdidos" },
  { value: "underwritingResults", label: "Resultados de suscripción" },
  { value: "kycResults", label: "Resultados KYC" },
  { value: "full", label: "Exportación completa" },
];

type CsvCell = string | number | boolean | null | undefined;
type CsvRow = Record<string, CsvCell>;

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // noop
  }
}

function normalizeProductName(name: string) {
  if (name === "BNPL") return "Credito personal";
  if (name === "Prestamo personal") return "Credito automotriz";
  if (name.toLowerCase().includes("plazo fijo")) return "Credito personal";
  return name;
}

function riskFromScore(score: number): "low" | "medium" | "high" {
  const bureauScore = Math.round(850 - (Math.max(0, Math.min(100, score)) / 100) * 450);
  if (bureauScore <= 549) return "high";
  if (bureauScore <= 649) return "medium";
  return "low";
}

function nowForExport() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replaceAll(":", "-");
  return {
    date,
    dateTimeLabel: `${date} ${now.toTimeString().slice(0, 5)}`,
    stamp: `${date}_${time}`,
  };
}

function csvEscape(value: CsvCell) {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replaceAll("\"", "\"\"")}"`;
  }
  return str;
}

function rowsToCsv(rows: CsvRow[]) {
  if (rows.length === 0) return "sin_datos\n";
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  return lines.join("\n");
}

function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([`\uFEFF${csvText}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function readApplications() {
  return readStored<Application[]>(MDC_STORAGE_KEYS.applications, applicationsListMock).map((app) => ({
    ...app,
    product: normalizeProductName(app.product),
    risk: riskFromScore(app.riskScore),
  }));
}

function buildClientsRows(applications: Application[]): CsvRow[] {
  const map = new Map<string, {
    name: string;
    email: string;
    products: Set<string>;
    requests: number;
    requestedTotal: number;
    approved: number;
    declined: number;
    pending: number;
    riskScoreSum: number;
  }>();

  for (const app of applications) {
    const key = app.applicantEmail;
    const current = map.get(key) ?? {
      name: app.applicantName,
      email: app.applicantEmail,
      products: new Set<string>(),
      requests: 0,
      requestedTotal: 0,
      approved: 0,
      declined: 0,
      pending: 0,
      riskScoreSum: 0,
    };

    current.products.add(app.product);
    current.requests += 1;
    current.requestedTotal += app.requestedAmount;
    current.riskScoreSum += app.riskScore;
    if (app.status === "approved" || app.status === "overridden") current.approved += 1;
    if (app.status === "declined") current.declined += 1;
    if (app.status === "pending" || app.status === "manualReview") current.pending += 1;
    map.set(key, current);
  }

  return Array.from(map.values()).map((client, index) => ({
    cliente_id: `CLI-${String(index + 1).padStart(4, "0")}`,
    nombre: client.name,
    email: client.email,
    productos: Array.from(client.products).join(" / "),
    solicitudes: client.requests,
    monto_total_solicitado_mxn: client.requestedTotal,
    aprobadas: client.approved,
    rechazadas: client.declined,
    en_revision: client.pending,
    score_riesgo_promedio: Math.round(client.riskScoreSum / Math.max(client.requests, 1)),
  }));
}

function buildUnderwritingRows(applications: Application[]): CsvRow[] {
  return applications.map((app) => ({
    solicitud: app.appNo,
    cliente: app.applicantName,
    email: app.applicantEmail,
    producto: app.product,
    monto_solicitado_mxn: app.requestedAmount,
    score_riesgo: app.riskScore,
    nivel_riesgo: riskFromScore(app.riskScore),
    estado_motor: app.status,
    resultado_suscripcion:
      app.status === "approved" || app.status === "overridden"
        ? "Aprobada"
        : app.status === "declined"
          ? "Rechazada"
          : "Revision",
    fecha: app.submittedAt,
  }));
}

function buildKycRows(applications: Application[]): CsvRow[] {
  const byEmail = new Map<string, Application[]>();
  for (const app of applications) {
    byEmail.set(app.applicantEmail, [...(byEmail.get(app.applicantEmail) ?? []), app]);
  }

  return Array.from(byEmail.entries()).map(([email, rows], index) => {
    const customer = rows[0];
    const maxScore = Math.max(...rows.map((row) => row.riskScore));
    const kycStatus =
      maxScore >= 75 ? "Reforzado"
        : maxScore >= 50 ? "En revision"
          : "Aprobado";
    const pepCheck = maxScore >= 75 ? "Coincidencia parcial" : "Sin coincidencias";
    const docs = rows.some((row) => row.status === "pending") ? "Incompleta" : "Completa";

    return {
      kyc_id: `KYC-${String(index + 1).padStart(4, "0")}`,
      cliente: customer.applicantName,
      email,
      estado_kyc: kycStatus,
      validacion_documental: docs,
      validacion_pep: pepCheck,
      score_maximo: maxScore,
    };
  });
}

function buildCollectionsRows() {
  return ([] as any[]).map((item) => ({
    caso_id: item.caseId,
    solicitud: item.applicationNo,
    cliente: item.customerName,
    monto_vencido_mxn: item.amountDue,
    dpd: item.dpd,
    estado: item.status,
    agente: item.assignedAgent,
    ultima_actividad: item.lastActivity,
  }));
}

function buildPaymentsRows() {
  return SESSIONS.map((payment) => ({
    pago_id: payment.id,
    solicitud: payment.applicantId,
    cliente: payment.userId,
    estado_pago: payment.status,
    metodo: payment.paymentMethod,
    monto_mxn: payment.amount,
    fecha: payment.createdAt,
    codigo_error: payment.errorCode ?? "",
    reintento: payment.retryable ? "si" : "no",
  }));
}

function buildExportRows(type: ExportJob["type"], applications: Application[]) {
  const clientsRows = buildClientsRows(applications);
  const applicationsRows = applications.map((app) => ({
    solicitud: app.appNo,
    cliente: app.applicantName,
    email: app.applicantEmail,
    producto: app.product,
    monto_solicitado_mxn: app.requestedAmount,
    estado: app.status,
    riesgo: riskFromScore(app.riskScore),
    score_riesgo: app.riskScore,
    fecha: app.submittedAt,
  }));
  const paymentsRows = buildPaymentsRows();
  const collectionsRows = buildCollectionsRows();
  const lostPaymentsRows = paymentsRows.filter((row) => row.estado_pago === "FALLIDO");
  const underwritingRows = buildUnderwritingRows(applications);
  const kycRows = buildKycRows(applications);

  if (type === "clients") return { rows: clientsRows, fileBase: "clientes" };
  if (type === "applications") return { rows: applicationsRows, fileBase: "solicitudes" };
  if (type === "payments") return { rows: paymentsRows, fileBase: "pagos" };
  if (type === "collections") return { rows: collectionsRows, fileBase: "cobranza" };
  if (type === "lostPayments") return { rows: lostPaymentsRows, fileBase: "pagos_perdidos" };
  if (type === "underwritingResults") return { rows: underwritingRows, fileBase: "resultados_suscripcion" };
  if (type === "kycResults") return { rows: kycRows, fileBase: "resultados_kyc" };

  const fullRows: CsvRow[] = [
    ...clientsRows.map((row) => ({ seccion: "clientes", ...row })),
    ...applicationsRows.map((row) => ({ seccion: "solicitudes", ...row })),
    ...paymentsRows.map((row) => ({ seccion: "pagos", ...row })),
    ...collectionsRows.map((row: any) => ({ seccion: "cobranza", ...row })),
    ...lostPaymentsRows.map((row) => ({ seccion: "pagos_perdidos", ...row })),
    ...underwritingRows.map((row) => ({ seccion: "resultados_suscripcion", ...row })),
    ...kycRows.map((row) => ({ seccion: "resultados_kyc", ...row })),
  ];
  return { rows: fullRows, fileBase: "exportacion_completa" };
}

export function MdcConfigurationTab() {
  const [activeSection, setActiveSection] = useState<ConfigSection>("general");

  const [general, setGeneral] = useState<GeneralSettings>(() => readStored(STORAGE_KEYS.general, DEFAULT_GENERAL));
  const [roles, setRoles] = useState<RoleRow[]>(() => readStored(STORAGE_KEYS.roles, DEFAULT_ROLES));
  const [users, setUsers] = useState<UserRow[]>(() => readStored(STORAGE_KEYS.users, DEFAULT_USERS));
  const [exportJobs, setExportJobs] = useState<ExportJob[]>(() => readStored(STORAGE_KEYS.exports, DEFAULT_EXPORTS));
  const [selectedExportType, setSelectedExportType] = useState<ExportJob["type"]>("applications");
  const sectionTabs: { id: ConfigSection; label: string }[] = [
    { id: "general", label: "General" },
    { id: "roles", label: "Roles" },
    { id: "users", label: "Usuarios" },
    { id: "export", label: "Export" },
  ];

  const roleNames = useMemo(() => Array.from(new Set(roles.map((r) => r.name))), [roles]);

  return (
    <section className="mdc-section">
      <article className="mdc-card mdc-cfg-header">
        <div>
          <h3>Configuracion</h3>
          <p>Ajustes operativos, integraciones y administracion del modulo.</p>
        </div>
        <button
          type="button"
          className="mdc-btn mdc-btn--ghost"
          onClick={() => {
            setGeneral(DEFAULT_GENERAL);
            setRoles(DEFAULT_ROLES);
            setUsers(DEFAULT_USERS);
            setExportJobs(DEFAULT_EXPORTS);
            writeStored(STORAGE_KEYS.general, DEFAULT_GENERAL);
            writeStored(STORAGE_KEYS.roles, DEFAULT_ROLES);
            writeStored(STORAGE_KEYS.users, DEFAULT_USERS);
            writeStored(STORAGE_KEYS.exports, DEFAULT_EXPORTS);
          }}
        >
          Restaurar defaults
        </button>
      </article>

      <div className="mdc-cfg-tabs" role="tablist" aria-label="Configuracion sections">
        {sectionTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSection === tab.id}
            className={`mdc-cfg-tab${activeSection === tab.id ? " mdc-cfg-tab--active" : ""}`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSection === "general" && (
        <article className="mdc-card">
          <h3>General</h3>
          <p>Datos base de la organizacion y contacto.</p>
          <div className="mdc-cfg-form-grid">
            <Field label="Nombre comercial"><input value={general.companyName} onChange={(e) => setGeneral((v) => ({ ...v, companyName: e.target.value }))} /></Field>
            <Field label="Razon social"><input value={general.legalName} onChange={(e) => setGeneral((v) => ({ ...v, legalName: e.target.value }))} /></Field>
            <Field label="RFC"><input value={general.taxId} onChange={(e) => setGeneral((v) => ({ ...v, taxId: e.target.value }))} /></Field>
            <Field label="Correo soporte"><input value={general.supportEmail} onChange={(e) => setGeneral((v) => ({ ...v, supportEmail: e.target.value }))} /></Field>
            <Field label="Telefono soporte"><input value={general.supportPhone} onChange={(e) => setGeneral((v) => ({ ...v, supportPhone: e.target.value }))} /></Field>
            <Field label="Moneda base"><input value={general.currency} onChange={(e) => setGeneral((v) => ({ ...v, currency: e.target.value }))} /></Field>
            <Field label="Zona horaria"><input value={general.timezone} onChange={(e) => setGeneral((v) => ({ ...v, timezone: e.target.value }))} /></Field>
            <Field label="Direccion" className="mdc-cfg-form-grid__full"><textarea rows={3} value={general.address} onChange={(e) => setGeneral((v) => ({ ...v, address: e.target.value }))} /></Field>
          </div>
          <div className="mdc-cfg-actions"><button type="button" className="mdc-btn mdc-btn--primary" onClick={() => writeStored(STORAGE_KEYS.general, general)}>Guardar cambios</button></div>
        </article>
      )}

      {activeSection === "roles" && (
        <article className="mdc-card">
          <div className="mdc-cfg-title-row">
            <div>
              <h3>Roles</h3>
              <p>Definicion de perfiles y permisos.</p>
            </div>
            <button
              type="button"
              className="mdc-btn mdc-btn--primary"
              onClick={() => {
                const next: RoleRow = { name: `Rol ${roles.length + 1}`, description: "Nuevo rol", permissions: "Lectura general" };
                const updated = [next, ...roles];
                setRoles(updated);
                writeStored(STORAGE_KEYS.roles, updated);
              }}
            >
              Agregar rol
            </button>
          </div>
          <div className="mdc-table-wrap">
            <table className="mdc-table mdc-cfg-table">
              <thead><tr><th>Nombre</th><th>Descripcion</th><th>Permisos</th><th>Acciones</th></tr></thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>Sin roles configurados. Haz clic en &quot;Agregar rol&quot; para comenzar.</td>
                  </tr>
                ) : roles.map((role, index) => (
                  <tr key={`${role.name}-${index}`}>
                    <td>{role.name}</td>
                    <td>{role.description}</td>
                    <td>{role.permissions}</td>
                    <td>
                      <div className="mdc-actions">
                        <button
                          type="button"
                          className="mdc-btn mdc-btn--xs"
                          onClick={() => {
                            const duplicate: RoleRow = { ...role, name: `${role.name} copia` };
                            const updated = [duplicate, ...roles];
                            setRoles(updated);
                            writeStored(STORAGE_KEYS.roles, updated);
                          }}
                        >
                          Duplicar
                        </button>
                        <button
                          type="button"
                          className="mdc-btn mdc-btn--xs mdc-btn--danger"
                          onClick={() => {
                            const updated = roles.filter((_, i) => i !== index);
                            setRoles(updated);
                            writeStored(STORAGE_KEYS.roles, updated);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {activeSection === "users" && (
        <article className="mdc-card">
          <div className="mdc-cfg-title-row">
            <div>
              <h3>Usuarios</h3>
              <p>Administracion de accesos por rol.</p>
            </div>
            <button
              type="button"
              className="mdc-btn mdc-btn--primary"
              onClick={() => {
                const next: UserRow = {
                  id: `USR-${String(users.length + 1).padStart(3, "0")}`,
                  fullName: "Nuevo usuario",
                  email: `nuevo${users.length + 1}@zelify.com`,
                  roles: [roleNames[0] ?? "Viewer"],
                  status: "ACTIVE",
                  updatedAt: new Date().toLocaleString("es-MX"),
                  requiresPasswordChange: true,
                  otp: "DESACTIVADO",
                };
                const updated = [next, ...users];
                setUsers(updated);
                writeStored(STORAGE_KEYS.users, updated);
              }}
            >
              Agregar usuario
            </button>
          </div>
          <div className="mdc-table-wrap">
            <table className="mdc-table mdc-cfg-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ textTransform: 'uppercase', fontSize: '11px', color: '#64748b', letterSpacing: '0.05em' }}>
                  <th style={{ width: '40px', padding: '1rem' }}><input type="checkbox" /></th>
                  <th style={{ padding: '1rem' }}>Miembro</th>
                  <th style={{ padding: '1rem' }}>Estado</th>
                  <th style={{ padding: '1rem' }}>Roles</th>
                  <th style={{ padding: '1rem' }}>Actualizado</th>
                  <th style={{ padding: '1rem' }}>OTP</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                      No hay usuarios configurados. Haz clic en "Agregar usuario" para comenzar.
                    </td>
                  </tr>
                ) : users.map((user) => {
                  const initials = user.fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <tr key={user.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <input type="checkbox" />
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{user.fullName}</div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="mdc-badge mdc-badge--ok" style={{ textTransform: 'uppercase' }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {user.roles.map(role => (
                            <span key={role} style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '13px', color: '#334155' }}>{user.updatedAt}</div>
                        {user.requiresPasswordChange && (
                          <div style={{ color: '#d97706', fontSize: '12px', marginTop: '4px' }}>Requiere cambio de contraseña</div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label className="mdc-switch" style={{ margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={user.otp === "REQUERIDO"}
                              onChange={(e) => {
                                const updated = users.map(r => r.id === user.id ? { ...r, otp: (e.target.checked ? "REQUERIDO" : "DESACTIVADO") as "REQUERIDO" | "DESACTIVADO" } : r);
                                setUsers(updated);
                                writeStored(STORAGE_KEYS.users, updated);
                              }}
                            />
                            <span className="mdc-slider"></span>
                          </label>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: user.otp === "REQUERIDO" ? '#059669' : '#94a3b8' }}>
                            {user.otp}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {activeSection === "export" && (
        <article className="mdc-card">
          <div className="mdc-cfg-title-row">
            <div>
              <h3>Export</h3>
              <p>Historial de exportaciones y jobs del modulo.</p>
            </div>
            <div className="mdc-export-controls">
              <label className="mdc-export-picker">
                <span className="mdc-export-picker__label">Qué quieres exportar</span>
                <select
                  className="mdc-export-picker__select"
                  value={selectedExportType}
                  onChange={(e) => setSelectedExportType(e.target.value as ExportJob["type"])}
                >
                  {EXPORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                onClick={async () => {
                  const now = nowForExport();
                  const jobId = `EXP-${String(exportJobs.length + 1).padStart(3, "0")}`;
                  const runningJob: ExportJob = {
                    id: jobId,
                    name: `export_${selectedExportType}_${now.stamp}.csv`,
                    date: now.dateTimeLabel,
                    status: "running",
                    type: selectedExportType,
                  };

                  const runningJobs = [runningJob, ...exportJobs];
                  setExportJobs(runningJobs);
                  writeStored(STORAGE_KEYS.exports, runningJobs);

                  try {
                    let applications = readApplications();
                    try {
                      const baseUrl = process.env.NEXT_PUBLIC_MDC_API_URL || "http://localhost:3000";
                      const res = await fetch(`${baseUrl}/finance-requests?orgId=ORG-001`);
                      if (res.ok) {
                        const data = await res.json();
                        applications = data.map((item: any) => ({
                          id: item.id,
                          appNo: `APP-${item.id.split("-")[0].toUpperCase()}`,
                          applicantName: item.personType === "natural"
                            ? `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Desconocido'
                            : item.businessName || 'Desconocido',
                          applicantEmail: item.email || 'N/A',
                          product: item.product || 'N/A',
                          requestedAmount: Number(item.amount) || 0,
                          currency: 'MXN',
                          status: item.status === "Aprobada" ? "approved" :
                            item.status === "Rechazada" ? "declined" :
                              item.status === "Revision manual" ? "manualReview" :
                                item.status === "Override" ? "overridden" : "pending",
                          risk: item.riskLevel === "Bajo" ? "low" :
                            item.riskLevel === "Alto" ? "high" : "medium",
                          riskScore: item.riskScore || 50,
                          submittedAt: item.createdAt || new Date().toISOString()
                        })) as Application[];
                      }
                    } catch (e) {
                      // Fallback to local storage if API fails
                    }

                    const { rows, fileBase } = buildExportRows(selectedExportType, applications);
                    const csv = rowsToCsv(rows);
                    const filename = `${fileBase}_${now.stamp}.csv`;
                    downloadCsv(filename, csv);

                    const completedJobs = runningJobs.map((job) =>
                      job.id === jobId ? { ...job, name: filename, status: "completed" as const } : job,
                    );
                    setExportJobs(completedJobs);
                    writeStored(STORAGE_KEYS.exports, completedJobs);
                  } catch {
                    const failedJobs = runningJobs.map((job) =>
                      job.id === jobId ? { ...job, status: "failed" as const } : job,
                    );
                    setExportJobs(failedJobs);
                    writeStored(STORAGE_KEYS.exports, failedJobs);
                  }
                }}
              >
                Exportar CSV
              </button>
            </div>
          </div>
          <div className="mdc-table-wrap">
            <table className="mdc-table mdc-cfg-table">
              <thead><tr><th>ID</th><th>Nombre</th><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {exportJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                      No hay exportaciones recientes.
                    </td>
                  </tr>
                ) : exportJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id}</td>
                    <td>{job.name}</td>
                    <td>{job.date}</td>
                    <td>{EXPORT_OPTIONS.find((option) => option.value === job.type)?.label ?? job.type}</td>
                    <td>
                      <span className={job.status === "completed" ? "mdc-badge mdc-badge--ok" : job.status === "running" ? "mdc-badge mdc-badge--info" : "mdc-badge mdc-badge--bad"}>
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="mdc-btn mdc-btn--xs"
                        onClick={() => {
                          const updated = exportJobs.map((item) =>
                            item.id === job.id
                              ? { ...item, status: (item.status === "running" ? "completed" : item.status === "completed" ? "failed" : "completed") as ExportJob["status"] }
                              : item,
                          );
                          setExportJobs(updated);
                          writeStored(STORAGE_KEYS.exports, updated);
                        }}
                      >
                        Cambiar estado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}

    </section>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={className}>
      <span>{label}</span>
      {children}
    </label>
  );
}
