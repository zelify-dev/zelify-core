"use client";

import { ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";

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

export const SESSIONS: Session[] = [
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

export function MdcPaymentsTab() {
  const [selectedPayment, setSelectedPayment] = useState<Session | null>(null);

  const kpis = useMemo(() => {
    const totalSessions = SESSIONS.length;
    const successful = SESSIONS.filter((session) => session.status === "CAPTURADO").length;
    const failed = SESSIONS.filter((session) => session.status === "FALLIDO").length;
    const revenue = SESSIONS.filter((session) => session.status === "CAPTURADO").reduce((acc, session) => acc + session.amount, 0);
    const successRate = totalSessions ? (successful / totalSessions) * 100 : 0;
    const avgTicket = successful ? revenue / successful : 0;
    const failureReasons = SESSIONS.filter((session) => session.status === "FALLIDO").reduce(
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
  }, []);

  const trendPoints = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const session of SESSIONS) {
      if (session.status !== "CAPTURADO") continue;
      byDate.set(session.createdAt, (byDate.get(session.createdAt) ?? 0) + session.amount);
    }

    const dates = Array.from(new Set(SESSIONS.map((session) => session.createdAt))).sort();
    return dates.reduce<{ running: number; points: { label: string; value: number }[] }>(
      (acc, date) => {
        const nextValue = acc.running + (byDate.get(date) ?? 0);
        return {
          running: nextValue,
          points: [...acc.points, { label: formatChartDate(date), value: nextValue }],
        };
      },
      { running: 0, points: [] },
    ).points;
  }, []);

  return (
    <>
      <section className="mdc-section">
        <article className="mdc-card mdc-pay-header">
          <div>
            <h3>Pagos</h3>
            <p>Gestione y supervise todas las sesiones de pago.</p>
          </div>
          <div className="mdc-pay-range">
            <label htmlFor="mdc-pay-range">Rango</label>
            <select id="mdc-pay-range" defaultValue="30d">
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
            <p>Evolucion mensual de cobranzas y pagos</p>
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
                {SESSIONS.map((session) => (
                  <tr key={session.id} className="mdc-pay-row" onClick={() => setSelectedPayment(session)}>
                    <td>{session.applicantId}</td>
                    <td>{session.userId}</td>
                    <td><StatusBadge status={session.status} /></td>
                    <td className="mdc-pay-capitalize">{session.paymentMethod}</td>
                    <td className="mdc-pay-num">${formatMoney(session.amount)} {session.currency}</td>
                    <td>{session.createdAt}</td>
                    <td className="mdc-pay-arrow"><ChevronRight className="h-4 w-4" /></td>
                  </tr>
                ))}
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

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const step = 6500;
  const chartMax = Math.ceil(maxValue / step) * step;
  const ticks = [0, step, step * 2, step * 3, step * 4].map((tick) => Math.min(tick, chartMax)).filter((tick, i, arr) => arr.indexOf(tick) === i);

  const xForIndex = (index: number) => leftPad + (chartWidth * index) / Math.max(points.length - 1, 1);
  const yForValue = (value: number) => topPad + chartHeight - (value / chartMax) * chartHeight;
  const linePoints = points.map((point, index) => `${xForIndex(index)},${yForValue(point.value)}`).join(" ");
  const areaPoints = `${leftPad},${topPad + chartHeight} ${linePoints} ${leftPad + chartWidth},${topPad + chartHeight}`;

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
          <text x={xForIndex(index)} y={height - 16} textAnchor="middle" className="mdc-pay-trend-chart__x-label">
            {point.label}
          </text>
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

function formatChartDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  const day = String(date.getDate()).padStart(2, "0");
  return `${month} ${day}`;
}
