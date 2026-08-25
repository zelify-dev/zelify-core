"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, File as FileIcon, Loader2, UploadCloud, X } from "lucide-react";
import {
  fetchFinanceRequestById,
  fetchFinancialDocumentExtraction,
  fetchFinancialDocumentProgress,
  processFinancialDocumentAnalysis,
  uploadOneFinancialDocument,
  type FinancialDocumentExtractionResponse,
  type FinancialDocumentProgress,
  type FinancialDocumentProgressDocument,
} from "@/modules/mdc/services/mdc-finance-requests.service";

interface FinancialDocumentUploaderProps {
  userId?: string | null;
  financeRequestId?: string | null;
  onClose: () => void;
}

type AlertState = { message: string; type: "error" | "success" | "info" } | null;

type NominaSlot = {
  index: number;
  label: string;
  document?: FinancialDocumentProgressDocument;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FinanceRequestLookup = {
  user?: {
    id?: string;
  };
  data?: {
    user?: {
      id?: string;
    };
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isUuid(value?: string | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

function extractUserIdFromFinanceRequest(payload: FinanceRequestLookup): string | null {
  const direct = payload?.user?.id;
  const nested = payload?.data?.user?.id;
  if (isUuid(direct)) return direct;
  if (isUuid(nested)) return nested;
  return null;
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "COMPLETED":
      return "Completado";
    case "PROCESSING":
      return "Procesando";
    case "MANUAL_REVIEW_REQUIRED":
      return "Revisión manual";
    case "FAILED":
      return "Fallido";
    case "REJECTED":
      return "Rechazado";
    default:
      return "Pendiente";
  }
}

function statusClassName(status?: string | null) {
  switch (status) {
    case "COMPLETED":
      return "bg-[#75fa4c]/10 text-slate-700";
    case "PROCESSING":
      return "bg-slate-200/80 text-slate-600";
    case "MANUAL_REVIEW_REQUIRED":
      return "bg-slate-200/80 text-slate-600";
    case "FAILED":
    case "REJECTED":
      return "bg-red-50/70 text-red-600";
    default:
      return "bg-slate-200/80 text-slate-500";
  }
}

function ExtractionViewer({
  open,
  title,
  data,
  loading,
  onClose,
}: {
  open: boolean;
  title: string;
  data: FinancialDocumentExtractionResponse | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-[620px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
            <p className="text-xs font-medium text-slate-500">Extracción normalizada devuelta por backend</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 size={16} className="animate-spin" />
              <span>Cargando extracción...</span>
            </div>
          ) : data?.processed === false ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              El análisis todavía no ha sido procesado.
            </div>
          ) : (
            <pre className="text-xs leading-5 text-slate-700 bg-slate-50 border border-slate-100 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export function FinancialDocumentUploader({ userId, financeRequestId, onClose }: FinancialDocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(isUuid(userId) ? userId : null);
  const [progress, setProgress] = useState<FinancialDocumentProgress | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [uploadingSlotIndex, setUploadingSlotIndex] = useState<number | null>(null);
  const [processingAnalysisId, setProcessingAnalysisId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [extractionOpen, setExtractionOpen] = useState(false);
  const [extractionTitle, setExtractionTitle] = useState("");
  const [extractionData, setExtractionData] = useState<FinancialDocumentExtractionResponse | null>(null);
  const [extractionLoading, setExtractionLoading] = useState(false);

  const refreshProgress = async (resolvedId: string, initial = false) => {
    if (initial) {
      setIsBootstrapping(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const nextProgress = await fetchFinancialDocumentProgress(resolvedId, "nomina");
      setProgress(nextProgress);
    } finally {
      if (initial) {
        setIsBootstrapping(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setAlert(null);
      try {
        let nextUserId: string | null = isUuid(userId) ? userId : null;

        if (!nextUserId && financeRequestId) {
          const detail = await fetchFinanceRequestById(financeRequestId);
          nextUserId = extractUserIdFromFinanceRequest(detail);
        }

        if (!nextUserId) {
          throw new Error("No fue posible resolver el userId real del solicitante para cargar documentos.");
        }

        if (cancelled) return;
        setResolvedUserId(nextUserId);
        await refreshProgress(nextUserId, true);
      } catch (err: unknown) {
        if (cancelled) return;
        setIsBootstrapping(false);
        setAlert({
          message: getErrorMessage(err, "No fue posible cargar el progreso documental."),
          type: "error",
        });
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [financeRequestId, userId]);

  const nominaSlots = useMemo<NominaSlot[]>(() => {
    const required = Math.max(progress?.required ?? 5, 0);
    const docs = progress?.documents ?? [];
    return Array.from({ length: required }, (_, index) => ({
      index,
      label: `Nómina ${index + 1}`,
      document: docs[index],
    }));
  }, [progress]);

  const pendingNominaCount = progress?.pendingUpload ?? Math.max((progress?.required ?? 0) - (progress?.uploaded ?? 0), 0);
  const nominaSubtext = progress
    ? `${progress.completed} completado${progress.completed === 1 ? "" : "s"} · ${progress.processing} procesando · ${pendingNominaCount} pendiente${pendingNominaCount === 1 ? "" : "s"}`
    : "Cargando progreso real...";

  const openFilePickerForSlot = (slotIndex: number) => {
    setAlert(null);
    setSelectedSlotIndex(slotIndex);
    fileInputRef.current?.click();
  };

  const handleUploadFile = async (file: File | null, slotIndex: number | null) => {
    if (!file || slotIndex === null || !resolvedUserId) return;

    if (file.type !== "application/pdf") {
      setAlert({ message: "El archivo debe estar en formato PDF.", type: "error" });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setAlert({ message: `El archivo "${file.name}" supera el límite de 3 MB.`, type: "error" });
      return;
    }

    try {
      setUploadingSlotIndex(slotIndex);
      setAlert(null);
      const response = await uploadOneFinancialDocument(resolvedUserId, "nomina", file);
      await refreshProgress(resolvedUserId);
      setAlert({
        message:
          response.status === "PROCESSING"
            ? "Documento subido y enviado a análisis"
            : "Documento subido correctamente",
        type: "success",
      });
    } catch (err: unknown) {
      setAlert({
        message: getErrorMessage(err, "Ocurrió un error al subir el documento."),
        type: "error",
      });
    } finally {
      setUploadingSlotIndex(null);
      setSelectedSlotIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleProcessAnalysis = async (analysisId: string) => {
    if (!resolvedUserId) return;
    try {
      setProcessingAnalysisId(analysisId);
      setAlert(null);
      const response = await processFinancialDocumentAnalysis(analysisId);
      if (response.status === "PROCESSING") {
        setAlert({
          message: "BDA aún está procesando, intenta nuevamente en unos segundos",
          type: "info",
        });
        await refreshProgress(resolvedUserId);
        return;
      }
      await refreshProgress(resolvedUserId);
      setAlert({
        message: `Estado actualizado: ${statusLabel(response.status)}`,
        type: "success",
      });
    } catch (err: unknown) {
      setAlert({
        message: getErrorMessage(err, "No fue posible actualizar el análisis."),
        type: "error",
      });
    } finally {
      setProcessingAnalysisId(null);
    }
  };

  const handleViewExtraction = async (analysisId: string, label: string) => {
    try {
      setExtractionOpen(true);
      setExtractionTitle(`Extracción de ${label}`);
      setExtractionLoading(true);
      setExtractionData(null);
      const data = await fetchFinancialDocumentExtraction(analysisId);
      setExtractionData(data);
    } catch (err: unknown) {
      setExtractionData({ processed: false, message: getErrorMessage(err, "No fue posible cargar la extracción.") });
    } finally {
      setExtractionLoading(false);
    }
  };

  const renderAlert = () => {
    if (!alert) return null;
    const shared = "mb-5 p-3.5 rounded-lg flex items-start gap-3 text-sm";
    if (alert.type === "error") {
      return (
        <div className={`${shared} bg-red-50 border border-red-100 text-red-700`}>
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="font-medium">{alert.message}</p>
        </div>
      );
    }
    if (alert.type === "info") {
      return (
        <div className={`${shared} bg-amber-50 border border-amber-100 text-amber-800`}>
          <Loader2 size={18} className="mt-0.5 shrink-0" />
          <p className="font-medium">{alert.message}</p>
        </div>
      );
    }
    return (
      <div className={`${shared} bg-green-50 border border-green-100 text-green-700`}>
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        <p className="font-medium">{alert.message}</p>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={onClose}>
        <div
          className="relative w-full max-w-[560px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div className="pr-4">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Motor MDC
              </span>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Carga de Documentos
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Flujo documental progresivo para validación de decisión
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[78vh] overflow-y-auto px-6 pb-6">
            {renderAlert()}

            {isBootstrapping ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                <span>Cargando progreso documental real...</span>
              </div>
            ) : (
              <>
                <section className="mb-5 rounded-[24px] border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
                        Categoría activa
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        Comprobantes de Nómina
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">{nominaSubtext}</p>
                    </div>
                    <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-center text-xs leading-4 font-semibold text-slate-700">
                      {progress?.uploaded ?? 0} / {progress?.required ?? 5} archivos
                    </span>
                  </div>

                  <div className="space-y-2">
                    {nominaSlots.map((slot) => {
                      const doc = slot.document;
                      const status = doc?.status ?? null;
                      const canUpload = !doc;
                      const canProcess = status === "PROCESSING" && Boolean(doc?.analysisId);
                      const canViewExtraction =
                        Boolean(doc?.analysisId) &&
                        ["COMPLETED", "MANUAL_REVIEW_REQUIRED", "FAILED", "REJECTED"].includes(status || "");

                      return (
                        <article
                          key={slot.label}
                          className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3 transition hover:bg-slate-200/60"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="mb-0.5 flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-800">{slot.label}</h4>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClassName(status)}`}>
                                {status === "COMPLETED" ? "Completado" : status === "PROCESSING" ? "Procesando" : statusLabel(status)}
                              </span>
                            </div>
                            {doc ? (
                              <div className="space-y-0.5">
                                <p className="flex items-center gap-2 text-[11px] font-medium text-slate-500 min-w-0">
                                  <FileIcon size={13} className="shrink-0 text-slate-400" />
                                  <span className="truncate">{doc.fileName || "Archivo sin nombre"}</span>
                                </p>
                                {doc.analysisId ? (
                                  <p className="text-[11px] text-slate-400 truncate">analysisId: {doc.analysisId}</p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="text-[11px] font-medium text-slate-400">Pendiente de carga</p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {canViewExtraction ? (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                onClick={() => handleViewExtraction(doc?.analysisId as string, slot.label)}
                              >
                                <Eye size={13} />
                                Ver
                              </button>
                            ) : null}

                            {canProcess ? (
                              <button
                                type="button"
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                onClick={() => handleProcessAnalysis(doc?.analysisId as string)}
                                disabled={processingAnalysisId === doc?.analysisId}
                              >
                                {processingAnalysisId === doc?.analysisId ? "Actualizando" : "Actualizar"}
                              </button>
                            ) : null}

                            {canUpload ? (
                              <button
                                type="button"
                                className="appearance-none border-0 shadow-none outline-none ring-0 flex items-center gap-1.5 rounded-xl bg-[#000016] px-4 py-2 text-xs font-semibold text-white transition hover:bg-black active:scale-95 disabled:opacity-60"
                                onClick={() => openFilePickerForSlot(slot.index)}
                                disabled={uploadingSlotIndex !== null || !resolvedUserId}
                              >
                                {uploadingSlotIndex === slot.index ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <UploadCloud size={14} />
                                )}
                                Subir PDF
                              </button>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-60"
                      onClick={() => resolvedUserId && refreshProgress(resolvedUserId)}
                      disabled={!resolvedUserId || isRefreshing}
                    >
                      {isRefreshing ? "Actualizando progreso..." : "Actualizar progreso"}
                    </button>
                  </div>
                </section>

                <div className="space-y-3">
                  <section className="rounded-[24px] border border-slate-100 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
                          Siguiente categoría
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">Extractos Bancarios</h3>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">Pendiente de configuración. El blueprint real todavía no está habilitado en este modal.</p>
                      </div>
                      <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-center text-xs leading-4 font-semibold text-slate-700">
                        0 / 3 archivos
                      </span>
                    </div>
                    <div className="rounded-2xl bg-slate-100/70 px-4 py-4 text-center text-slate-400">
                      <UploadCloud className="mx-auto mb-2 h-6 w-6" />
                      <p className="text-[11px] font-semibold text-slate-600">Categoría visible, aún sin flujo activo</p>
                      <p className="mt-1 text-[11px] font-medium">Se mostrará como pendiente hasta que el backend y blueprint estén listos.</p>
                    </div>
                  </section>

                  <section className="rounded-[24px] border border-slate-100 bg-white p-4">
                    <div className="mb-3">
                      <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
                        Placeholder
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">Comprobante de Domicilio / Servicio Básico</h3>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">No se implementa todavía en este modal.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100/70 px-4 py-4 text-center text-slate-400">
                      <p className="text-[11px] font-semibold text-slate-600">Próxima categoría</p>
                      <p className="mt-1 text-[11px] font-medium">Se activará cuando se defina el flujo documental correspondiente.</p>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={(e) => handleUploadFile(e.target.files?.[0] ?? null, selectedSlotIndex)}
      />

      <ExtractionViewer
        open={extractionOpen}
        title={extractionTitle}
        data={extractionData}
        loading={extractionLoading}
        onClose={() => setExtractionOpen(false)}
      />
    </>
  );
}
