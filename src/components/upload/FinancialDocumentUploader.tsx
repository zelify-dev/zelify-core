"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, File as FileIcon, Loader2, MoreHorizontal, UploadCloud, X } from "lucide-react";
import {
  fetchFinanceRequestById,
  processFinancialDocumentAnalysis,
  type FinancialDocumentProgress,
  type FinancialDocumentProgressDocument,
  type MdcApiError,
} from "@/modules/mdc/services/mdc-finance-requests.service";
import { useDeleteDocument, useDocumentProgress, useReplaceDocument, useUploadOneDocument } from "@/modules/mdc/hooks/use-financial-documents";

interface FinancialDocumentUploaderProps {
  userId?: string | null;
  financeRequestId?: string | null;
  onClose: () => void;
}

type AlertState = { message: string; type: "error" | "success" | "info"; step?: string; detail?: string } | null;
type DocumentCategory = "nomina" | "extracto";
type UploadTarget = { category: DocumentCategory; slotIndex: number; mode: "upload" | "replace"; documentId?: string };
type DeleteTarget = { category: DocumentCategory; documentId: string; label: string } | null;

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

function getDocumentError(error: unknown, fallback: string) {
  const typed = error && typeof error === "object" ? error as Partial<MdcApiError> : null;
  return {
    message: typed?.message || fallback,
    step: typed?.step,
    detail: typed?.detail,
  };
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

function statusLabel(status?: string | null, manualDecision?: string | null) {
  if (manualDecision === "APPROVED") return "Aprobado manualmente";
  if (manualDecision === "REJECTED") return "Rechazado manualmente";
  switch (status) {
    case "COMPLETED":
      return "Completado";
    case "PROCESSING":
      return "Listo para procesar";
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

function statusClassName(status?: string | null, manualDecision?: string | null) {
  if (manualDecision === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (manualDecision === "REJECTED") return "bg-red-50/70 text-red-600";
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

function categoryStatus(progress: FinancialDocumentProgress | null) {
  if (!progress) return "Pendiente";
  if (progress.failed > 0) return "Con errores";
  if (progress.manualReview > 0) return "Revisión manual";
  if (progress.uploaded === 0) return "Pendiente";
  if (progress.processingComplete) return "Completado";
  if (progress.uploadComplete) return "En proceso";
  return "Incompleto";
}

function categoryStatusClassName(progress: FinancialDocumentProgress | null) {
  const status = categoryStatus(progress);
  if (status === "Con errores") return "bg-red-50 text-red-600";
  if (status === "Revisión manual") return "bg-amber-50 text-amber-700";
  if (status === "Completado") return "bg-emerald-50 text-emerald-700";
  if (status === "En proceso") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

export function FinancialDocumentUploader({ userId, financeRequestId, onClose }: FinancialDocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(isUuid(userId) ? userId : null);
  const [isResolvingUser, setIsResolvingUser] = useState(!isUuid(userId));
  const [selectedUploadTarget, setSelectedUploadTarget] = useState<UploadTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [openDocumentMenuId, setOpenDocumentMenuId] = useState<string | null>(null);
  const [processingAnalysisId, setProcessingAnalysisId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const nominaProgressQuery = useDocumentProgress(resolvedUserId, "nomina", true);
  const extractoProgressQuery = useDocumentProgress(resolvedUserId, "extracto", true);
  const uploadMutation = useUploadOneDocument(resolvedUserId);
  const replaceMutation = useReplaceDocument(resolvedUserId);
  const deleteMutation = useDeleteDocument(resolvedUserId);
  const nominaProgress = nominaProgressQuery.data || null;
  const extractoProgress = extractoProgressQuery.data || null;
  const isBootstrapping = isResolvingUser || nominaProgressQuery.isLoading || extractoProgressQuery.isLoading;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setAlert(null);
      setIsResolvingUser(true);
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
      } catch (err: unknown) {
        if (cancelled) return;
        setAlert({
          message: getErrorMessage(err, "No fue posible cargar el progreso documental."),
          type: "error",
        });
      } finally {
        if (!cancelled) setIsResolvingUser(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [financeRequestId, userId]);

  const nominaSlots = useMemo<NominaSlot[]>(() => {
    const required = Math.max(nominaProgress?.required ?? 5, 0);
    const docs = nominaProgress?.documents ?? [];
    return Array.from({ length: required }, (_, index) => ({
      index,
      label: `Nómina ${index + 1}`,
      document: docs[index],
    }));
  }, [nominaProgress]);

  const pendingNominaCount = nominaProgress?.pendingUpload ?? Math.max((nominaProgress?.required ?? 0) - (nominaProgress?.uploaded ?? 0), 0);
  const nominaSubtext = nominaProgress
    ? `${nominaProgress.completed} completado${nominaProgress.completed === 1 ? "" : "s"} · ${nominaProgress.processing} procesando · ${pendingNominaCount} pendiente${pendingNominaCount === 1 ? "" : "s"}`
    : "Cargando progreso real...";

  const extractoDocument = extractoProgress?.documents?.[0];
  const extractoSubtext = extractoProgress
    ? `${extractoProgress.completed} completado${extractoProgress.completed === 1 ? "" : "s"} · ${extractoProgress.processing} procesando · ${extractoProgress.pendingUpload} pendiente${extractoProgress.pendingUpload === 1 ? "" : "s"}`
    : "Cargando progreso real...";

  const openFilePickerForSlot = (category: DocumentCategory, slotIndex: number) => {
    setAlert(null);
    setSelectedUploadTarget({ category, slotIndex, mode: "upload" });
    fileInputRef.current?.click();
  };

  const openFilePickerForReplacement = (category: DocumentCategory, slotIndex: number, documentId: string) => {
    setAlert(null);
    setOpenDocumentMenuId(null);
    setSelectedUploadTarget({ category, slotIndex, mode: "replace", documentId });
    fileInputRef.current?.click();
  };

  const handleUploadFile = async (file: File | null, target: UploadTarget | null) => {
    if (!file || !target || !resolvedUserId) return;

    if (file.type !== "application/pdf") {
      setAlert({ message: "El archivo debe estar en formato PDF.", type: "error" });
      setSelectedUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setAlert({ message: `El archivo "${file.name}" supera el límite de 3 MB.`, type: "error" });
      setSelectedUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setAlert(null);
      if (target.mode === "replace" && target.documentId) {
        await replaceMutation.mutateAsync({ category: target.category, documentId: target.documentId, file });
        setAlert({ message: "Documento reemplazado y enviado a un nuevo análisis.", type: "success" });
        return;
      }

      const response = await uploadMutation.mutateAsync({ category: target.category, file });
      setAlert({
        message:
          response.status === "PROCESSING"
            ? "Documento subido y enviado a análisis"
            : "Documento subido correctamente",
        type: "success",
      });
    } catch (err: unknown) {
      const parsed = getDocumentError(err, "Ocurrió un error al subir el documento.");
      setAlert({
        ...parsed,
        type: "error",
      });
    } finally {
      setSelectedUploadTarget(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteTarget) return;
    try {
      setAlert(null);
      setOpenDocumentMenuId(null);
      await deleteMutation.mutateAsync({ category: deleteTarget.category, documentId: deleteTarget.documentId });
      setDeleteTarget(null);
      setAlert({ message: `Documento ${deleteTarget.label} eliminado correctamente.`, type: "success" });
    } catch (err: unknown) {
      const parsed = getDocumentError(err, "No fue posible eliminar el documento.");
      setAlert({ ...parsed, type: "error" });
    }
  };

  const handleProcessAnalysis = async (analysisId: string, category: DocumentCategory) => {
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
        await (category === "nomina" ? nominaProgressQuery.refetch() : extractoProgressQuery.refetch());
        return;
      }
      await (category === "nomina" ? nominaProgressQuery.refetch() : extractoProgressQuery.refetch());
      setAlert({
        message: `Estado actualizado: ${statusLabel(response.status)}`,
        type: "success",
      });
    } catch (err: unknown) {
      const parsed = getDocumentError(err, "No fue posible procesar el análisis.");
      setAlert({
        ...parsed,
        type: "error",
      });
    } finally {
      setProcessingAnalysisId(null);
    }
  };

  const renderAlert = () => {
    if (!alert) return null;
    const shared = "mb-5 p-3.5 rounded-lg flex items-start gap-3 text-sm";
    if (alert.type === "error") {
      return (
        <div className={`${shared} bg-red-50 border border-red-100 text-red-700`}>
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">{alert.message}</p>
            {alert.step || alert.detail ? (
              <details className="mt-1.5 text-xs text-red-600">
                <summary className="cursor-pointer font-semibold">Detalle técnico</summary>
                {alert.step ? <p className="mt-1">Paso: {alert.step}</p> : null}
                {alert.detail ? <p className="mt-1 break-words">{alert.detail}</p> : null}
              </details>
            ) : null}
          </div>
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
          className="relative w-full max-w-[720px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl"
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

          <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
            {renderAlert()}

            {isBootstrapping ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                <span>Cargando progreso documental real...</span>
              </div>
            ) : (
              <>
                <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
                        Categoría activa
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">Comprobantes de Nómina</h3>
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${categoryStatusClassName(nominaProgress)}`}>
                          {categoryStatus(nominaProgress)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">{nominaSubtext}</p>
                    </div>
                    <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-center text-xs leading-4 font-semibold text-slate-700">
                      {nominaProgress?.uploaded ?? 0} / {nominaProgress?.required ?? 5} archivos
                    </span>
                  </div>

                  {nominaProgressQuery.error ? (
                    <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                      <strong className="block">No fue posible cargar el progreso de nómina.</strong>
                      <span>{getErrorMessage(nominaProgressQuery.error, "Error consultando la categoría.")}</span>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    {nominaSlots.map((slot) => {
                      const doc = slot.document;
                      const status = doc?.status ?? null;
                      const canUpload = !doc;
                      const canProcess = status === "PROCESSING" && Boolean(doc?.analysisId);
                      const isUploadingSlot =
                        (uploadMutation.isPending || replaceMutation.isPending) &&
                        selectedUploadTarget?.category === "nomina" &&
                        selectedUploadTarget.slotIndex === slot.index;
                      const isConfirmingDelete = deleteTarget?.documentId === doc?.documentId;

                      return (
                        <article
                          key={slot.label}
                          className="flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-slate-100/70 px-3 py-2 transition hover:bg-slate-200/60"
                        >
                          <h4 className="w-[108px] shrink-0 text-xs font-bold text-slate-800">{slot.label}</h4>

                          {doc ? (
                            <p className="flex min-w-[150px] flex-1 items-center gap-2 text-[11px] font-medium text-slate-500">
                              <FileIcon size={13} className="shrink-0 text-slate-400" />
                              <span className="truncate">{doc.fileName || "Archivo sin nombre"}</span>
                            </p>
                          ) : (
                            <p className="min-w-[150px] flex-1 text-[11px] font-medium text-slate-400">Pendiente de carga</p>
                          )}

                          <span className={`inline-flex h-7 w-[150px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[9.5px] font-semibold tracking-wide ${statusClassName(status, doc?.manualDecision)}`}>
                            {statusLabel(status, doc?.manualDecision)}
                          </span>

                          <div className="flex shrink-0 items-center gap-2">
                            {canProcess ? (
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                                onClick={() => handleProcessAnalysis(doc?.analysisId as string, "nomina")}
                                disabled={processingAnalysisId === doc?.analysisId}
                              >
                                {processingAnalysisId === doc?.analysisId ? "Procesando..." : "Procesar"}
                              </button>
                            ) : null}

                            {canUpload ? (
                              <button
                                type="button"
                                className="appearance-none border-0 shadow-none outline-none ring-0 flex items-center gap-1.5 rounded-lg bg-[#000016] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black active:scale-95 disabled:opacity-60"
                                onClick={() => openFilePickerForSlot("nomina", slot.index)}
                                disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending || !resolvedUserId}
                              >
                                {isUploadingSlot ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <UploadCloud size={14} />
                                )}
                                Subir PDF
                              </button>
                            ) : null}
                            {doc?.documentId ? (
                              <div className="relative">
                                <button
                                  type="button"
                                  className="flex h-8 w-8 items-center justify-center border-0 bg-transparent text-slate-500 shadow-none outline-none ring-0 transition hover:text-slate-800 disabled:opacity-60"
                                  onClick={() => setOpenDocumentMenuId(openDocumentMenuId === doc.documentId ? null : doc.documentId as string)}
                                  disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending}
                                  aria-label={`Abrir opciones de ${slot.label}`}
                                >
                                  <MoreHorizontal size={16} />
                                </button>

                                {openDocumentMenuId === doc.documentId ? (
                                  <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-[11px]">
                                    <button
                                      type="button"
                                      className="block w-full px-3 py-2 text-left font-semibold text-slate-700 transition hover:bg-slate-50"
                                      onClick={() => openFilePickerForReplacement("nomina", slot.index, doc.documentId as string)}
                                    >
                                      {isUploadingSlot && selectedUploadTarget?.mode === "replace" ? "Reemplazando..." : "Reemplazar"}
                                    </button>
                                    <button
                                      type="button"
                                      className="block w-full px-3 py-2 text-left font-semibold text-red-600 transition hover:bg-red-50"
                                      onClick={() => {
                                        setOpenDocumentMenuId(null);
                                        setDeleteTarget({ category: "nomina", documentId: doc.documentId as string, label: slot.label });
                                      }}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>

                          {isConfirmingDelete ? (
                            <div className="flex w-full items-center justify-end gap-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                              <span className="mr-auto">El documento quedará eliminado del expediente activo.</span>
                              <button type="button" className="rounded-md px-2.5 py-1 font-semibold text-slate-600 hover:bg-white" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</button>
                              <button type="button" className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white disabled:opacity-60" onClick={handleDeleteDocument} disabled={deleteMutation.isPending}>
                                {deleteMutation.isPending ? "Eliminando..." : "Confirmar eliminación"}
                              </button>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-60"
                      onClick={() => nominaProgressQuery.refetch()}
                      disabled={!resolvedUserId || nominaProgressQuery.isFetching}
                    >
                      {nominaProgressQuery.isFetching ? "Actualizando progreso..." : "Actualizar progreso"}
                    </button>
                  </div>
                </section>

                <div className="space-y-3">
                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
                          Categoría activa
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">Extracto Bancario</h3>
                          <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${categoryStatusClassName(extractoProgress)}`}>
                            {categoryStatus(extractoProgress)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{extractoSubtext}</p>
                      </div>
                      <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-center text-xs leading-4 font-semibold text-slate-700">
                        {extractoProgress?.uploaded ?? 0} / {extractoProgress?.required ?? 1} archivo
                      </span>
                    </div>

                    {extractoProgressQuery.error ? (
                      <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                        <strong className="block">No fue posible cargar el progreso del extracto.</strong>
                        <span>{getErrorMessage(extractoProgressQuery.error, "Error consultando la categoría.")}</span>
                      </div>
                    ) : null}

                    <article className="flex min-h-[44px] flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-slate-100/70 px-3 py-2 transition hover:bg-slate-200/60">
                      <h4 className="w-[108px] shrink-0 text-xs font-bold text-slate-800">Extracto</h4>

                      {extractoDocument ? (
                        <p className="flex min-w-[150px] flex-1 items-center gap-2 text-[11px] font-medium text-slate-500">
                          <FileIcon size={13} className="shrink-0 text-slate-400" />
                          <span className="truncate">{extractoDocument.fileName || "Archivo sin nombre"}</span>
                        </p>
                      ) : (
                        <p className="min-w-[150px] flex-1 text-[11px] font-medium text-slate-400">Pendiente de carga · 1 PDF requerido</p>
                      )}

                      <span className={`inline-flex h-7 w-[150px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[9.5px] font-semibold tracking-wide ${statusClassName(extractoDocument?.status, extractoDocument?.manualDecision)}`}>
                        {statusLabel(extractoDocument?.status, extractoDocument?.manualDecision)}
                      </span>

                      <div className="flex shrink-0 items-center gap-2">
                        {extractoDocument?.status === "PROCESSING" && extractoDocument.analysisId ? (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                            onClick={() => handleProcessAnalysis(extractoDocument.analysisId as string, "extracto")}
                            disabled={processingAnalysisId === extractoDocument.analysisId}
                          >
                            {processingAnalysisId === extractoDocument.analysisId ? "Procesando..." : "Procesar"}
                          </button>
                        ) : null}

                        {!extractoDocument && (extractoProgress?.uploaded ?? 0) < (extractoProgress?.required ?? 1) ? (
                          <button
                            type="button"
                            className="appearance-none border-0 shadow-none outline-none ring-0 flex items-center gap-1.5 rounded-lg bg-[#000016] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black active:scale-95 disabled:opacity-60"
                            onClick={() => openFilePickerForSlot("extracto", 0)}
                            disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending || !resolvedUserId}
                          >
                            {uploadMutation.isPending && selectedUploadTarget?.category === "extracto" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                            Subir PDF
                          </button>
                        ) : null}

                        {extractoDocument?.documentId ? (
                          <div className="relative">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center border-0 bg-transparent text-slate-500 shadow-none outline-none ring-0 transition hover:text-slate-800 disabled:opacity-60"
                              onClick={() => setOpenDocumentMenuId(openDocumentMenuId === extractoDocument.documentId ? null : extractoDocument.documentId as string)}
                              disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending}
                              aria-label="Abrir opciones del extracto"
                            >
                              <MoreHorizontal size={16} />
                            </button>

                            {openDocumentMenuId === extractoDocument.documentId ? (
                              <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-[11px]">
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left font-semibold text-slate-700 transition hover:bg-slate-50"
                                  onClick={() => openFilePickerForReplacement("extracto", 0, extractoDocument.documentId as string)}
                                >
                                  {replaceMutation.isPending && selectedUploadTarget?.category === "extracto" ? "Reemplazando..." : "Reemplazar"}
                                </button>
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left font-semibold text-red-600 transition hover:bg-red-50"
                                  onClick={() => {
                                    setOpenDocumentMenuId(null);
                                    setDeleteTarget({ category: "extracto", documentId: extractoDocument.documentId as string, label: "Extracto" });
                                  }}
                                >
                                  Eliminar
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      {deleteTarget?.documentId === extractoDocument?.documentId ? (
                        <div className="flex w-full items-center justify-end gap-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                          <span className="mr-auto">El documento quedará eliminado del expediente activo.</span>
                          <button type="button" className="rounded-md px-2.5 py-1 font-semibold text-slate-600 hover:bg-white" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</button>
                          <button type="button" className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white disabled:opacity-60" onClick={handleDeleteDocument} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Confirmar eliminación"}
                          </button>
                        </div>
                      ) : null}
                    </article>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-60"
                        onClick={() => extractoProgressQuery.refetch()}
                        disabled={!resolvedUserId || extractoProgressQuery.isFetching}
                      >
                        {extractoProgressQuery.isFetching ? "Actualizando progreso..." : "Actualizar progreso"}
                      </button>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
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
        onChange={(e) => handleUploadFile(e.target.files?.[0] ?? null, selectedUploadTarget)}
      />

    </>
  );
}
