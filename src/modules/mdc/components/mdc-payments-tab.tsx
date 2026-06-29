"use client";

import { ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { MdcApplicantMode } from "@/modules/mdc/data/mdc-credit-mock";

export type Session = {
  id: string;
  userId: string;
  applicantId: string;
  status: "PENDIENTE" | "PROCESANDO" | "CAPTURADO" | "FALLIDO";
  paymentMethod: "tarjeta" | "spei";
  amount: number;
  currency: "MXN";
  createdAt: string;
  errorCode?: string;
  retryable?: boolean;
};

type Installment = {
  installmentNumber: number;
  status: "pendiente" | "pagado" | "vencido" | "parcial" | "fallido" | "cancelado";
  amount: number;
  dueDate: string;
};

type RangePreset = "7d" | "30d" | "90d";
type MdcPaymentsTabProps = {
  mode?: MdcApplicantMode;
  sessions?: Session[];
  range?: RangePreset;
  onRangeChange?: (range: RangePreset) => void;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<RangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const NATURAL_SESSIONS: Session[] = [
  { id: "ses_0901", userId: "Monica Flores Ruiz", applicantId: "APP-001233", status: "CAPTURADO", paymentMethod: "spei", amount: 1850, currency: "MXN", createdAt: "2026-02-10" },
  { id: "ses_0902", userId: "Arturo Salinas Gomez", applicantId: "APP-001234", status: "CAPTURADO", paymentMethod: "tarjeta", amount: 2200, currency: "MXN", createdAt: "2026-02-18" },
  { id: "ses_0903", userId: "Nadia Paredes Luna", applicantId: "APP-001235", status: "FALLIDO", paymentMethod: "tarjeta", amount: 2600, currency: "MXN", createdAt: "2026-02-27", errorCode: "issuer_declined", retryable: true },
  { id: "ses_0904", userId: "Emilio Cardenas Vega", applicantId: "APP-001236", status: "CAPTURADO", paymentMethod: "spei", amount: 3150, currency: "MXN", createdAt: "2026-03-05" },
  { id: "ses_0905", userId: "Claudia Moreno Diaz", applicantId: "APP-001237", status: "CAPTURADO", paymentMethod: "tarjeta", amount: 2780, currency: "MXN", createdAt: "2026-03-12" },
  { id: "ses_0906", userId: "Ivan Torres Rojas", applicantId: "APP-001238", status: "FALLIDO", paymentMethod: "spei", amount: 3410, currency: "MXN", createdAt: "2026-03-19", errorCode: "insufficient_funds", retryable: true },
  { id: "ses_0907", userId: "Carolina Vega Prieto", applicantId: "APP-001239", status: "CAPTURADO", paymentMethod: "tarjeta", amount: 3620, currency: "MXN", createdAt: "2026-03-25" },
  { id: "ses_0908", userId: "Javier Luna Nieto", applicantId: "APP-001240", status: "CAPTURADO", paymentMethod: "spei", amount: 4040, currency: "MXN", createdAt: "2026-03-31" },
  { id: "ses_0909", userId: "Paola Mendez Silva", applicantId: "APP-001241", status: "CAPTURADO", paymentMethod: "tarjeta", amount: 2950, currency: "MXN", createdAt: "2026-04-03" },
  { id: "ses_0910", userId: "Ramon Herrera Castro", applicantId: "APP-001242", status: "PENDIENTE", paymentMethod: "spei", amount: 3300, currency: "MXN", createdAt: "2026-04-06" },
  { id: "ses_1001", userId: "Maria Fernanda Lopez", applicantId: "APP-001284", status: "CAPTURADO", paymentMethod: "tarjeta", amount: 2450, currency: "MXN", createdAt: "2026-05-01" },
  { id: "ses_1002", userId: "Carlos Alberto Mendoza", applicantId: "APP-001279", status: "CAPTURADO", paymentMethod: "tarjeta", amount: 2750, currency: "MXN", createdAt: "2026-05-02" },
  { id: "ses_1003", userId: "Lucia Romero Vargas", applicantId: "APP-001278", status: "CAPTURADO", paymentMethod: "spei", amount: 1200, currency: "MXN", createdAt: "2026-05-03" },
  { id: "ses_1004", userId: "Gabriela Torres Lopez", applicantId: "APP-001272", status: "FALLIDO", paymentMethod: "tarjeta", amount: 3158, currency: "MXN", createdAt: "2026-05-04", errorCode: "issuer_declined", retryable: true },
  { id: "ses_1005", userId: "Laura Romero Diaz", applicantId: "APP-001267", status: "CAPTURADO", paymentMethod: "spei", amount: 4900, currency: "MXN", createdAt: "2026-05-05" },
  { id: "ses_1006", userId: "Miguel Hernandez Paz", applicantId: "APP-001265", status: "FALLIDO", paymentMethod: "tarjeta", amount: 3508, currency: "MXN", createdAt: "2026-05-05", errorCode: "insufficient_funds", retryable: true },
  { id: "ses_1007", userId: "Ricardo Morales Silva", applicantId: "APP-001260", status: "CAPTURADO", paymentMethod: "spei", amount: 6100, currency: "MXN", createdAt: "2026-05-06" },
  { id: "ses_1008", userId: "Valentina Ruiz Torres", applicantId: "APP-001256", status: "CAPTURADO", paymentMethod: "tarjeta", amount: 2578, currency: "MXN", createdAt: "2026-05-06" },
  { id: "ses_1009", userId: "Fernanda Alvarez Ruiz", applicantId: "APP-001251", status: "CAPTURADO", paymentMethod: "tarjeta", amount: 5800, currency: "MXN", createdAt: "2026-05-07" },
];

export const MORAL_SESSIONS: Session[] = [
  { id: "pm_ses_1001", userId: "TechStart Solutions SA de CV", applicantId: "APP-PM-100284", status: "CAPTURADO", paymentMethod: "spei", amount: 185000, currency: "MXN", createdAt: "2026-05-01" },
  { id: "pm_ses_1002", userId: "Grupo Delta Industrial SA de CV", applicantId: "APP-PM-100283", status: "CAPTURADO", paymentMethod: "spei", amount: 240000, currency: "MXN", createdAt: "2026-05-02" },
  { id: "pm_ses_1003", userId: "Inversiones del Norte SA de CV", applicantId: "APP-PM-100282", status: "CAPTURADO", paymentMethod: "spei", amount: 410000, currency: "MXN", createdAt: "2026-05-03" },
  { id: "pm_ses_1004", userId: "Comercializadora Bajio Norte SA de CV", applicantId: "APP-PM-100281", status: "FALLIDO", paymentMethod: "spei", amount: 125000, currency: "MXN", createdAt: "2026-05-04", errorCode: "insufficient_funds", retryable: true },
  { id: "pm_ses_1005", userId: "GRUPO DELTA INDUSTRIAL SA DE CV", applicantId: "APP-PM-100280", status: "CAPTURADO", paymentMethod: "spei", amount: 362000, currency: "MXN", createdAt: "2026-05-05" },
  { id: "pm_ses_1006", userId: "Agroinsumos del Pacifico SA de CV", applicantId: "APP-PM-100279", status: "PENDIENTE", paymentMethod: "spei", amount: 148000, currency: "MXN", createdAt: "2026-05-05" },
  { id: "pm_ses_1007", userId: "Servicios Hospitalarios Reforma SA de CV", applicantId: "APP-PM-100278", status: "CAPTURADO", paymentMethod: "spei", amount: 287000, currency: "MXN", createdAt: "2026-05-06" },
  { id: "pm_ses_1008", userId: "Manufacturas Orion SA de CV", applicantId: "APP-PM-100277", status: "CAPTURADO", paymentMethod: "spei", amount: 530000, currency: "MXN", createdAt: "2026-05-06" },
  { id: "pm_ses_1009", userId: "Distribuidora Electrica Metropoli SA de CV", applicantId: "APP-PM-100276", status: "FALLIDO", paymentMethod: "spei", amount: 196000, currency: "MXN", createdAt: "2026-05-07", errorCode: "issuer_declined", retryable: true },
];

export const SESSIONS = NATURAL_SESSIONS;

export function MdcPaymentsTab({ mode = "natural", sessions = mode === "moral" ? MORAL_SESSIONS : NATURAL_SESSIONS, range, onRangeChange }: MdcPaymentsTabProps) {
  const [selectedPayment, setSelectedPayment] = useState<Session | null>(null);
  const [internalRange, setInternalRange] = useState<RangePreset>("30d");
  const activeRange = range ?? internalRange;
  const rangeDays = RANGE_DAYS[activeRange];

  const setActiveRange = (nextRange: RangePreset) => {
    onRangeChange?.(nextRange);
    if (range === undefined) {
      setInternalRange(nextRange);
    }
  };

  const { filteredSessions, startMs } = useMemo(() => {
    if (sessions.length === 0) {
      return { filteredSessions: [] as Session[], startMs: 0 };
    }

    const latestDayMs = sessions.reduce(
      (max, session) => Math.max(max, sessionDayStartMs(session.createdAt)),
      0,
    );
    const rangeEnd = latestDayMs + DAY_MS - 1;
    const rangeStart = rangeEnd - (rangeDays * DAY_MS - 1);
    const filtered = sessions.filter((session) => {
      const dayMs = sessionDayStartMs(session.createdAt);
      return dayMs >= rangeStart && dayMs <= rangeEnd;
    });

    return { filteredSessions: filtered, startMs: rangeStart };
  }, [rangeDays, sessions]);

  const kpis = useMemo(() => {
    const totalSessions = filteredSessions.length;
    const successful = filteredSessions.filter((session) => session.status === "CAPTURADO").length;
    const failed = filteredSessions.filter((session) => session.status === "FALLIDO").length;
    const revenue = filteredSessions
      .filter((session) => session.status === "CAPTURADO")
      .reduce((acc, session) => acc + session.amount, 0);
    const successRate = totalSessions ? (successful / totalSessions) * 100 : 0;
    const avgTicket = successful ? revenue / successful : 0;
    const failureReasons = filteredSessions.filter((session) => session.status === "FALLIDO").reduce(
      (acc, session) => {
        if (session.errorCode === "insufficient_funds") {
          acc.funds += 1;
        } else {
          acc.technical += 1;
        }
        return acc;
      },
      { funds: 0, technical: 0 },
    );
    const topFailureReason = failureReasons.funds >= failureReasons.technical ? "Fondos insuficientes" : "Problema tecnico";
    const topFailureCount = Math.max(failureReasons.funds, failureReasons.technical);

    return {
      totalSessions,
      successRate,
      avgTicket,
      revenue,
      failed,
      topFailureReason,
      topFailureCount,
    };
  }, [filteredSessions]);

  const trendPoints = useMemo(() => {
    const byDate = new Map<number, number>();
    for (const session of filteredSessions) {
      if (session.status !== "CAPTURADO") continue;
      const dayMs = sessionDayStartMs(session.createdAt);
      byDate.set(dayMs, (byDate.get(dayMs) ?? 0) + session.amount);
    }

    const targetPoints = rangeDays <= 7 ? 7 : rangeDays <= 30 ? 15 : 13;
    const bucketSizeDays = Math.max(1, Math.ceil(rangeDays / targetPoints));
    const bucketCount = Math.ceil(rangeDays / bucketSizeDays);

    const bucketPoints = Array.from({ length: bucketCount }, (_, bucketIndex) => {
      const bucketStart = startMs + bucketIndex * bucketSizeDays * DAY_MS;
      const remainingDays = Math.max(rangeDays - bucketIndex * bucketSizeDays, 0);
      const daysInBucket = Math.max(0, Math.min(bucketSizeDays, remainingDays));

      let bucketTotal = 0;
      for (let dayOffset = 0; dayOffset < daysInBucket; dayOffset++) {
        const dayMs = bucketStart + dayOffset * DAY_MS;
        bucketTotal += byDate.get(dayMs) ?? 0;
      }

      return {
        label: formatBucketLabel(bucketStart, daysInBucket),
        value: bucketTotal,
      };
    });

    const firstPositiveIndex = bucketPoints.findIndex((point) => point.value > 0);
    if (firstPositiveIndex <= 0) return bucketPoints;

    const minVisiblePoints = Math.min(
      bucketPoints.length,
      rangeDays <= 7 ? 7 : rangeDays <= 30 ? 10 : 8,
    );
    const contextStart = Math.max(0, firstPositiveIndex - (minVisiblePoints - 1));
    return bucketPoints.slice(contextStart);
  }, [filteredSessions, rangeDays, startMs]);

  return (
    <>
      <section className="mdc-section">
        <article className="mdc-card mdc-pay-header">
          <div>
            <h3>Pagos</h3>
            <p>{mode === "moral" ? "Gestione cobros empresariales y sesiones de pago corporativas." : "Gestione y supervise todas las sesiones de pago."}</p>
          </div>
          <div className="mdc-pay-range">
            <label htmlFor="mdc-pay-range">Rango</label>
            <select
              id="mdc-pay-range"
              value={activeRange}
              onChange={(e) => setActiveRange(e.target.value as RangePreset)}
            >
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="90d">Ultimos 90 dias</option>
            </select>
          </div>
        </article>

        <div className="mdc-pay-kpis">
          <KpiCard title="Intentos de pago" value={String(kpis.totalSessions)} delta="Total de intentos en el periodo" />
          <KpiCard title="Pagos exitosos" value={`${kpis.successRate.toFixed(1)}%`} delta={`${kpis.totalSessions - kpis.failed} de ${kpis.totalSessions} intentos`} />
          <KpiCard title="Motivo principal de no pago" value={kpis.failed ? kpis.topFailureReason : "Sin fallos"} delta={kpis.failed ? `${kpis.topFailureCount} caso(s)` : "0 casos"} />
          <KpiCard title="Ticket promedio mensual" value={`$${formatMoney(kpis.avgTicket)} MXN`} delta="Promedio de pagos exitosos" />
          <KpiCard title="Ingresos totales mensuales" value={`$${formatMoney(kpis.revenue)} MXN`} delta="Suma de pagos capturados" />
        </div>

        <article className="mdc-card">
          <div className="mdc-card__head">
            <h3>Tendencia de pago</h3>
            <p>Monto capturado por periodo segun rango seleccionado</p>
          </div>
          <PaymentTrendChart points={trendPoints} />
        </article>

        <article className="mdc-card mdc-pay-table-wrap">
          <div className="mdc-table-wrap">
            <table className="mdc-table">
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>Usuario</th>
                  <th>Estado de pago</th>
                  <th>Metodo</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Sin sesiones de pago en el rango seleccionado.</td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.id} className="mdc-pay-row" onClick={() => setSelectedPayment(session)}>
                      <td>{session.applicantId}</td>
                      <td>{session.userId}</td>
                      <td><StatusBadge status={session.status} /></td>
                      <td className="mdc-pay-capitalize">{session.paymentMethod}</td>
                      <td className="mdc-pay-num">${formatMoney(session.amount)} {session.currency}</td>
                      <td>{session.createdAt}</td>
                      <td className="mdc-pay-arrow"><ChevronRight className="h-4 w-4" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {selectedPayment ? <PaymentScheduleDetail payment={selectedPayment} onClose={() => setSelectedPayment(null)} /> : null}
    </>
  );
}

function PaymentTrendChart({ points }: { points: { label: string; value: number }[] }) {
  const width = 1080;
  const height = 320;
  const topPad = 18;
  const rightPad = 20;
  const bottomPad = 44;
  const leftPad = 70;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;

  const { chartMax, ticks } = buildYAxis(points.map((point) => point.value));

  const xForIndex = (index: number) => leftPad + (chartWidth * index) / Math.max(points.length - 1, 1);
  const yForValue = (value: number) => topPad + chartHeight - (value / chartMax) * chartHeight;
  const linePoints = points.map((point, index) => `${xForIndex(index)},${yForValue(point.value)}`).join(" ");
  const areaPoints = `${leftPad},${topPad + chartHeight} ${linePoints} ${leftPad + chartWidth},${topPad + chartHeight}`;
  const labelStep = points.length > 10 ? Math.ceil(points.length / 8) : 1;

  return (
    <svg className="mdc-pay-trend-chart" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <defs>
        <linearGradient id="mdcPayArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => {
        const y = yForValue(tick);
        return (
          <g key={tick}>
            <line x1={leftPad} y1={y} x2={leftPad + chartWidth} y2={y} className="mdc-pay-trend-chart__grid" />
            <text x={leftPad - 8} y={y + 5} textAnchor="end" className="mdc-pay-trend-chart__y-label">
              ${formatMoneyNoDecimals(tick)}
            </text>
          </g>
        );
      })}

      <polygon points={areaPoints} className="mdc-pay-trend-chart__area" />
      <polyline points={linePoints} className="mdc-pay-trend-chart__line" />

      {points.map((point, index) => (
        <g key={`${point.label}-${index}`}>
          <circle cx={xForIndex(index)} cy={yForValue(point.value)} r="4" className="mdc-pay-trend-chart__dot" />
          {(index === 0 || index === points.length - 1 || index % labelStep === 0) && (
            <text x={xForIndex(index)} y={height - 16} textAnchor="middle" className="mdc-pay-trend-chart__x-label">
              {point.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function PaymentScheduleDetail({ payment, onClose }: { payment: Session; onClose: () => void }) {
  const installments: Installment[] = [
    { installmentNumber: 1, status: "pagado", amount: payment.amount, dueDate: "8 ene 2026" },
    { installmentNumber: 2, status: "pagado", amount: payment.amount, dueDate: "22 ene 2026" },
    { installmentNumber: 3, status: "pagado", amount: payment.amount, dueDate: "5 feb 2026" },
    { installmentNumber: 4, status: "pagado", amount: payment.amount, dueDate: "19 feb 2026" },
    { installmentNumber: 5, status: "pagado", amount: payment.amount, dueDate: "5 mar 2026" },
    { installmentNumber: 6, status: "pagado", amount: payment.amount, dueDate: "19 mar 2026" },
    { installmentNumber: 7, status: "pagado", amount: payment.amount, dueDate: "2 abr 2026" },
    { installmentNumber: 8, status: "pagado", amount: payment.amount, dueDate: "16 abr 2026" },
    { installmentNumber: 9, status: "pendiente", amount: payment.amount, dueDate: "7 may 2026" },
    { installmentNumber: 10, status: "pendiente", amount: payment.amount, dueDate: "21 may 2026" },
    { installmentNumber: 11, status: "pendiente", amount: payment.amount, dueDate: "4 jun 2026" },
    { installmentNumber: 12, status: "pendiente", amount: payment.amount, dueDate: "18 jun 2026" },
  ];

  const totalAmount = installments.reduce((acc, item) => acc + item.amount, 0);
  const paidAmount = installments.filter((item) => item.status === "pagado").reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="mdc-modal-backdrop mdc-pay-modal-backdrop">
      <div className="mdc-modal mdc-modal--wide mdc-pay-modal">
        <div className="mdc-modal-head">
          <div>
            <p>Detalle de pagos</p>
            <h3>Calendario de pagos · {payment.applicantId}</h3>
          </div>
          <button type="button" className="mdc-icon-btn" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>

        <div className="mdc-pay-kpis mdc-pay-kpis--detail">
          <KpiCard title="Monto total" value={`$${formatMoney(totalAmount)} MXN`} delta="" />
          <KpiCard title="Monto pagado" value={`$${formatMoney(paidAmount)} MXN`} delta={`${((paidAmount / totalAmount) * 100).toFixed(1)}% completado`} />
          <KpiCard title="Restante" value={`$${formatMoney(totalAmount - paidAmount)} MXN`} delta="" />
          <KpiCard title="Proximo pago" value="7/5/2026" delta="" />
        </div>

        <article className="mdc-pay-meta-box">
          <h4>Enganche / Pago inicial y recargo por mora</h4>
          <p>Terminos de pago y estructura de comisiones</p>
          <strong>No requerido</strong>
          <span className="mdc-badge mdc-badge--ok">Activo</span>
        </article>

        <article className="mdc-pay-schedule-box">
          <h4>Calendario de pagos</h4>
          <p>Cuotas de pago para este prestamo</p>

          <div className="mdc-pay-meta-grid">
            <MetaItem label="Titulo del plan" value="Terminos de pago originales" />
            <MetaItem label="Tipo" value="original" />
            <MetaItem label="Estado" value="activo" />
            <MetaItem label="Fecha creacion" value="1/4/2026" />
            <MetaItem label="Descripcion" value="Terminos iniciales acordados al aprobar el prestamo" />
          </div>

          <div className="mdc-pay-tools">
            <input placeholder="Buscar cuota..." />
            <span>Mostrando 12 de 12 resultados</span>
            <span>Tamano: 50</span>
          </div>

          <div className="mdc-pay-installments">
            {installments.map((item) => (
              <button key={item.installmentNumber} type="button" className="mdc-pay-installment-card">
                <div className="mdc-pay-installment-card__head">
                  <p>Pago {item.installmentNumber}</p>
                  <InstallmentBadge status={item.status} />
                </div>
                <strong>${formatMoney(item.amount)}</strong>
                <span>Vencido: {item.dueDate}</span>
              </button>
            ))}
          </div>

          <div className="mdc-pay-pager">
            <button type="button" className="mdc-btn mdc-btn--ghost">Anterior</button>
            <span>Pagina 1 de 1</span>
            <button type="button" className="mdc-btn mdc-btn--ghost">Siguiente</button>
          </div>
        </article>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="mdc-pay-meta-item">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function InstallmentBadge({ status }: { status: Installment["status"] }) {
  const styles: Record<Installment["status"], string> = {
    pendiente: "mdc-badge mdc-badge--warn",
    pagado: "mdc-badge mdc-badge--ok",
    vencido: "mdc-badge mdc-badge--bad",
    parcial: "mdc-badge mdc-badge--info",
    fallido: "mdc-badge mdc-badge--bad",
    cancelado: "mdc-badge mdc-badge--neutral",
  };

  return <span className={styles[status]}>{status}</span>;
}

function KpiCard({ title, value, delta }: { title: string; value: string; delta: string }) {
  const isTextValue = /[a-zA-Z]/.test(value) && !/\d/.test(value);
  return (
    <article className="mdc-card mdc-pay-kpi-card">
      <p>{title}</p>
      <strong className={isTextValue ? "mdc-pay-kpi-card__text" : ""}>{value}</strong>
      {delta ? <span>{delta}</span> : null}
    </article>
  );
}

function StatusBadge({ status }: { status: Session["status"] }) {
  const styles: Record<Session["status"], string> = {
    PENDIENTE: "mdc-badge mdc-badge--warn",
    PROCESANDO: "mdc-badge mdc-badge--info",
    CAPTURADO: "mdc-badge mdc-badge--ok",
    FALLIDO: "mdc-badge mdc-badge--bad",
  };

  const labels: Record<Session["status"], string> = {
    PENDIENTE: "Pendiente",
    PROCESANDO: "En proceso",
    CAPTURADO: "Pagado",
    FALLIDO: "No pagado",
  };

  return <span className={styles[status]}>{labels[status]}</span>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatMoneyNoDecimals(value: number) {
  return new Intl.NumberFormat("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function sessionDayStartMs(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return Date.UTC(year, month - 1, day);
}

function formatChartDate(dayMs: number) {
  const date = new Date(dayMs);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month} ${day}`;
}

function formatBucketLabel(startDayMs: number, daysInBucket: number) {
  if (daysInBucket <= 1) return formatChartDate(startDayMs);
  const endDayMs = startDayMs + (daysInBucket - 1) * DAY_MS;
  return formatChartDate(endDayMs);
}

function buildYAxis(values: number[]) {
  const maxValue = Math.max(...values, 1);
  const roughStep = Math.max(maxValue / 4, 1);
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceBase =
    normalized <= 1 ? 1 :
      normalized <= 2 ? 2 :
        normalized <= 5 ? 5 : 10;
  const step = niceBase * magnitude;
  const chartMax = Math.max(step * 4, Math.ceil(maxValue / step) * step);
  const ticks = [0, step, step * 2, step * 3, step * 4];
  return { chartMax, ticks };
}
