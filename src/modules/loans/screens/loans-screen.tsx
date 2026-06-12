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
import { Loan, LoanProductDefinition, LoanScheduleItem, LoanTransaction } from "../types/loan-lifecycle.types";

import "@/components/ui/templates/workspace-page.css";
import "./loans-screen.css";
const money = (n: number, c: string) => new Intl.NumberFormat("es-MX", { style: "currency", currency: c }).format(n);
type CustomerLite = { id: string; fullName: string };
type CompanyLite = { id: string; name: string };

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tiempo de espera agotado.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [products, setProducts] = useState<LoanProductDefinition[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [schedule, setSchedule] = useState<LoanScheduleItem[]>([]);
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeLoanModal, setActiveLoanModal] = useState<null | "calendar" | "transactions" | "config">(null);
  const [openActionMenuLoanId, setOpenActionMenuLoanId] = useState<string | null>(null);
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
    setMsg(null);
    const results = await Promise.allSettled([
      loansLifecycleService.listLoans(),
      loansLifecycleService.listLoanProducts(),
      fetchJsonWithTimeout<{ data: Array<{ id: string; fullName: string }> }>("/api/customers"),
      fetchJsonWithTimeout<{ data: Array<{ id: string; name: string }> }>("/api/groups"),
    ]);

    const [loansResult, productsResult, customersResult, companiesResult] = results;
    const errors: string[] = [];

    if (loansResult.status === "fulfilled") {
      setLoans(loansResult.value);
      setSelectedLoanId((prev) => prev || loansResult.value[0]?.id || "");
    } else {
      setLoans([]);
      errors.push(`Préstamos: ${loansResult.reason instanceof Error ? loansResult.reason.message : "error desconocido"}`);
    }

    if (productsResult.status === "fulfilled") {
      setProducts(productsResult.value.filter((x) => x.isActive));
    } else {
      setProducts([]);
      errors.push(`Productos: ${productsResult.reason instanceof Error ? productsResult.reason.message : "error desconocido"}`);
    }

    if (customersResult.status === "fulfilled") {
      setCustomers(customersResult.value.data ?? []);
    } else {
      setCustomers([]);
      errors.push(`Clientes: ${customersResult.reason instanceof Error ? customersResult.reason.message : "error desconocido"}`);
    }

    if (companiesResult.status === "fulfilled") {
      setCompanies(companiesResult.value.data ?? []);
    } else {
      setCompanies([]);
      errors.push(`Grupos: ${companiesResult.reason instanceof Error ? companiesResult.reason.message : "error desconocido"}`);
    }

    if (errors.length) {
      setMsg({
        tone: "error",
        text: `No se pudo cargar toda la información. ${errors.join(" · ")}`,
      });
    }

    setLoading(false);
  };

  const loadLoanDetail = async (loanId: string) => {
    if (!loanId) return;
    setDetailLoading(true);
    const results = await Promise.allSettled([
      loansLifecycleService.getSchedule(loanId),
      loansLifecycleService.getTransactions(loanId),
    ]);

    const [scheduleResult, transactionsResult] = results;
    const errors: string[] = [];

    if (scheduleResult.status === "fulfilled") {
      setSchedule(scheduleResult.value);
    } else {
      setSchedule([]);
      errors.push(`Calendario: ${scheduleResult.reason instanceof Error ? scheduleResult.reason.message : "error desconocido"}`);
    }

    if (transactionsResult.status === "fulfilled") {
      setTransactions(transactionsResult.value);
    } else {
      setTransactions([]);
      errors.push(`Transacciones: ${transactionsResult.reason instanceof Error ? transactionsResult.reason.message : "error desconocido"}`);
    }

    if (errors.length) {
      setMsg({
        tone: "error",
        text: `No se pudo cargar todo el detalle del préstamo. ${errors.join(" · ")}`,
      });
    }
    setDetailLoading(false);
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadAll();
    });
  }, []);
  useEffect(() => {
    if (!selectedLoanId) return;
    queueMicrotask(() => {
      void loadLoanDetail(selectedLoanId);
    });
  }, [selectedLoanId]);
  useEffect(() => {
    const handlePointerDown = () => setOpenActionMenuLoanId(null);
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveLoanModal(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const runLoanAction = async (loan: Loan, action: string, extras: Record<string, unknown> = {}) => {
    setActionLoading(action);
    setMsg(null);
    try {
      const previousState = loan.lifecycleState;
      const result = await loansLifecycleService.applyAction(loan.id, { action, ...extras });
      await loadAll();
      setSelectedLoanId(loan.id);
      await loadLoanDetail(loan.id);
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

  const openLoanModal = (loanId: string, modal: "calendar" | "transactions" | "config") => {
    setSelectedLoanId(loanId);
    setActiveLoanModal(modal);
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">Préstamos</h1>
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
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((row) => (
                    <tr
                      key={row.id}
                      className={selectedLoanId === row.id ? "is-selected" : ""}
                      onClick={() => {
                        setSelectedLoanId(row.id);
                        openLoanModal(row.id, "calendar");
                      }}
                    >
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
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="zelify-loans-row-actions">
                          <button
                            type="button"
                            className="zelify-loans-row-actions__trigger"
                            aria-label={`Abrir acciones de ${row.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuLoanId((current) => current === row.id ? null : row.id);
                            }}
                          >
                            ...
                          </button>
                          {openActionMenuLoanId === row.id ? (
                            <div className="zelify-loans-row-actions__menu">
                              <button
                                type="button"
                                onClick={() => void runLoanAction(row, "DISBURSE_TRANCHE", { amount: 1000, channel: "SPEI" })}
                                disabled={Boolean(actionLoading)}
                              >
                                {actionLoading === "DISBURSE_TRANCHE" ? "Procesando..." : "Desembolso por tramo"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void runLoanAction(row, "RESCHEDULE", { reason: "Ajuste de términos" })}
                                disabled={Boolean(actionLoading)}
                              >
                                {actionLoading === "RESCHEDULE" ? "Procesando..." : "Reprogramar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void runLoanAction(row, "REFINANCE", { reason: "Nuevo préstamo sobre saldo" })}
                                disabled={Boolean(actionLoading)}
                              >
                                {actionLoading === "REFINANCE" ? "Procesando..." : "Refinanciar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void runLoanAction(row, "REPAYMENT", { amount: 1500, channel: "CAJA" })}
                                disabled={Boolean(actionLoading)}
                              >
                                {actionLoading === "REPAYMENT" ? "Procesando..." : "Repago individual"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void runLoanAction(row, "REPAYMENT_FROM_DEPOSIT", { amount: 2000, channel: "DEPOSIT_TRANSFER" })}
                                disabled={Boolean(actionLoading)}
                              >
                                {actionLoading === "REPAYMENT_FROM_DEPOSIT" ? "Procesando..." : "Repago desde depósito"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void runLoanAction(row, "WRITE_OFF", { reason: "Castigo por recuperación nula" })}
                                disabled={Boolean(actionLoading)}
                              >
                                {actionLoading === "WRITE_OFF" ? "Procesando..." : "Baja de activos"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openLoanModal(row.id, "transactions")}
                                disabled={Boolean(actionLoading)}
                              >
                                Ver repagos y transacciones
                              </button>
                              <button
                                type="button"
                                onClick={() => openLoanModal(row.id, "config")}
                                disabled={Boolean(actionLoading)}
                              >
                                Ver interés, mora y comisiones
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </SettingsDataTable>
            </>
          )}
        </div>
      </div>
      {createOpen ? (
        <CreateLoanModal products={products} customers={customers} companies={companies} onClose={() => setCreateOpen(false)} onCreate={async (payload) => {
          await loansLifecycleService.createLoan(payload);
          setCreateOpen(false);
          await loadAll();
        }} />
      ) : null}
      {activeLoanModal === "calendar" && selectedLoan ? (
        <LoanCalendarModal
          loan={selectedLoan}
          schedule={schedule}
          loading={detailLoading}
          onClose={() => setActiveLoanModal(null)}
        />
      ) : null}
      {activeLoanModal === "transactions" && selectedLoan ? (
        <LoanTransactionsModal
          loan={selectedLoan}
          transactions={transactions}
          loading={detailLoading}
          onClose={() => setActiveLoanModal(null)}
        />
      ) : null}
      {activeLoanModal === "config" && selectedLoan ? (
        <LoanConfigModal
          loan={selectedLoan}
          onClose={() => setActiveLoanModal(null)}
        />
      ) : null}
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

function scheduleStatusLabel(status: LoanScheduleItem["status"]) {
  const map: Record<LoanScheduleItem["status"], string> = {
    PAID: "Pagada",
    PARTIAL: "Parcial",
    DUE: "Pendiente",
    OVERDUE: "Vencida",
  };
  return map[status];
}

function LoanCalendarModal({
  loan,
  schedule,
  loading,
  onClose,
}: {
  loan: Loan;
  schedule: LoanScheduleItem[];
  loading: boolean;
  onClose: () => void;
}) {
  const amortizationRows = schedule.reduce<Array<LoanScheduleItem & { remainingPrincipal: number }>>((rows, item) => {
    const previousBalance = rows.at(-1)?.remainingPrincipal ?? loan.principalAmount;
    const remainingPrincipal = Math.max(0, Number((previousBalance - item.principalDue).toFixed(2)));
    rows.push({
      ...item,
      remainingPrincipal,
    });
    return rows;
  }, []);

  return (
    <div className="zelify-loans-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zelify-loans-modal zelify-loans-calendar-modal" role="dialog" aria-modal="true" aria-label={`Calendario de pagos de ${loan.customerName}`}>
        <div className="zelify-loans-calendar-modal__header">
          <div>
            <p className="zelify-loans-calendar-modal__eyebrow">Calendario de pagos</p>
            <h3>{loan.customerName}</h3>
            <p>{loan.id} · {loan.productName}</p>
          </div>
          <button type="button" className="zelify-loans-calendar-modal__close" onClick={onClose} aria-label="Cerrar calendario">
            ×
          </button>
        </div>

        <div className="zelify-loans-calendar-modal__summary">
          <div className="zelify-loans-calendar-modal__card">
            <span>Estado</span>
            <strong>{stateLabel(loan.lifecycleState)}</strong>
          </div>
          <div className="zelify-loans-calendar-modal__card">
            <span>Monto</span>
            <strong>{money(loan.principalAmount, loan.currency)}</strong>
          </div>
          <div className="zelify-loans-calendar-modal__card">
            <span>Canal</span>
            <strong>{loan.disbursementChannel ?? "N/D"}</strong>
          </div>
          <div className="zelify-loans-calendar-modal__card">
            <span>Tasa</span>
            <strong>{loan.nominalRate}%</strong>
          </div>
        </div>

        {loading ? (
          <div className="zelify-loans-calendar-modal__empty">Cargando calendario...</div>
        ) : (
          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>Cuota</th>
                <th>Vence</th>
                <th>Principal</th>
                <th>Interés</th>
                <th>Saldo insoluto</th>
                <th>Cargos</th>
                <th>Penalidades</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {amortizationRows.map((item) => (
                <tr key={item.id}>
                  <td>{item.installmentNo}</td>
                  <td>{item.dueDate}</td>
                  <td>{money(item.principalDue, loan.currency)}</td>
                  <td>{money(item.interestDue, loan.currency)}</td>
                  <td>{money(item.remainingPrincipal, loan.currency)}</td>
                  <td>{money(item.feesDue, loan.currency)}</td>
                  <td>{money(item.penaltiesDue, loan.currency)}</td>
                  <td>
                    <AppBadge
                      tone={item.status === "PAID" ? "success" : item.status === "PARTIAL" ? "warning" : item.status === "OVERDUE" ? "error" : "neutral"}
                      size="sm"
                    >
                      {scheduleStatusLabel(item.status)}
                    </AppBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </SettingsDataTable>
        )}
      </div>
    </div>
  );
}

function LoanTransactionsModal({
  loan,
  transactions,
  loading,
  onClose,
}: {
  loan: Loan;
  transactions: LoanTransaction[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="zelify-loans-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zelify-loans-modal zelify-loans-calendar-modal" role="dialog" aria-modal="true" aria-label={`Repagos y transacciones de ${loan.customerName}`}>
        <div className="zelify-loans-calendar-modal__header">
          <div>
            <p className="zelify-loans-calendar-modal__eyebrow">Repagos y transacciones</p>
            <h3>{loan.customerName}</h3>
            <p>{loan.id} · {loan.productName}</p>
          </div>
          <button type="button" className="zelify-loans-calendar-modal__close" onClick={onClose} aria-label="Cerrar repagos y transacciones">
            ×
          </button>
        </div>
        {loading ? (
          <div className="zelify-loans-calendar-modal__empty">Cargando transacciones...</div>
        ) : (
          <SettingsDataTable variant="clients">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Principal</th><th>Interés</th><th>Fees</th><th>Penalidades</th><th>Canal</th></tr></thead>
            <tbody>{transactions.map((tx) => <tr key={tx.id}><td>{tx.txDate}</td><td>{tx.txType}</td><td>{money(tx.amountTotal, loan.currency)}</td><td>{money(tx.principalComponent, loan.currency)}</td><td>{money(tx.interestComponent, loan.currency)}</td><td>{money(tx.feesComponent, loan.currency)}</td><td>{money(tx.penaltiesComponent, loan.currency)}</td><td>{tx.channel ?? "N/A"}</td></tr>)}</tbody>
          </SettingsDataTable>
        )}
      </div>
    </div>
  );
}

function LoanConfigModal({
  loan,
  onClose,
}: {
  loan: Loan;
  onClose: () => void;
}) {
  return (
    <div className="zelify-loans-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zelify-loans-modal zelify-loans-calendar-modal" role="dialog" aria-modal="true" aria-label={`Configuración de ${loan.customerName}`}>
        <div className="zelify-loans-calendar-modal__header">
          <div>
            <p className="zelify-loans-calendar-modal__eyebrow">Interés, mora y comisiones</p>
            <h3>{loan.customerName}</h3>
            <p>{loan.id} · {loan.productName}</p>
          </div>
          <button type="button" className="zelify-loans-calendar-modal__close" onClick={onClose} aria-label="Cerrar configuración">
            ×
          </button>
        </div>
        <div className="zelify-loans-config-list">
          <div className="zelify-loans-config-item"><span>Método de cálculo</span><strong>{loan.interestCalculationMethod}</strong></div>
          <div className="zelify-loans-config-item"><span>Tasa</span><strong>{loan.rateMode} · {loan.nominalRate}%</strong></div>
          <div className="zelify-loans-config-item"><span>Acumulación diaria</span><strong>{loan.accruedDaily ? "Sí" : "No"}</strong></div>
          <div className="zelify-loans-config-item"><span>Gracia</span><strong>{loan.gracePeriodType ?? "N/D"} · {loan.gracePeriodDays} días</strong></div>
          <div className="zelify-loans-config-item"><span>Mora</span><strong>{loan.arrearsCountingMethod} · {loan.arrearsToleranceDays} días / {loan.arrearsTolerancePct}%</strong></div>
          <div className="zelify-loans-config-item"><span>Penalidad diaria</span><strong>{loan.penaltyDailyRate}%</strong></div>
          <div className="zelify-loans-config-item"><span>Asignación</span><strong>{loan.allocationMethod} · {loan.allocationPriority.join(" → ")}</strong></div>
        </div>
      </div>
    </div>
  );
}

function CreateLoanModal({
  products, customers, companies, onClose, onCreate,
}: {
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
  const [form, setForm] = useState(() => ({
    id: `LN-${Date.now()}`,
    productTypeId: products[0]?.id ?? "",
    customerId: "",
    customerName: "",
    principalAmount: 0,
    expectedDisbursementDate: new Date().toISOString().slice(0, 10),
    nominalRate: 24,
    disbursementChannel: "CAJA",
  }));
  const partyOptions = useMemo(() => {
    const base = entityType === "CUSTOMER"
      ? customers.map((c) => ({ id: c.id, name: c.fullName }))
      : companies.map((c) => ({ id: c.id, name: c.name }));
    if (!partyQuery.trim()) return base;
    const q = partyQuery.toLowerCase();
    return base.filter((x) => x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q));
  }, [entityType, customers, companies, partyQuery]);

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
