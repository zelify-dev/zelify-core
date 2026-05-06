"use client";

import { useEffect, useMemo, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { loansLifecycleService } from "../services/loans-lifecycle.service";
import { Loan, LoanProductDefinition, LoanScheduleItem, LoanTransaction, LoanTranche } from "../types/loan-lifecycle.types";

import "@/components/ui/templates/workspace-page.css";
import "./loans-screen.css";
const money = (n: number, c: string) => new Intl.NumberFormat("es-MX", { style: "currency", currency: c }).format(n);
type CustomerLite = { id: string; fullName: string };
type CompanyLite = { id: string; name: string };

export function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [products, setProducts] = useState<LoanProductDefinition[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [schedule, setSchedule] = useState<LoanScheduleItem[]>([]);
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [tranches, setTranches] = useState<LoanTranche[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<"ciclo" | "calendario" | "movimientos" | "configuracion">("ciclo");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [companies, setCompanies] = useState<CompanyLite[]>([]);

  const selectedLoan = useMemo(() => loans.find((x) => x.id === selectedLoanId) ?? null, [loans, selectedLoanId]);
  const filteredLoans = useMemo(() => {
    if (!query.trim()) return loans;
    const q = query.toLowerCase();
    return loans.filter((x) => x.id.toLowerCase().includes(q) || x.customerName.toLowerCase().includes(q) || x.productCode.toLowerCase().includes(q));
  }, [loans, query]);

  const loadAll = async () => {
    setLoading(true);
    const [loanRows, productRows] = await Promise.all([loansLifecycleService.listLoans(), loansLifecycleService.listLoanProducts()]);
    const [customersRes, companiesRes] = await Promise.all([
      fetch("/api/customers", { cache: "no-store" }),
      fetch("/api/groups", { cache: "no-store" }),
    ]);
    if (customersRes.ok) {
      const cJson = (await customersRes.json()) as { data: Array<{ id: string; fullName: string }> };
      setCustomers(cJson.data ?? []);
    }
    if (companiesRes.ok) {
      const gJson = (await companiesRes.json()) as { data: Array<{ id: string; name: string }> };
      setCompanies(gJson.data ?? []);
    }
    setLoans(loanRows);
    setProducts(productRows.filter((x) => x.isActive));
    setSelectedLoanId((prev) => prev || loanRows[0]?.id || "");
    setLoading(false);
  };

  const loadLoanDetail = async (loanId: string) => {
    if (!loanId) return;
    const [s, t, tr] = await Promise.all([
      loansLifecycleService.getSchedule(loanId),
      loansLifecycleService.getTransactions(loanId),
      loansLifecycleService.getTranches(loanId),
    ]);
    setSchedule(s);
    setTransactions(t);
    setTranches(tr);
  };

  useEffect(() => {
    void loadAll();
  }, []);
  useEffect(() => {
    if (selectedLoanId) void loadLoanDetail(selectedLoanId);
  }, [selectedLoanId]);

  const runAction = async (action: string, extras: Record<string, unknown> = {}) => {
    if (!selectedLoanId || !selectedLoan) return;
    setActionLoading(action);
    setMsg(null);
    try {
      const previousState = selectedLoan.lifecycleState;
      const result = await loansLifecycleService.applyAction(selectedLoanId, { action, ...extras });
      await loadAll();
      await loadLoanDetail(selectedLoanId);
      const nextState = result.lifecycleState as Loan["lifecycleState"] | undefined;
      const statusMessage = nextState && previousState !== nextState
        ? `Estado actualizado: ${stateLabel(previousState)} -> ${stateLabel(nextState)}.`
        : "No hubo cambio de estado; se registró la operación.";
      setMsg({
        tone: "success",
        text: `${actionLabel(action)} aplicada correctamente. ${statusMessage}`,
      });
    } catch (err) {
      setMsg({
        tone: "error",
        text: err instanceof Error ? err.message : "No se pudo aplicar la acción. Intenta nuevamente.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">Préstamos</h1>
          <div className="zelify-loans-tabs">
            <button className={tab === "ciclo" ? "is-active" : ""} onClick={() => setTab("ciclo")} type="button">
              Ciclo de vida
            </button>
            <button className={tab === "calendario" ? "is-active" : ""} onClick={() => setTab("calendario")} type="button">
              Calendario de pagos
            </button>
            <button className={tab === "movimientos" ? "is-active" : ""} onClick={() => setTab("movimientos")} type="button">
              Repagos y transacciones
            </button>
            <button className={tab === "configuracion" ? "is-active" : ""} onClick={() => setTab("configuracion")} type="button">
              Interés, mora y comisiones
            </button>
          </div>
          {msg ? (
            <div
              className={`zelify-loans-feedback ${msg.tone === "error" ? "is-error" : "is-success"}`}
              role="status"
              aria-live="polite"
            >
              {msg.text}
            </div>
          ) : null}

          <div className="zelify-loans-products-toolbar">
            <AppInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o código..." />
            <AppButton tone="primary" onClick={() => setCreateOpen(true)}>Nuevo préstamo</AppButton>
          </div>

          {loading ? <div>Cargando préstamos...</div> : (
            <>
              <SettingsDataTable variant="clients">
                <thead>
                  <tr>
                    <th>Préstamo</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Estado</th>
                    <th>Monto</th>
                    <th>Canal</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((row) => (
                    <tr key={row.id} className={selectedLoanId === row.id ? "is-selected" : ""} onClick={() => setSelectedLoanId(row.id)}>
                      <td className="zelify-mono">{row.id}</td>
                      <td>{row.customerName}</td>
                      <td>{row.productName}</td>
                      <td>
                        <AppBadge tone={stateTone(row.lifecycleState)} size="sm">
                          {stateLabel(row.lifecycleState)}
                        </AppBadge>
                      </td>
                      <td>{money(row.principalAmount, row.currency)}</td>
                      <td>{row.disbursementChannel ?? "N/D"}</td>
                    </tr>
                  ))}
                </tbody>
              </SettingsDataTable>
            </>
          )}
          {selectedLoan ? (
            <div style={{ marginTop: 12, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
              {tab === "ciclo" ? (
                <>
                  <h3>{selectedLoan.id} · {selectedLoan.customerName}</h3>
                  <p style={{ marginTop: 0 }}>{selectedLoan.productName} ({selectedLoan.productCode})</p>
                  <div className="zelify-loans-action-section">
                    <p className="zelify-loans-action-title">Acciones de estado</p>
                    <div className="zelify-loans-action-grid">
                      {availableActions(selectedLoan.lifecycleState).map((a) => (
                        <AppButton
                          key={a}
                          tone="secondary"
                          onClick={() => runAction(a)}
                          disabled={Boolean(actionLoading)}
                        >
                          {actionLoading === a ? "Procesando..." : actionLabel(a)}
                        </AppButton>
                      ))}
                    </div>
                  </div>
                  <div className="zelify-loans-action-section">
                    <p className="zelify-loans-action-title">Gestión avanzada del préstamo</p>
                    <div className="zelify-loans-action-grid">
                      <AppButton tone="primary" onClick={() => runAction("DISBURSE_TRANCHE", { amount: 1000, channel: "SPEI" })} disabled={Boolean(actionLoading)}>
                        {actionLoading === "DISBURSE_TRANCHE" ? "Procesando..." : "Desembolso por tramo"}
                      </AppButton>
                      <AppButton tone="primary" onClick={() => runAction("RESCHEDULE", { reason: "Ajuste de términos" })} disabled={Boolean(actionLoading)}>
                        {actionLoading === "RESCHEDULE" ? "Procesando..." : "Reprogramar"}
                      </AppButton>
                      <AppButton tone="primary" onClick={() => runAction("REFINANCE", { reason: "Nuevo préstamo sobre saldo" })} disabled={Boolean(actionLoading)}>
                        {actionLoading === "REFINANCE" ? "Procesando..." : "Refinanciar"}
                      </AppButton>
                      <AppButton tone="primary" onClick={() => runAction("CAPITALIZE_INTEREST", { reason: "Capitalización de intereses" })} disabled={Boolean(actionLoading)}>
                        {actionLoading === "CAPITALIZE_INTEREST" ? "Procesando..." : "Capitalizar interés"}
                      </AppButton>
                      <AppButton tone="neutral" onClick={() => runAction("PAY_OFF", { amount: selectedLoan.outstandingPrincipal + selectedLoan.outstandingInterest })} disabled={Boolean(actionLoading)}>
                        {actionLoading === "PAY_OFF" ? "Procesando..." : "Pay-off anticipado"}
                      </AppButton>
                      <AppButton tone="neutral" onClick={() => runAction("TERMINATE", { reason: "Terminación solicitada" })} disabled={Boolean(actionLoading)}>
                        {actionLoading === "TERMINATE" ? "Procesando..." : "Terminación"}
                      </AppButton>
                    </div>
                  </div>
                  <h4 style={{ marginTop: 12 }}>Tramos de desembolso</h4>
                  <ul className="zelify-loans-tranches-list">
                    {tranches.map((t) => (
                      <li key={t.id}>{`Tramo ${t.trancheNo}: ${money(t.amount, selectedLoan.currency)} · ${trancheStatusLabel(t.status)}`}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {tab === "calendario" ? (
                <SettingsDataTable variant="clients">
                  <thead><tr><th>Cuota</th><th>Vence</th><th>Principal</th><th>Interés</th><th>Cargos</th><th>Penalidades</th><th>Estado</th></tr></thead>
                  <tbody>{schedule.map((s) => <tr key={s.id}><td>{s.installmentNo}</td><td>{s.dueDate}</td><td>{money(s.principalDue, selectedLoan.currency)}</td><td>{money(s.interestDue, selectedLoan.currency)}</td><td>{money(s.feesDue, selectedLoan.currency)}</td><td>{money(s.penaltiesDue, selectedLoan.currency)}</td><td>{s.status}</td></tr>)}</tbody>
                </SettingsDataTable>
              ) : null}
              {tab === "movimientos" ? (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <AppButton tone="primary" onClick={() => runAction("REPAYMENT", { amount: 1500, channel: "CAJA" })}>Repago individual</AppButton>
                    <AppButton tone="primary" onClick={() => runAction("BULK_REPAYMENT", { amount: 5000, channel: "BULK" })}>Repago bulk</AppButton>
                    <AppButton tone="secondary" onClick={() => runAction("REPAYMENT_FROM_DEPOSIT", { amount: 2000, channel: "DEPOSIT_TRANSFER" })}>Repago desde depósito</AppButton>
                    <AppButton tone="neutral" onClick={() => runAction("WRITE_OFF", { reason: "Castigo por recuperación nula" })}>Write-off</AppButton>
                  </div>
                  <SettingsDataTable variant="clients">
                    <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Principal</th><th>Interés</th><th>Fees</th><th>Penalidades</th><th>Canal</th></tr></thead>
                    <tbody>{transactions.map((tx) => <tr key={tx.id}><td>{tx.txDate}</td><td>{tx.txType}</td><td>{money(tx.amountTotal, selectedLoan.currency)}</td><td>{money(tx.principalComponent, selectedLoan.currency)}</td><td>{money(tx.interestComponent, selectedLoan.currency)}</td><td>{money(tx.feesComponent, selectedLoan.currency)}</td><td>{money(tx.penaltiesComponent, selectedLoan.currency)}</td><td>{tx.channel ?? "N/A"}</td></tr>)}</tbody>
                  </SettingsDataTable>
                </>
              ) : null}
              {tab === "configuracion" ? (
                <ul>
                  <li>Método de cálculo: {selectedLoan.interestCalculationMethod}</li>
                  <li>Tasa: {selectedLoan.rateMode} · {selectedLoan.nominalRate}%</li>
                  <li>Acumulación diaria: {selectedLoan.accruedDaily ? "Sí" : "No"}</li>
                  <li>Gracia: {selectedLoan.gracePeriodType ?? "N/D"} · {selectedLoan.gracePeriodDays} días</li>
                  <li>Mora: {selectedLoan.arrearsCountingMethod} · tolerancia {selectedLoan.arrearsToleranceDays} días / {selectedLoan.arrearsTolerancePct}%</li>
                  <li>Penalidad diaria: {selectedLoan.penaltyDailyRate}%</li>
                  <li>Asignación: {selectedLoan.allocationMethod} · prioridad {selectedLoan.allocationPriority.join(" → ")}</li>
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <CreateLoanModal open={createOpen} products={products} customers={customers} companies={companies} onClose={() => setCreateOpen(false)} onCreate={async (payload) => {
        await loansLifecycleService.createLoan(payload);
        setCreateOpen(false);
        await loadAll();
      }} />
    </div>
  );
}

function stateTone(state: Loan["lifecycleState"]): "success" | "warning" | "error" | "neutral" {
  if (state === "ACTIVE" || state === "APPROVED") return "success";
  if (state === "ACTIVE_IN_ARREARS" || state === "LOCKED") return "warning";
  if (state === "WRITTEN_OFF") return "error";
  return "neutral";
}
function stateLabel(state: Loan["lifecycleState"]): string {
  const map: Record<Loan["lifecycleState"], string> = {
    PARTIAL_APPLICATION: "Solicitud parcial",
    PENDING_APPROVAL: "Pendiente de aprobación",
    APPROVED: "Aprobado",
    ACTIVE: "Activo",
    ACTIVE_IN_ARREARS: "Activo en mora",
    LOCKED: "Bloqueado",
    CLOSED: "Cerrado",
    WRITTEN_OFF: "Castigado",
  };
  return map[state];
}
function actionLabel(action: string): string {
  const map: Record<string, string> = {
    SUBMIT: "Enviar a aprobación",
    APPROVE: "Aprobar",
    DISBURSE: "Desembolsar",
    MARK_ARREARS: "Marcar en mora",
    LOCK: "Bloquear cuenta",
    UNLOCK: "Desbloquear cuenta",
    CLOSE: "Cerrar préstamo",
    WRITE_OFF: "Castigar préstamo",
    DISBURSE_TRANCHE: "Desembolso por tramo",
    RESCHEDULE: "Reprogramar",
    REFINANCE: "Refinanciar",
    CAPITALIZE_INTEREST: "Capitalizar interés",
    PAY_OFF: "Pay-off anticipado",
    TERMINATE: "Terminar préstamo",
    REPAYMENT: "Repago individual",
    BULK_REPAYMENT: "Repago masivo",
    REPAYMENT_FROM_DEPOSIT: "Repago desde depósito",
  };
  return map[action] ?? action;
}
function trancheStatusLabel(status: LoanTranche["status"]): string {
  const map: Record<LoanTranche["status"], string> = {
    PLANNED: "Planificado",
    DISBURSED: "Desembolsado",
    CANCELLED: "Cancelado",
  };
  return map[status];
}
function availableActions(state: Loan["lifecycleState"]): string[] {
  const byState: Record<Loan["lifecycleState"], string[]> = {
    PARTIAL_APPLICATION: ["SUBMIT"],
    PENDING_APPROVAL: ["APPROVE"],
    APPROVED: ["DISBURSE"],
    ACTIVE: ["MARK_ARREARS", "LOCK", "CLOSE", "WRITE_OFF"],
    ACTIVE_IN_ARREARS: ["LOCK", "WRITE_OFF"],
    LOCKED: ["UNLOCK"],
    CLOSED: [],
    WRITTEN_OFF: [],
  };
  return byState[state];
}

function CreateLoanModal({
  open, products, customers, companies, onClose, onCreate,
}: {
  open: boolean;
  products: LoanProductDefinition[];
  customers: CustomerLite[];
  companies: CompanyLite[];
  onClose: () => void;
  onCreate: (payload: {
    id: string; productTypeId: string; customerId: string; customerName: string; principalAmount: number; expectedDisbursementDate: string; nominalRate: number; disbursementChannel: string;
  }) => Promise<void>;
}) {
  const [entityType, setEntityType] = useState<"CUSTOMER" | "COMPANY">("CUSTOMER");
  const [partyQuery, setPartyQuery] = useState("");
  const [form, setForm] = useState({
    id: `LN-${Date.now()}`,
    productTypeId: "",
    customerId: "",
    customerName: "",
    principalAmount: 0,
    expectedDisbursementDate: new Date().toISOString().slice(0, 10),
    nominalRate: 24,
    disbursementChannel: "CAJA",
  });
  const partyOptions = useMemo(() => {
    const base = entityType === "CUSTOMER"
      ? customers.map((c) => ({ id: c.id, name: c.fullName }))
      : companies.map((c) => ({ id: c.id, name: c.name }));
    if (!partyQuery.trim()) return base;
    const q = partyQuery.toLowerCase();
    return base.filter((x) => x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q));
  }, [entityType, customers, companies, partyQuery]);

  useEffect(() => {
    if (!open) return;
    setForm((p) => ({ ...p, productTypeId: products[0]?.id ?? "", customerId: "", customerName: "" }));
    setPartyQuery("");
  }, [open, products]);
  if (!open) return null;
  return (
    <div className="zelify-loans-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zelify-loans-modal" role="dialog" aria-modal="true">
        <h3>Nuevo préstamo</h3>
        <p>Origen real: selecciona un cliente individual o una empresa existente y un tipo de préstamo activo.</p>
        <div className="zelify-loans-modal-grid">
          <AppInput value={form.id} onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))} placeholder="ID préstamo" />
          <AppSelect value={form.productTypeId} onChange={(e) => setForm((p) => ({ ...p, productTypeId: e.target.value }))}>
            {products.map((p) => <option key={p.id} value={p.id}>{`${p.name} (${p.code})`}</option>)}
          </AppSelect>
          <AppSelect value={entityType} onChange={(e) => setEntityType(e.target.value as "CUSTOMER" | "COMPANY")}>
            <option value="CUSTOMER">Cliente individual</option>
            <option value="COMPANY">Empresa</option>
          </AppSelect>
          <AppInput value={partyQuery} onChange={(e) => setPartyQuery(e.target.value)} placeholder={entityType === "CUSTOMER" ? "Buscar cliente..." : "Buscar empresa..."} />
          <AppSelect
            value={form.customerId}
            onChange={(e) => {
              const party = partyOptions.find((x) => x.id === e.target.value);
              setForm((p) => ({ ...p, customerId: e.target.value, customerName: party?.name ?? "" }));
            }}
          >
            <option value="">Selecciona {entityType === "CUSTOMER" ? "cliente" : "empresa"}</option>
            {partyOptions.map((p) => <option key={p.id} value={p.id}>{`${p.name} (${p.id})`}</option>)}
          </AppSelect>
          <AppInput value={form.customerName} disabled placeholder="Nombre seleccionado" />
          <AppInput type="number" value={String(form.principalAmount)} onChange={(e) => setForm((p) => ({ ...p, principalAmount: Number(e.target.value || 0) }))} placeholder="Monto principal" />
          <AppInput type="date" value={form.expectedDisbursementDate} onChange={(e) => setForm((p) => ({ ...p, expectedDisbursementDate: e.target.value }))} />
          <AppInput type="number" value={String(form.nominalRate)} onChange={(e) => setForm((p) => ({ ...p, nominalRate: Number(e.target.value || 0) }))} placeholder="Tasa nominal %" />
          <AppSelect value={form.disbursementChannel} onChange={(e) => setForm((p) => ({ ...p, disbursementChannel: e.target.value }))}>
            <option value="CAJA">Caja</option>
            <option value="SPEI">SPEI</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </AppSelect>
        </div>
        <div className="zelify-loans-modal-actions">
          <AppButton tone="secondary" onClick={onClose}>Cancelar</AppButton>
          <AppButton tone="primary" onClick={() => void onCreate(form)} disabled={!form.productTypeId || !form.customerId || !form.customerName || form.principalAmount <= 0}>
            Crear préstamo
          </AppButton>
        </div>
      </div>
    </div>
  );
}
