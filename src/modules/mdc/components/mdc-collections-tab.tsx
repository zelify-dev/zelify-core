"use client";

import { NotebookPen } from "lucide-react";
import { useMemo, useState } from "react";
import type { MdcApplicantMode } from "@/modules/mdc/data/mdc-credit-mock";

export type CollectionCase = {
  caseId: string;
  applicationNo: string;
  customerName: string;
  email: string;
  phone: string;
  identification: string;
  birthDate: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  amountDue: number;
  dpd: number;
  status: "active" | "escalated";
  assignedAgent: string;
  lastActivity: string;
  createdAt: string;
};

export const NATURAL_CASES: CollectionCase[] = [
  {
    caseId: "case-001",
    applicationNo: "APP-001272",
    customerName: "Gabriela Torres Lopez",
    email: "gabriela.torres@gmail.com",
    phone: "+52 55 1200 1272",
    identification: "INE GATL950606MDF",
    birthDate: "06/06/1995",
    address: "Av. Vallarta 2040",
    city: "Zapopan",
    state: "Jalisco",
    zipCode: "45000",
    amountDue: 3158,
    dpd: 8,
    status: "active",
    assignedAgent: "AGT-001",
    lastActivity: "07/05/2026",
    createdAt: "05/05/2026",
  },
  {
    caseId: "case-002",
    applicationNo: "APP-001265",
    customerName: "Miguel Hernandez Paz",
    email: "miguel.hernandez@gmail.com",
    phone: "+52 55 1200 1265",
    identification: "INE MIHP930404HDF",
    birthDate: "04/04/1993",
    address: "Av. Universidad 900",
    city: "Puebla",
    state: "Puebla",
    zipCode: "72000",
    amountDue: 3508,
    dpd: 14,
    status: "escalated",
    assignedAgent: "AGT-002",
    lastActivity: "07/05/2026",
    createdAt: "06/05/2026",
  },
];

export const MORAL_CASES: CollectionCase[] = [
  {
    caseId: "pm-case-001",
    applicationNo: "APP-PM-100281",
    customerName: "Comercializadora Bajio Norte SA de CV",
    email: "direccion.financiera@bajionorte.mx",
    phone: "+52 442 900 1281",
    identification: "RFC CBN140501KJ3",
    birthDate: "15/04/2014",
    address: "Parque Industrial Bajio 220",
    city: "Queretaro",
    state: "Queretaro",
    zipCode: "76120",
    amountDue: 125000,
    dpd: 11,
    status: "active",
    assignedAgent: "AGT-PM-001",
    lastActivity: "07/05/2026",
    createdAt: "05/05/2026",
  },
  {
    caseId: "pm-case-002",
    applicationNo: "APP-PM-100276",
    customerName: "Distribuidora Electrica Metropoli SA de CV",
    email: "tesoreria@demetropoli.mx",
    phone: "+52 55 8800 1276",
    identification: "RFC DEM170903PZ8",
    birthDate: "03/09/2017",
    address: "Av. Ceylan 1440",
    city: "Azcapotzalco",
    state: "CDMX",
    zipCode: "02300",
    amountDue: 196000,
    dpd: 19,
    status: "escalated",
    assignedAgent: "AGT-PM-002",
    lastActivity: "07/05/2026",
    createdAt: "06/05/2026",
  },
  {
    caseId: "pm-case-003",
    applicationNo: "APP-PM-100279",
    customerName: "Agroinsumos del Pacifico SA de CV",
    email: "tesoreria@agropacifico.mx",
    phone: "+52 667 400 1279",
    identification: "RFC APA150712TR6",
    birthDate: "12/07/2015",
    address: "Carretera Culiacan Navolato 5400",
    city: "Culiacan",
    state: "Sinaloa",
    zipCode: "80370",
    amountDue: 148000,
    dpd: 7,
    status: "active",
    assignedAgent: "AGT-PM-003",
    lastActivity: "08/05/2026",
    createdAt: "05/05/2026",
  },
];

export const CASES = NATURAL_CASES;

const PAGE_SIZE = 10;

export function MdcCollectionsTab({
  mode = "natural",
  cases = mode === "moral" ? MORAL_CASES : NATURAL_CASES,
}: {
  mode?: MdcApplicantMode;
  cases?: CollectionCase[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<CollectionCase | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savedNotes, setSavedNotes] = useState<Record<string, string[]>>({});

  const filteredCases = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((item) =>
      [item.caseId, item.applicationNo, item.customerName, item.assignedAgent, item.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [cases, query]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const pagedCases = filteredCases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalMontoVencido = filteredCases.reduce((acc, item) => acc + item.amountDue, 0);
  const casosEscalados = filteredCases.filter((item) => item.status === "escalated").length;
  const dpdPromedio = filteredCases.length
    ? Math.round(filteredCases.reduce((acc, item) => acc + item.dpd, 0) / filteredCases.length)
    : 0;

  return (
    <section className="mdc-section">
      <article className="mdc-card">
        <h3>Cobranza</h3>
      </article>

      <article className="mdc-card">
        <h3>Resumen de cobranza</h3>
        <p>{mode === "moral" ? "Indicadores clave para priorizar recuperacion corporativa y seguimiento empresarial." : "Indicadores clave para priorizar la gestion diaria."}</p>
        <div className="mdc-col-kpis">
          <KpiCard title="Casos activos" value={String(filteredCases.length)} />
          <KpiCard title="Monto vencido total" value={`$${formatMoney(totalMontoVencido)} MXN`} />
          <KpiCard title="DPD promedio" value={`${dpdPromedio} dias`} />
          <KpiCard title="Casos escalados" value={String(casosEscalados)} />
        </div>
      </article>

        <article className="mdc-card">
          <h3>Casos de cobranza</h3>
        <p>{mode === "moral" ? "Casos activos de seguimiento a empresas y razones sociales." : "Casos de cobranza activos."}</p>

        <div className="mdc-col-search-wrap">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por caso, solicitud, cliente, agente o estado..."
            className="mdc-col-search"
          />
        </div>

        <div className="mdc-table-wrap">
          <table className="mdc-table mdc-col-table">
            <thead>
              <tr>
                <th>ID de caso</th>
                <th>No. aplicacion</th>
                <th>Cliente</th>
                <th>Monto vencido</th>
                <th>DPD</th>
                <th>Estado</th>
                <th>Agente asignado</th>
                <th>Ultima actividad</th>
                <th>Creado el</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedCases.map((item) => (
                <tr
                  key={item.caseId}
                  className="mdc-col-row"
                  onClick={() => {
                    setSelectedCase(item);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <td>{item.caseId}</td>
                  <td>{item.applicationNo}</td>
                  <td>{item.customerName}</td>
                  <td>${formatMoney(item.amountDue)}</td>
                  <td><DpdBadge dpd={item.dpd} /></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>{item.assignedAgent}</td>
                  <td>{item.lastActivity}</td>
                  <td>{item.createdAt}</td>
                  <td>
                    <button
                      type="button"
                      className="mdc-col-note-btn"
                      aria-label={`Agregar nota a ${item.caseId}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsDetailModalOpen(false);
                        setSelectedCase(item);
                        setIsNoteModalOpen(true);
                        setNoteDraft("");
                      }}
                    >
                      <NotebookPen className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mdc-col-pager">
          <span>Mostrando {pagedCases.length} de {filteredCases.length} resultados</span>
          <div>
            <span>Tamano pagina: {PAGE_SIZE}</span>
            <button type="button" className="mdc-btn mdc-btn--ghost" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button>
            <span>Pagina {page} de {totalPages}</span>
            <button type="button" className="mdc-btn mdc-btn--ghost" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente</button>
          </div>
        </div>
      </article>

      {selectedCase && isDetailModalOpen ? (
        <div className="mdc-modal-backdrop">
          <div className="mdc-modal mdc-col-modal">
            <div className="mdc-modal-head">
              <div>
                <p>Detalle del caso</p>
                <h3>{selectedCase.caseId} · {selectedCase.customerName}</h3>
              </div>
              <button
                type="button"
                className="mdc-btn mdc-btn--ghost"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedCase(null);
                }}
              >
                Cerrar
              </button>
            </div>

            <div className="mdc-col-grid">
              <DetailItem label="No. aplicacion" value={selectedCase.applicationNo} />
              <DetailItem label="Cliente" value={selectedCase.customerName} />
              <DetailItem label="Monto vencido" value={`$${formatMoney(selectedCase.amountDue)} MXN`} />
              <DetailItem label="DPD" value={`${selectedCase.dpd} dias`} />
              <DetailItem label="Estado" value={selectedCase.status === "active" ? "activo" : "escalado"} />
              <DetailItem label="Agente asignado" value={selectedCase.assignedAgent} />
              <DetailItem label="Ultima actividad" value={selectedCase.lastActivity} />
              <DetailItem label="Creado el" value={selectedCase.createdAt} />
            </div>

            <div className="mdc-col-box">
              <p>{mode === "moral" ? "Informacion corporativa" : "Informacion personal"}</p>
              <div className="mdc-col-grid">
                <DetailItem label="Nombre completo" value={selectedCase.customerName} />
                <DetailItem label="Correo" value={selectedCase.email} />
                <DetailItem label="Telefono" value={selectedCase.phone} />
                <DetailItem label="Identificacion" value={selectedCase.identification} />
                <DetailItem label="Nacimiento" value={selectedCase.birthDate} />
                <DetailItem label="Direccion" value={selectedCase.address} />
                <DetailItem label="Ciudad" value={selectedCase.city} />
                <DetailItem label="Estado" value={selectedCase.state} />
                <DetailItem label="Codigo postal" value={selectedCase.zipCode} />
              </div>
            </div>

            <div className="mdc-col-box">
              <div className="mdc-col-box__head">
                <p>Notas guardadas</p>
                <button
                  type="button"
                  className="mdc-btn mdc-btn--ghost"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsNoteModalOpen(true);
                    setNoteDraft("");
                  }}
                >
                  Agregar nota
                </button>
              </div>
              {savedNotes[selectedCase.caseId]?.length ? (
                <ul>
                  {savedNotes[selectedCase.caseId].map((note, idx) => (
                    <li key={`${selectedCase.caseId}-detail-note-${idx}`}>• {note}</li>
                  ))}
                </ul>
              ) : (
                <p>Sin notas registradas.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedCase && isNoteModalOpen ? (
        <div className="mdc-modal-backdrop">
          <div className="mdc-modal mdc-col-note-modal">
            <div className="mdc-modal-head">
              <div>
                <p>Agregar nota</p>
                <h3>{selectedCase.caseId} · {selectedCase.customerName}</h3>
              </div>
              <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => { setIsNoteModalOpen(false); setIsDetailModalOpen(true); }}>
                Cerrar
              </button>
            </div>

            <div className="mdc-col-note-form">
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Escribe una nota de seguimiento..."
              />
              <div>
                <button
                  type="button"
                  className="mdc-btn mdc-btn--primary"
                  disabled={!noteDraft.trim()}
                  onClick={() => {
                    const text = noteDraft.trim();
                    if (!text) return;
                    setSavedNotes((prev) => ({
                      ...prev,
                      [selectedCase.caseId]: [...(prev[selectedCase.caseId] ?? []), text],
                    }));
                    setNoteDraft("");
                    setIsNoteModalOpen(false);
                    setIsDetailModalOpen(true);
                  }}
                >
                  Guardar nota
                </button>
              </div>
            </div>

            {savedNotes[selectedCase.caseId]?.length ? (
              <div className="mdc-col-box">
                <p>Notas guardadas</p>
                <ul>
                  {savedNotes[selectedCase.caseId].map((note, idx) => (
                    <li key={`${selectedCase.caseId}-note-${idx}`}>• {note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="mdc-col-detail-item">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function DpdBadge({ dpd }: { dpd: number }) {
  let styles = "mdc-col-pill mdc-col-pill--ok";
  if (dpd >= 14) styles = "mdc-col-pill mdc-col-pill--warn";
  if (dpd >= 31) styles = "mdc-col-pill mdc-col-pill--bad";
  return <span className={styles}>{dpd} dias</span>;
}

function StatusBadge({ status }: { status: CollectionCase["status"] }) {
  const styles: Record<CollectionCase["status"], string> = {
    active: "mdc-col-pill mdc-col-pill--info",
    escalated: "mdc-col-pill mdc-col-pill--bad",
  };
  const labels: Record<CollectionCase["status"], string> = {
    active: "activo",
    escalated: "escalado",
  };
  return <span className={styles[status]}>{labels[status]}</span>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="mdc-col-kpi-card">
      <p>{title}</p>
      <strong>{value}</strong>
    </div>
  );
}
