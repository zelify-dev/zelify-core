"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import "./lim-screen.css";

type MainTab = "cashflow" | "bank" | "expected" | "reconciliation" | "financing" | "dashboard";
type ScenarioId = "real" | "optimista" | "pesimista";
type ScenarioOverlayId = "optimista" | "pesimista";
type ViewMode = "mensual" | "trimestral" | "semestral" | "anual";

const MONTHS = ["May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene", "Feb", "Mar", "Abr"];

const BANKS_DATA = [
  { name: "Banco Pichincha", account: "****4821", currency: "USD", balance: 1_360_000, syncAgo: "3 min", status: "Online" },
  { name: "Produbanco", account: "****9034", currency: "USD", balance: 910_000, syncAgo: "5 min", status: "Online" },
  { name: "Banco Guayaquil", account: "****2210", currency: "USD", balance: 640_000, syncAgo: "12 min", status: "Online" },
  { name: "Banco Bolivariano", account: "****3381", currency: "USD", balance: 1_730_000, syncAgo: "9 min", status: "Online" },
  { name: "Banco del Pacífico", account: "****8803", currency: "USD", balance: 180_000, syncAgo: "15 min", status: "Online" },
];

function fmt(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}
function fmtFull(v: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
}

type MonthRow = {
  label: string;
  balanceStart: number;
  inflow: number;
  inflowAR: number;
  inflowServices: number;
  inflowOther: number;
  outflow: number;
  outflowSuppliers: number;
  outflowPayroll: number;
  balanceEnd: number;
};

function buildRows(scenario: ScenarioId): MonthRow[] {
  const annualGrowth =
    scenario === "optimista" ? 0.25 : scenario === "pesimista" ? -0.4 : 0.03;
  const growth = Math.pow(1 + annualGrowth, 1 / 12) - 1;

  let inflow = 1_180_000;
  let outflow = 1_020_000;
  let bal = 4_820_000;
  const rows: MonthRow[] = [];

  for (let i = 0; i < MONTHS.length; i++) {
    if (i > 0) {
      inflow *= 1 + growth;
      outflow *= 1 + growth * 0.65;
    }
    const inf = Math.round(inflow);
    const out = Math.round(outflow);
    const end = bal + inf - out;
    rows.push({
      label: MONTHS[i],
      balanceStart: Math.round(bal),
      inflow: inf,
      inflowAR: Math.round(inf * 0.63),
      inflowServices: Math.round(inf * 0.25),
      inflowOther: Math.round(inf * 0.12),
      outflow: out,
      outflowSuppliers: Math.round(out * 0.71),
      outflowPayroll: Math.round(out * 0.29),
      balanceEnd: Math.round(end),
    });
    bal = end;
  }
  return rows;
}

function aggregateRows(rows: MonthRow[], viewMode: ViewMode): MonthRow[] {
  if (viewMode === "mensual") return rows;

  const size = viewMode === "trimestral" ? 3 : viewMode === "semestral" ? 6 : rows.length;
  const out: MonthRow[] = [];

  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    if (chunk.length === 0) continue;
    const first = chunk[0];
    const last = chunk[chunk.length - 1];

    out.push({
      label: viewMode === "anual" ? "Anual" : `${first.label}-${last.label}`,
      balanceStart: first.balanceStart,
      inflow: chunk.reduce((s, r) => s + r.inflow, 0),
      inflowAR: chunk.reduce((s, r) => s + r.inflowAR, 0),
      inflowServices: chunk.reduce((s, r) => s + r.inflowServices, 0),
      inflowOther: chunk.reduce((s, r) => s + r.inflowOther, 0),
      outflow: chunk.reduce((s, r) => s + r.outflow, 0),
      outflowSuppliers: chunk.reduce((s, r) => s + r.outflowSuppliers, 0),
      outflowPayroll: chunk.reduce((s, r) => s + r.outflowPayroll, 0),
      balanceEnd: last.balanceEnd,
    });
  }

  return out;
}

/* ─── SVG Cashflow Chart — siempre muestra Real + escenarios seleccionados ─── */
function CashflowChart({
  realRows,
  optimistaRows,
  pessimistaRows,
  activeMonth,
  scenario,
  showOptimista,
  showPesimista,
}: {
  realRows: MonthRow[];
  optimistaRows: MonthRow[];
  pessimistaRows: MonthRow[];
  activeMonth: number;
  scenario: ScenarioId;
  showOptimista: boolean;
  showPesimista: boolean;
}) {
  const W = 860, H = 360, PL = 62, PR = 12, PT = 36, PB = 38;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  // Barras siempre animadas hacia el escenario activo
  const targetRows =
    scenario === "optimista" ? optimistaRows
      : scenario === "pesimista" ? pessimistaRows
        : realRows;

  const [animRows, setAnimRows] = useState<MonthRow[]>(realRows);
  const fromRef = useRef<MonthRow[]>(realRows);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = targetRows;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const START = performance.now();
    const DUR = 620;
    const LAG = 36; // ms por barra (ola izq→der)
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = (now: number) => {
      const el = now - START;
      setAnimRows(from.map((f, i) => {
        const t = ease(Math.min(Math.max(el - i * LAG, 0) / DUR, 1));
        return {
          ...to[i],
          inflow: Math.round(f.inflow + (to[i].inflow - f.inflow) * t),
          outflow: Math.round(f.outflow + (to[i].outflow - f.outflow) * t),
          balanceEnd: Math.round(f.balanceEnd + (to[i].balanceEnd - f.balanceEnd) * t),
          balanceStart: Math.round(f.balanceStart + (to[i].balanceStart - f.balanceStart) * t),
        };
      }));
      if (el < DUR + (from.length - 1) * LAG) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setAnimRows(to);
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [targetRows]);

  // Escala Y: máximo global entre los 3 escenarios para que las líneas sean comparables
  const max = Math.max(
    ...optimistaRows.map((r) => r.balanceEnd),
    ...pessimistaRows.map((r) => r.balanceEnd),
    ...realRows.map((r) => Math.max(r.inflow, r.balanceEnd)),
    1,
  );
  const ys = (v: number) => PT + cH - (Math.max(v, 0) / max) * cH;
  const slotW = cW / realRows.length;
  const bW = slotW * 0.30;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);

  const pts = (rows: MonthRow[]) =>
    rows.map((r, i) => `${PL + i * slotW + slotW / 2},${ys(r.balanceEnd)}`).join(" ");

  const realPts = pts(realRows);
  const optPts = pts(optimistaRows);
  const pesPts = pts(pessimistaRows);

  // Colores de barras del escenario activo
  const iColor = scenario === "optimista" ? "#34d399" : scenario === "pesimista" ? "#fcd34d" : "#86efac";
  const oColor = scenario === "optimista" ? "#6ee7b7" : scenario === "pesimista" ? "#f87171" : "#fca5a5";
  const activeBg = scenario === "optimista" ? "#f0fdf4" : scenario === "pesimista" ? "#fef2f2" : "#eff6ff";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lim-chart-svg" aria-hidden>
      {/* Leyenda en la parte superior */}
      <g transform={`translate(${PL}, 10)`}>
        <rect width={9} height={9} fill="#86efac" rx={1} />
        <text x={12} y={9} fontSize={9} fill="#6b7280">Entradas</text>
        <rect x={65} width={9} height={9} fill="#fca5a5" rx={1} />
        <text x={77} y={9} fontSize={9} fill="#6b7280">Salidas</text>
        {/* Línea Real */}
        <line x1={135} y1={4} x2={155} y2={4} stroke="#1d4ed8" strokeWidth={scenario === "real" ? 2.5 : 1.5} strokeDasharray="5 3" />
        <circle cx={145} cy={4} r={2.5} fill="#1d4ed8" />
        <text x={158} y={8} fontSize={9} fill="#1d4ed8" fontWeight={scenario === "real" ? "700" : "400"}>Real</text>
        {/* Línea Optimista */}
        <line x1={190} y1={4} x2={210} y2={4} stroke="#059669" strokeWidth={scenario === "optimista" ? 2.5 : 1.5} strokeDasharray="5 3" opacity={showOptimista ? 1 : 0.25} />
        <circle cx={200} cy={4} r={2.5} fill="#059669" />
        <text x={213} y={8} fontSize={9} fill="#059669" fontWeight={scenario === "optimista" ? "700" : "400"} opacity={showOptimista ? 1 : 0.35}>Optimista</text>
        {/* Línea Pesimista */}
        <line x1={268} y1={4} x2={288} y2={4} stroke="#dc2626" strokeWidth={scenario === "pesimista" ? 2.5 : 1.5} strokeDasharray="5 3" opacity={showPesimista ? 1 : 0.25} />
        <circle cx={278} cy={4} r={2.5} fill="#dc2626" />
        <text x={291} y={8} fontSize={9} fill="#dc2626" fontWeight={scenario === "pesimista" ? "700" : "400"} opacity={showPesimista ? 1 : 0.35}>Pesimista</text>
      </g>

      {/* Grid Y */}
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PL} y1={ys(v)} x2={W - PR} y2={ys(v)} stroke="#f3f4f6" strokeWidth={1} />
          <text x={PL - 6} y={ys(v) + 4} textAnchor="end" className="lim-chart-lbl">
            {v === 0 ? "0" : fmt(v)}
          </text>
        </g>
      ))}

      {/* Fondo mes activo */}
      <rect x={PL + activeMonth * slotW} y={PT} width={slotW} height={cH} fill={activeBg} opacity={0.9} />

      {/* Barras — siempre el escenario seleccionado con animación ola */}
      {animRows.map((r, i) => {
        const cx = PL + i * slotW + slotW / 2;
        const iH = Math.max((r.inflow / max) * cH, 0);
        const oH = Math.max((r.outflow / max) * cH, 0);
        return (
          <g key={r.label}>
            <rect x={cx - bW - 1} y={PT + cH - iH} width={bW} height={iH} fill={iColor} rx={2} opacity={0.9} />
            <rect x={cx + 1} y={PT + cH - oH} width={bW} height={oH} fill={oColor} rx={2} opacity={0.9} />
          </g>
        );
      })}

      {/* ── Las 3 líneas de saldo siempre visibles ── */}

      {/* Pesimista — rojo */}
      {showPesimista && (
        <>
          <polyline
            points={pesPts}
            fill="none"
            stroke="#dc2626"
            strokeWidth={scenario === "pesimista" ? 2.5 : 1.2}
            strokeDasharray="5 3"
            strokeLinecap="round"
            opacity={scenario === "pesimista" ? 1 : 0.45}
          />
          {pessimistaRows.map((r, i) => (
            <circle
              key={i}
              cx={PL + i * slotW + slotW / 2}
              cy={ys(r.balanceEnd)}
              r={scenario === "pesimista" ? 3.5 : 2}
              fill="#dc2626"
              opacity={scenario === "pesimista" ? 1 : 0.4}
            />
          ))}
        </>
      )}

      {/* Real — azul (siempre visible, siempre en primer plano si está activo) */}
      <polyline
        points={realPts}
        fill="none"
        stroke="#1d4ed8"
        strokeWidth={scenario === "real" ? 2.5 : 1.5}
        strokeDasharray="5 3"
        strokeLinecap="round"
        opacity={scenario === "real" ? 1 : 0.55}
      />
      {realRows.map((r, i) => (
        <circle
          key={i}
          cx={PL + i * slotW + slotW / 2}
          cy={ys(r.balanceEnd)}
          r={scenario === "real" ? 3.5 : 2.5}
          fill="#1d4ed8"
          opacity={scenario === "real" ? 1 : 0.55}
        />
      ))}

      {/* Optimista — verde */}
      {showOptimista && (
        <>
          <polyline
            points={optPts}
            fill="none"
            stroke="#059669"
            strokeWidth={scenario === "optimista" ? 2.5 : 1.2}
            strokeDasharray="5 3"
            strokeLinecap="round"
            opacity={scenario === "optimista" ? 1 : 0.45}
          />
          {optimistaRows.map((r, i) => (
            <circle
              key={i}
              cx={PL + i * slotW + slotW / 2}
              cy={ys(r.balanceEnd)}
              r={scenario === "optimista" ? 3.5 : 2}
              fill="#059669"
              opacity={scenario === "optimista" ? 1 : 0.4}
            />
          ))}
        </>
      )}

      {/* Etiquetas X */}
      {realRows.map((r, i) => (
        <text
          key={i}
          x={PL + i * slotW + slotW / 2}
          y={H - 6}
          textAnchor="middle"
          className={`lim-chart-lbl${i === activeMonth ? " lim-chart-lbl--active" : ""}`}
        >
          {r.label.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

/* ─── Dashboard mini charts ─── */
function BarChart2() {
  // Valores en miles USD — reales con variación natural
  const data = [
    { l: "Ene", a: 1_312, f: 1_220 },
    { l: "Feb", a: 974, f: 1_350 },
    { l: "Mar", a: 1_438, f: 1_410 },
    { l: "Abr", a: 2_183, f: 1_580 },
    { l: "May", a: 1_726, f: 1_635 },
    { l: "Jun", a: 1_149, f: 1_780 },
  ];
  const max = 2_400;
  const W = 340, H = 170, PL = 42, PB = 30;
  const cH = H - 14 - PB; const cW = W - PL - 10;
  const sw = cW / data.length; const bw = sw * 0.34;
  const yTicks = [0, 800, 1600, 2400];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lim-mini-svg" aria-hidden>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PL} y1={14 + cH - (v / max) * cH} x2={W - 10} y2={14 + cH - (v / max) * cH} stroke="#f3f4f6" strokeWidth={1} />
          <text x={PL - 4} y={14 + cH - (v / max) * cH + 4} textAnchor="end" fontSize={8} fill="#9ca3af">${v === 0 ? "0" : `${v / 1000}M`}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = PL + i * sw + sw / 2;
        return (
          <g key={d.l}>
            <rect x={cx - bw - 1} y={14 + cH - (d.a / max) * cH} width={bw} height={(d.a / max) * cH} fill="#1d4ed8" opacity={0.85} rx={1} />
            <rect x={cx + 1} y={14 + cH - (d.f / max) * cH} width={bw} height={(d.f / max) * cH} fill="#93c5fd" opacity={0.85} rx={1} />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize={8.5} fill="#9ca3af">{d.l}</text>
          </g>
        );
      })}
      <g transform={`translate(${PL}, ${H - 4})`}>
        <rect width={7} height={5} fill="#1d4ed8" />
        <text x={9} y={5} fontSize={7.5} fill="#6b7280">Real</text>
        <rect x={36} width={7} height={5} fill="#93c5fd" />
        <text x={45} y={5} fontSize={7.5} fill="#6b7280">Forecast</text>
      </g>
    </svg>
  );
}

function AreaChart() {
  // Cobros mensuales en miles USD — variación realista, no lineal
  const data = [842, 1_143, 978, 1_267, 1_093, 1_408, 1_312, 1_489, 1_376, 1_523, 1_289, 1_614];
  const lbls = [{ l: "Ene", i: 0 }, { l: "Mar", i: 2 }, { l: "May", i: 4 }, { l: "Jul", i: 6 }, { l: "Sep", i: 8 }, { l: "Nov", i: 10 }];
  const max = 1_800;
  const W = 340, H = 170, PL = 40, PB = 30;
  const cH = H - 14 - PB; const cW = W - PL - 10;
  const sw = cW / (data.length - 1);
  const xs = (i: number) => PL + i * sw;
  const ys = (v: number) => 14 + cH - (v / max) * cH;
  const pts = data.map((v, i) => `${xs(i)},${ys(v)}`).join(" ");
  const area = `${xs(0)},${14 + cH} ${pts} ${xs(data.length - 1)},${14 + cH}`;
  const yTicks = [0, 600, 1200, 1800];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lim-mini-svg" aria-hidden>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PL} y1={ys(v)} x2={W - 10} y2={ys(v)} stroke="#f3f4f6" strokeWidth={1} />
          <text x={PL - 4} y={ys(v) + 3} textAnchor="end" fontSize={8} fill="#9ca3af">${v === 0 ? "0" : `${v}K`}</text>
        </g>
      ))}
      <polygon points={area} fill="#bfdbfe" opacity={0.4} />
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth={1.8} strokeLinejoin="round" />
      {data.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r={2} fill="#2563eb" />)}
      {lbls.map(({ l, i }) => (
        <text key={l} x={xs(i)} y={H - 6} textAnchor="middle" fontSize={8.5} fill="#9ca3af">{l}</text>
      ))}
    </svg>
  );
}

function DonutChart() {
  const slices = [
    { pct: 24.3, color: "#1e3a8a", label: "Mat. primas" },
    { pct: 37.1, color: "#2563eb", label: "Salarios" },
    { pct: 19.8, color: "#60a5fa", label: "F. externo" },
    { pct: 18.8, color: "#bfdbfe", label: "Servicios" },
  ];
  const cx = 80, cy = 75, ro = 55, ri = 28;
  const rad = (d: number) => (d * Math.PI) / 180;
  let ang = -90;
  const arcs = slices.map((s) => { const st = ang; ang += (s.pct / 100) * 360; return { ...s, st, en: ang }; });
  const path = (st: number, en: number) => {
    const lg = en - st > 180 ? 1 : 0;
    const x1 = cx + ro * Math.cos(rad(st)); const y1 = cy + ro * Math.sin(rad(st));
    const x2 = cx + ro * Math.cos(rad(en)); const y2 = cy + ro * Math.sin(rad(en));
    const xi1 = cx + ri * Math.cos(rad(en)); const yi1 = cy + ri * Math.sin(rad(en));
    const xi2 = cx + ri * Math.cos(rad(st)); const yi2 = cy + ri * Math.sin(rad(st));
    return `M${x1},${y1} A${ro},${ro} 0 ${lg} 1 ${x2},${y2} L${xi1},${yi1} A${ri},${ri} 0 ${lg} 0 ${xi2},${yi2} Z`;
  };
  return (
    <svg viewBox="0 0 280 160" className="lim-mini-svg" aria-hidden>
      {arcs.map((a) => <path key={a.label} d={path(a.st, a.en)} fill={a.color} />)}
      {arcs.map((a) => {
        const mid = (a.st + a.en) / 2;
        return <text key={a.label} x={cx + (ro + 14) * Math.cos(rad(mid))} y={cy + (ro + 14) * Math.sin(rad(mid))} textAnchor="middle" fontSize={8} fill="#374151">{a.pct}%</text>;
      })}
      {slices.map((s, i) => (
        <g key={s.label} transform={`translate(168,${16 + i * 20})`}>
          <rect width={10} height={10} fill={s.color} rx={2} />
          <text x={14} y={9} fontSize={9} fill="#4b5563">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

function StackedBarChart() {
  // Salidas en miles USD: [proveedores, nómina, servicios] — variación mensual realista
  const data = [
    [487, 213, 94], [431, 218, 87], [523, 221, 103], [618, 226, 119],
    [554, 219, 108], [641, 228, 131], [589, 224, 117], [563, 217, 104],
    [512, 215, 98], [498, 221, 91], [571, 226, 113], [542, 219, 107],
  ];
  const lbls = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const colors = ["#1d4ed8", "#60a5fa", "#bfdbfe"];
  const max = 850;
  const W = 340, H = 170, PL = 8, PB = 30;
  const cH = H - 14 - PB; const cW = W - PL - 8;
  const sw = cW / data.length; const bw = sw * 0.68;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="lim-mini-svg" aria-hidden>
      <line x1={PL} y1={14 + cH} x2={W - 8} y2={14 + cH} stroke="#e5e7eb" />
      {data.map((d, i) => {
        let sy = 14 + cH;
        return (
          <g key={lbls[i]}>
            {d.map((v, j) => { const bH = (v / max) * cH; sy -= bH; return <rect key={j} x={PL + i * sw + (sw - bw) / 2} y={sy} width={bw} height={bH} fill={colors[j]} rx={j === 0 ? 1 : 0} />; })}
            {i % 2 === 0 && <text x={PL + i * sw + sw / 2} y={H - 8} textAnchor="middle" fontSize={8} fill="#9ca3af">{lbls[i]}</text>}
          </g>
        );
      })}
      <g transform={`translate(${PL}, ${H - 4})`}>
        <rect width={7} height={5} fill="#1d4ed8" /><text x={9} y={5} fontSize={7} fill="#6b7280">Proveedores</text>
        <rect x={70} width={7} height={5} fill="#60a5fa" /><text x={79} y={5} fontSize={7} fill="#6b7280">Nómina</text>
        <rect x={116} width={7} height={5} fill="#bfdbfe" /><text x={125} y={5} fontSize={7} fill="#6b7280">Servicios</text>
      </g>
    </svg>
  );
}

/* ─── Main Screen ─── */
export function LimScreen() {
  const [activeTab, setActiveTab] = useState<MainTab>("cashflow");
  const [scenarioFilters, setScenarioFilters] = useState<Set<ScenarioOverlayId>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("mensual");
  const [activeMonth, setActiveMonth] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["inflow", "outflow"]));

  // Los 3 escenarios siempre calculados para el chart multi-línea
  const realRowsBase = useMemo(() => buildRows("real"), []);
  const optimistaRowsBase = useMemo(() => buildRows("optimista"), []);
  const pessimistaRowsBase = useMemo(() => buildRows("pesimista"), []);

  const realRows = useMemo(() => aggregateRows(realRowsBase, viewMode), [realRowsBase, viewMode]);
  const optimistaRows = useMemo(() => aggregateRows(optimistaRowsBase, viewMode), [optimistaRowsBase, viewMode]);
  const pessimistaRows = useMemo(() => aggregateRows(pessimistaRowsBase, viewMode), [pessimistaRowsBase, viewMode]);

  // Para la tabla, el escenario seleccionado
  const showOptimista = scenarioFilters.has("optimista");
  const showPesimista = scenarioFilters.has("pesimista");
  const scenario: ScenarioId =
    showOptimista && !showPesimista ? "optimista"
      : showPesimista && !showOptimista ? "pesimista"
        : "real";

  const rows = scenario === "optimista" ? optimistaRows
    : scenario === "pesimista" ? pessimistaRows
      : realRows;
  const safeActiveMonth = Math.min(activeMonth, Math.max(rows.length - 1, 0));

  const totals = useMemo(() => {
    const totalInflow = rows.reduce((s, r) => s + r.inflow, 0);
    const totalOutflow = rows.reduce((s, r) => s + r.outflow, 0);
    return {
      totalInflow,
      totalOutflow,
      balance: rows[rows.length - 1].balanceEnd,
      adjustment: Math.round(totalInflow * 0.054),
      investments: Math.round(totalInflow * 0.041),
    };
  }, [rows]);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const chartAnimKey = `${viewMode}-${showOptimista ? "1" : "0"}-${showPesimista ? "1" : "0"}`;

  const scenarioLabel =
    showOptimista && showPesimista ? "Escenarios activos: Optimista +25% anual y Pesimista -40% anual"
      : scenario === "optimista" ? "Escenario optimista +25% anual"
        : scenario === "pesimista" ? "Escenario pesimista -40% anual"
          : "Escenario real";

  const scenarioSelectLabel =
    showOptimista && showPesimista ? "Real + Optimista + Pesimista"
      : showOptimista ? "Real + Optimista"
        : showPesimista ? "Real + Pesimista"
          : "Real";

  const kpiValCls =
    scenario === "optimista" ? "lim-kpi-val--opt"
      : scenario === "pesimista" ? "lim-kpi-val--pes"
        : "lim-kpi-val--blue";

  const TABS: { id: MainTab; label: string; badge?: string }[] = [
    { id: "cashflow", label: "Cashflow" },
    { id: "bank", label: "Banco", badge: "12" },
    { id: "expected", label: "Esperado", badge: "4" },
    { id: "reconciliation", label: "Conciliación" },
    { id: "financing", label: "Financiamiento" },
    { id: "dashboard", label: "Dashboard" },
  ];

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <div className="zelify-workspace-page__scroll">
        <div className="lim-root zelify-workspace-page__inner">

          {/* ── Top tab bar ── */}
          <div className="lim-topbar">
            <nav className="lim-tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  className={`lim-tab${activeTab === t.id ? " lim-tab--active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                  {t.badge && (
                    <span className="lim-tab-badge">{t.badge}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="lim-topbar-right">
              <span className="lim-system-pill">Sistema activo</span>
            </div>
          </div>

          {/* ── Sub-controls bar (cashflow & expected tabs) ── */}
          {(activeTab === "cashflow" || activeTab === "expected") && (
            <div className="lim-subbar">
              <div className="lim-subbar-left">
                <select className="lim-sel">
                  <option>Todos los proyectos</option>
                </select>
                <select className="lim-sel">
                  <option>Abr → May</option>
                  <option>Ene → Dic</option>
                </select>
                <details className={`lim-scenario-select${scenario === "optimista" ? " lim-scenario-select--opt" : scenario === "pesimista" ? " lim-scenario-select--pes" : ""}`}>
                  <summary className="lim-scenario-select__summary">{scenarioSelectLabel}</summary>
                  <div className="lim-scenario-select__menu">
                    <label className="lim-scenario-select__item">
                      <input type="checkbox" checked readOnly />
                      <span>Real</span>
                    </label>
                    <label className="lim-scenario-select__item">
                      <input
                        type="checkbox"
                        checked={showOptimista}
                        onChange={(e) =>
                          setScenarioFilters((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add("optimista");
                            else next.delete("optimista");
                            return next;
                          })}
                      />
                      <span>Optimista</span>
                    </label>
                    <label className="lim-scenario-select__item">
                      <input
                        type="checkbox"
                        checked={showPesimista}
                        onChange={(e) =>
                          setScenarioFilters((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add("pesimista");
                            else next.delete("pesimista");
                            return next;
                          })}
                      />
                      <span>Pesimista</span>
                    </label>
                  </div>
                </details>
                <select className="lim-sel" value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)}>
                  <option value="mensual">Vista consolidada</option>
                  <option value="trimestral">Vista trimestral</option>
                  <option value="semestral">Vista semestral</option>
                  <option value="anual">Vista anual</option>
                </select>
              </div>
              <div className="lim-subbar-right">
                <button className="lim-btn-ghost" type="button">Actualizar cálculo</button>
                <button className="lim-btn-ghost" type="button">··· Opciones</button>
              </div>
            </div>
          )}

          {/* ══════════════ CASHFLOW TAB ══════════════ */}
          {activeTab === "cashflow" && (
            <div className="lim-cf-layout">
              {/* KPI sidebar */}
              <aside className="lim-kpi-side">
                <div className="lim-kpi-primary">
                  <span className={`lim-kpi-val ${kpiValCls}`}>{fmt(totals.balance)}</span>
                  <span className={`lim-kpi-pill${scenario === "optimista" ? " lim-kpi-pill--opt" : scenario === "pesimista" ? " lim-kpi-pill--pes" : " lim-kpi-pill--blue"}`}>● Saldo de caja</span>
                </div>
                <div className="lim-kpi-item">
                  <span className="lim-kpi-val lim-kpi-val--sm">+{fmt(totals.adjustment)}</span>
                  <span className="lim-kpi-sub">Ajuste ⓘ</span>
                </div>
                <div className="lim-kpi-item">
                  <span className="lim-kpi-val lim-kpi-val--sm">+{fmt(totals.investments)}</span>
                  <span className="lim-kpi-sub">Inversiones ⓘ</span>
                </div>
                <div className="lim-kpi-sep" />
                <div className="lim-kpi-item">
                  <span className="lim-kpi-pill lim-kpi-pill--purple">● Total</span>
                  <span className="lim-kpi-val lim-kpi-val--sm">+{fmt(totals.balance + totals.adjustment + totals.investments)}</span>
                </div>
              </aside>

              {/* chart + table */}
              <div className="lim-cf-main">
                <div key={chartAnimKey} className="lim-chart-wrap lim-chart-wrap--scenario-swap">
                  <CashflowChart
                    realRows={realRows}
                    optimistaRows={optimistaRows}
                    pessimistaRows={pessimistaRows}
                    activeMonth={safeActiveMonth}
                    scenario={scenario}
                    showOptimista={showOptimista}
                    showPesimista={showPesimista}
                  />
                </div>

                {/* Scenario banner */}
                {(showOptimista || showPesimista) && (
                  <div className={`lim-scenario-banner${scenario === "pesimista" && !showOptimista ? " lim-scenario-banner--pes" : " lim-scenario-banner--opt"}`}>
                    <span className="lim-scenario-banner__dot" />
                    <strong>{scenarioLabel}</strong>
                    <span>— Los valores proyectados se muestran en {showOptimista && showPesimista ? "verde y rojo" : scenario === "optimista" ? "verde" : "rojo"}</span>
                  </div>
                )}

                <div className="lim-tbl-scroll">
                  <table className="lim-tbl" data-scenario={scenario}>
                    <thead>
                      <tr>
                        <th className="lim-th-label">
                          <input className="lim-search" placeholder="Buscar…" type="search" />
                        </th>
                        {rows.map((r, i) => (
                          <th
                            key={r.label}
                            className={`lim-th-month${i === safeActiveMonth ? " lim-th-month--active" : ""}`}
                            onClick={() => setActiveMonth(i)}
                          >
                            {r.label.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Saldo inicial */}
                      <tr className="lim-tr-section">
                        <td className="lim-td-lbl"><span className="lim-dot lim-dot--blue" />Saldo inicial de caja</td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>{fmtFull(r.balanceStart)}</td>
                        ))}
                      </tr>

                      {/* Entradas */}
                      <tr className="lim-tr-group" onClick={() => toggle("inflow")}>
                        <td className="lim-td-lbl lim-td-lbl--group">
                          <span className={`lim-arrow${expanded.has("inflow") ? " lim-arrow--open" : ""}`}>▶</span>
                          <span className="lim-dot lim-dot--green" />Entradas de efectivo
                        </td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n lim-td-n--bold${i === safeActiveMonth ? " lim-td-n--active lim-td-n--green" : ""}`}>
                            {fmtFull(r.inflow)}
                          </td>
                        ))}
                      </tr>
                      {expanded.has("inflow") && (
                        <>
                          {[
                            { key: "inflowAR", label: "Cobros clientes A/R" },
                            { key: "inflowServices", label: "Ingresos por servicios" },
                            { key: "inflowOther", label: "Otros ingresos" },
                          ].map(({ key, label }) => (
                            <tr key={key} className="lim-tr-sub">
                              <td className="lim-td-lbl lim-td-lbl--sub">{label}</td>
                              {rows.map((r, i) => (
                                <td key={r.label} className={`lim-td-n lim-td-n--sub${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                  {fmtFull(r[key as keyof MonthRow] as number)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Salidas */}
                      <tr className="lim-tr-group" onClick={() => toggle("outflow")}>
                        <td className="lim-td-lbl lim-td-lbl--group">
                          <span className={`lim-arrow${expanded.has("outflow") ? " lim-arrow--open" : ""}`}>▶</span>
                          <span className="lim-dot lim-dot--red" />Salidas de efectivo
                        </td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n lim-td-n--bold${i === safeActiveMonth ? " lim-td-n--active lim-td-n--red" : ""}`}>
                            {fmtFull(r.outflow)}
                          </td>
                        ))}
                      </tr>
                      {expanded.has("outflow") && (
                        <>
                          {[
                            { key: "outflowSuppliers", label: "Pago proveedores" },
                            { key: "outflowPayroll", label: "Nómina" },
                          ].map(({ key, label }) => (
                            <tr key={key} className="lim-tr-sub">
                              <td className="lim-td-lbl lim-td-lbl--sub">{label}</td>
                              {rows.map((r, i) => (
                                <td key={r.label} className={`lim-td-n lim-td-n--sub${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                  {fmtFull(r[key as keyof MonthRow] as number)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </>
                      )}

                      {/* Saldo final */}
                      <tr className="lim-tr-section">
                        <td className="lim-td-lbl"><span className="lim-dot lim-dot--blue" />Saldo final del mes</td>
                        {rows.map((r, i) => (
                          <td key={r.label} className={`lim-td-n lim-td-n--bold${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>{fmtFull(r.balanceEnd)}</td>
                        ))}
                      </tr>

                      {/* KPIs */}
                      <tr className="lim-tr-group" onClick={() => toggle("kpi")}>
                        <td className="lim-td-lbl lim-td-lbl--group">
                          <span className={`lim-arrow${expanded.has("kpi") ? " lim-arrow--open" : ""}`}>▶</span>
                          <span className="lim-dot lim-dot--orange" />Indicadores clave
                        </td>
                        {rows.map((r, i) => {
                          const net = r.inflow - r.outflow;
                          return (
                            <td key={r.label} className={`lim-td-n lim-td-n--bold${net >= 0 ? " lim-td-n--green" : " lim-td-n--red"}${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                              {net >= 0 ? "+" : ""}{fmtFull(net)}
                            </td>
                          );
                        })}
                      </tr>
                      {expanded.has("kpi") && (
                        <>
                          <tr className="lim-tr-sub">
                            <td className="lim-td-lbl lim-td-lbl--sub">Saldo EOM <span className="lim-kpi-acronym">End of Month</span></td>
                            {rows.map((r, i) => (
                              <td key={r.label} className={`lim-td-n lim-td-n--sub lim-td-n--blue${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                {fmtFull(r.balanceEnd)}
                              </td>
                            ))}
                          </tr>
                          <tr className="lim-tr-sub">
                            <td className="lim-td-lbl lim-td-lbl--sub">Burn rate mensual</td>
                            {rows.map((r, i) => (
                              <td key={r.label} className={`lim-td-n lim-td-n--sub${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                {fmtFull(r.outflow)}
                              </td>
                            ))}
                          </tr>
                          <tr className="lim-tr-sub">
                            <td className="lim-td-lbl lim-td-lbl--sub">Caja neta acumulada</td>
                            {(() => {
                              let acc = 0;
                              return rows.map((r, i) => {
                                acc += r.inflow - r.outflow;
                                return (
                                  <td key={r.label} className={`lim-td-n lim-td-n--sub${acc >= 0 ? " lim-td-n--green" : " lim-td-n--red"}${i === safeActiveMonth ? " lim-td-n--active" : ""}`}>
                                    {acc >= 0 ? "+" : ""}{fmtFull(acc)}
                                  </td>
                                );
                              });
                            })()}
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ BANCO TAB ══════════════ */}
          {activeTab === "bank" && (
            <div className="lim-panel">
              <div className="lim-section-head">Posición consolidada multi-banco · Tiempo real</div>
              <table className="lim-tbl lim-tbl--list">
                <thead>
                  <tr>
                    {["Banco", "Cuenta", "Moneda", "Saldo actual", "Últ. sync", "Estado"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BANKS_DATA.map((b) => (
                    <tr key={b.account}>
                      <td>{b.name}</td>
                      <td className="lim-td-mono">{b.account}</td>
                      <td>{b.currency}</td>
                      <td className="lim-td-n lim-td-n--bold">${fmtFull(b.balance)}</td>
                      <td className="lim-td-muted">hace {b.syncAgo}</td>
                      <td><span className={`lim-pill${b.status === "Online" ? " lim-pill--green" : " lim-pill--yellow"}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="lim-kpi-row-3">
                {[
                  { label: "Total USD consolidado", val: "$4.82M" },
                  { label: "Equivalente EUR", val: "$182.4K" },
                  { label: "Cuentas sincronizadas", val: "12 / 12", sub: "100% conectadas" },
                ].map((k) => (
                  <article key={k.label} className="lim-kpi-card">
                    <span>{k.label}</span>
                    <strong>{k.val}</strong>
                    {k.sub && <small>{k.sub}</small>}
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════ ESPERADO TAB ══════════════ */}
          {activeTab === "expected" && (
            <div className="lim-panel">
              <div className="lim-section-head">Flujos esperados — Próximos 30 días</div>
              <div className="lim-kpi-row-3">
                <article className="lim-kpi-card"><span>Entradas proyectadas 30d</span><strong className="lim-val-up">$1.34M</strong></article>
                <article className="lim-kpi-card"><span>Salidas proyectadas 30d</span><strong>$1.03M</strong></article>
                <article className="lim-kpi-card"><span>Gap neto</span><strong className="lim-val-up">+$0.31M</strong></article>
              </div>
              <table className="lim-tbl lim-tbl--list">
                <thead>
                  <tr>{["Concepto", "Tipo", "Monto est.", "Prob.", "Estado"].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[
                    { c: "Cobros clientes A/R", t: "Entrada", m: 890_000, p: "95%", e: "Confirmado" },
                    { c: "Nómina quincenal", t: "Salida", m: 240_000, p: "100%", e: "Pendiente" },
                    { c: "Pago proveedores", t: "Salida", m: 610_000, p: "80%", e: "Estimado" },
                    { c: "Vencimiento CDT", t: "Entrada", m: 450_000, p: "100%", e: "Confirmado" },
                    { c: "Impuestos SRI", t: "Salida", m: 180_000, p: "100%", e: "Pendiente" },
                  ].map((item) => (
                    <tr key={item.c}>
                      <td>{item.c}</td>
                      <td className={item.t === "Entrada" ? "lim-val-up" : "lim-val-down"}>{item.t}</td>
                      <td className="lim-td-n">${fmtFull(item.m)}</td>
                      <td>{item.p}</td>
                      <td><span className={`lim-pill${item.e === "Confirmado" ? " lim-pill--green" : item.e === "Pendiente" ? " lim-pill--red" : " lim-pill--yellow"}`}>{item.e}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ══════════════ CONCILIACIÓN TAB ══════════════ */}
          {activeTab === "reconciliation" && (
            <div className="lim-panel">
              <div className="lim-section-head">Conciliación automática multi-banco</div>
              <div className="lim-recon-kpis">
                <div className="lim-recon-kpi">
                  <span className="lim-recon-kpi-val lim-val-up">1,248</span>
                  <span className="lim-recon-kpi-lbl">Transacciones conciliadas</span>
                </div>
                <div className="lim-recon-kpi">
                  <span className="lim-recon-kpi-val lim-val-warn">17</span>
                  <span className="lim-recon-kpi-lbl">Pendientes de revisión</span>
                </div>
                <div className="lim-recon-kpi">
                  <span className="lim-recon-kpi-val lim-val-down">3</span>
                  <span className="lim-recon-kpi-lbl">Diferencias detectadas</span>
                </div>
                <div className="lim-recon-kpi">
                  <span className="lim-recon-kpi-val lim-val-up">97.8%</span>
                  <span className="lim-recon-kpi-lbl">Tasa de conciliación</span>
                </div>
              </div>
              <div className="lim-section-head" style={{ marginTop: 8 }}>Diferencias pendientes</div>
              <table className="lim-tbl lim-tbl--list">
                <thead><tr>{["Banco", "Fecha", "Concepto", "Diferencia", "Estado"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { b: "Banco Bolivariano", f: "06 May 2026", c: "Transferencia interna", d: "$2,340", e: "Pendiente" },
                    { b: "Produbanco", f: "05 May 2026", c: "Cargo no identificado", d: "$180", e: "Revisión" },
                    { b: "Banco Pichincha", f: "04 May 2026", c: "Comisión bancaria", d: "$45", e: "Pendiente" },
                  ].map((item) => (
                    <tr key={item.c}>
                      <td>{item.b}</td>
                      <td className="lim-td-muted">{item.f}</td>
                      <td>{item.c}</td>
                      <td className="lim-td-n lim-val-down">{item.d}</td>
                      <td><span className="lim-pill lim-pill--yellow">{item.e}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ══════════════ FINANCIAMIENTO TAB ══════════════ */}
          {activeTab === "financing" && (
            <div className="lim-panel">
              <div className="lim-section-head">Gestión de inversiones y crédito</div>
              <div className="lim-section-subhead">Efectivo total disponible para invertir: <strong style={{ color: "#111827" }}>$1,190,000</strong></div>

              <table className="lim-tbl lim-tbl--list">
                <thead><tr>{["Instrumento", "Plazo", "Monto", "Rendimiento", "Vencimiento"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { i: "Money Market AAA", p: "30 días", m: 680_000, r: "5.1% TNA", v: "07 Jun 2026" },
                    { i: "Fondo Liquidez Plus", p: "7 días", m: 320_000, r: "4.2% TNA", v: "15 May 2026" },
                    { i: "Repo Overnight", p: "1 día", m: 190_000, r: "3.8% TNA", v: "09 May 2026" },
                    { i: "Línea Crédito Pichincha", p: "Revolving", m: 2_000_000, r: "8.5%", v: "Dic 2026" },
                  ].map((item) => (
                    <tr key={item.i}>
                      <td><strong>{item.i}</strong></td>
                      <td>{item.p}</td>
                      <td className="lim-td-n">${fmtFull(item.m)}</td>
                      <td className="lim-val-up">{item.r}</td>
                      <td className="lim-td-muted">{item.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="lim-section-head" style={{ marginTop: 8 }}>Oportunidades por plazo</div>
              <table className="lim-tbl lim-tbl--list">
                <thead><tr>{["Plazo", "Efectivo disponible", "Tasa", "Ingreso potencial"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { p: "6 meses", e: "$600,000", t: "2.9% TNA", ip: "$8,700" },
                    { p: "3 meses", e: "$350,000", t: "2.4% TNA", ip: "$2,100" },
                    { p: "1 mes", e: "$240,000", t: "2.2% TNA", ip: "$440" },
                  ].map((item) => (
                    <tr key={item.p}>
                      <td>{item.p}</td>
                      <td className="lim-td-n">{item.e}</td>
                      <td>{item.t}</td>
                      <td className="lim-td-n lim-val-up">{item.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Panel IA ── */}
              <div className="lim-ai-panel">
                <div className="lim-ai-header">
                  <span className="lim-ai-badge">IA</span>
                  <span className="lim-ai-header-title">Análisis y recomendaciones · <span className="lim-ai-header-ts">Actualizado hace 2 min</span></span>
                  <button className="lim-btn-ghost lim-ai-regen" type="button">↺ Regenerar</button>
                </div>
                <div className="lim-ai-cards">
                  <div className="lim-ai-card lim-ai-card--green">
                    <span className="lim-ai-tag lim-ai-tag--green">Oportunidad</span>
                    <div className="lim-ai-card-title">Optimizar Money Market</div>
                    <div className="lim-ai-card-body">Con $2.18M disponibles, redirigir $680K del Repo Overnight al Money Market AAA (30 días, 5.1% TNA) genera <strong>$3,468 adicionales</strong> en el período frente a la tasa actual.</div>
                    <button className="lim-ai-action" type="button">Aplicar →</button>
                  </div>
                  <div className="lim-ai-card lim-ai-card--yellow">
                    <span className="lim-ai-tag lim-ai-tag--yellow">Alerta</span>
                    <div className="lim-ai-card-title">Vencimiento en 24 h</div>
                    <div className="lim-ai-card-body">El <strong>Repo Overnight $190K</strong> vence el 09 May 2026. Se recomienda renovar o redirigir al Fondo Liquidez Plus para mantener liquidez operativa sin corte de cobertura.</div>
                    <button className="lim-ai-action" type="button">Revisar →</button>
                  </div>
                  <div className="lim-ai-card lim-ai-card--blue">
                    <span className="lim-ai-tag lim-ai-tag--blue">Estrategia</span>
                    <div className="lim-ai-card-title">Línea Revolving sin utilizar</div>
                    <div className="lim-ai-card-body">La línea de crédito Pichincha ($2M, 8.5%) tiene margen completo disponible. Mantenerla sin utilizar mejora el índice de cobertura. Activar solo si <strong>DSO supera 45 días</strong> o el saldo EOM cae bajo $1.2M.</div>
                    <button className="lim-ai-action" type="button">Configurar alerta →</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ DASHBOARD TAB ══════════════ */}
          {activeTab === "dashboard" && (
            <div className="lim-dashboard">
              <div className="lim-dash-head">
                <h2>Vista general de métricas clave</h2>
                <div className="lim-dash-actions">
                  <button className="lim-btn-ghost" type="button">Biblioteca</button>
                  <button className="lim-btn-ghost" type="button">+ Agregar</button>
                  <button className="lim-btn-ghost" type="button">··· Opciones</button>
                </div>
              </div>

              <div className="lim-dash-kpis">
                <article className="lim-dash-kpi">
                  <div className="lim-dash-kpi-title">Comisiones bancarias</div>
                  <div className="lim-dash-kpi-range">1 Ene → 31 Dic · Umbral $3,500</div>
                  <div className="lim-dash-kpi-val">$4,753 <span className="lim-dash-kpi-flag">↑</span></div>
                  <div className="lim-dash-kpi-note">+$1,253 sobre el umbral</div>
                </article>

                <article className="lim-dash-kpi">
                  <div className="lim-dash-kpi-title">A/R vencidas</div>
                  <div className="lim-dash-kpi-range">1 Ene → 31 Dic · Meta &lt; $350,000</div>
                  <div className="lim-dash-kpi-val">$349,253</div>
                  <div className="lim-dash-kpi-note">A/R — Cuentas por cobrar</div>
                </article>

                <article className="lim-dash-kpi">
                  <div className="lim-dash-kpi-title">Saldo EOM de caja</div>
                  <div className="lim-dash-kpi-range">1 Ene → 31 Dic · Meta &gt; $1,200,000</div>
                  <div className="lim-dash-kpi-val">{fmt(totals.balance)}</div>
                  <div className="lim-dash-kpi-note">EOM — End of Month</div>
                </article>

                <article className="lim-dash-kpi">
                  <div className="lim-dash-kpi-title">DSO promedio</div>
                  <div className="lim-dash-kpi-range">1 Ene → 31 Dic · Meta &lt; 45 días</div>
                  <div className="lim-dash-kpi-val">38 días</div>
                  <div className="lim-dash-kpi-note">DSO — Days Sales Outstanding</div>
                </article>
              </div>

              <div className="lim-dash-charts">
                <article className="lim-dash-chart">
                  <h3>Real vs. Forecast</h3>
                  <p className="lim-chart-range">1 Ene → 30 Jun</p>
                  <BarChart2 />
                </article>
                <article className="lim-dash-chart">
                  <h3>Evolución de cobros</h3>
                  <p className="lim-chart-range">1 Ene → 31 Dic</p>
                  <AreaChart />
                </article>
                <article className="lim-dash-chart">
                  <h3>Distribución de salidas (anual)</h3>
                  <p className="lim-chart-range">1 Ene → 31 Dic</p>
                  <DonutChart />
                </article>
                <article className="lim-dash-chart">
                  <h3>Salidas por mes</h3>
                  <p className="lim-chart-range">1 Ene → 31 Dic</p>
                  <StackedBarChart />
                </article>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
