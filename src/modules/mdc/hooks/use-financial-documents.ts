"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteFinancialDocument,
  fetchFinancialDocumentExtraction,
  fetchFinancialDocumentFileUrl,
  fetchFinancialDocumentProgress,
  processFinancialDocumentAnalysis,
  reprocessFinancialDocumentAnalysis,
  replaceFinancialDocument,
  reviewFinancialDocumentAnalysis,
  uploadConsolidatedPayroll,
  uploadOneFinancialDocument,
  type FinancialDocumentManualReviewPayload,
} from "@/modules/mdc/services/mdc-finance-requests.service";

export const financialDocumentKeys = {
  progress: (userId: string | null | undefined, category = "nomina") => ["financial-documents", userId, category, "progress"] as const,
  extraction: (analysisId: string | null | undefined) => ["financial-documents", analysisId, "extraction"] as const,
  fileUrl: (documentId: string | null | undefined) => ["financial-documents", documentId, "file-url"] as const,
};

export type FinancialDocumentCategory = "nomina" | "extracto" | "comprobante_domicilio";

export function useDocumentProgress(userId: string | null, category: FinancialDocumentCategory, enabled: boolean) {
  return useQuery({
    queryKey: financialDocumentKeys.progress(userId, category),
    queryFn: () => fetchFinancialDocumentProgress(userId as string, category),
    enabled: enabled && Boolean(userId),
    staleTime: 10_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function usePayrollProgress(userId: string | null, isOpen: boolean) {
  return useDocumentProgress(userId, "nomina", isOpen);
}

export function useUploadOneDocument(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["financial-documents", userId, "upload-one"],
    mutationFn: ({ category, file }: { category: FinancialDocumentCategory; file: File }) =>
      uploadOneFinancialDocument(userId as string, category, file),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: financialDocumentKeys.progress(userId, variables.category) });
    },
  });
}

export function useUploadConsolidatedPayroll(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["financial-documents", userId, "nomina", "upload-consolidated"],
    mutationFn: (file: File) => uploadConsolidatedPayroll(userId as string, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: financialDocumentKeys.progress(userId, "nomina") });
    },
  });
}

export function useProcessAnalysis(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["financial-documents", "process"],
    mutationFn: (analysisId: string) => processFinancialDocumentAnalysis(analysisId),
    onSuccess: async (_result, analysisId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financial-documents", userId] }),
        queryClient.invalidateQueries({ queryKey: financialDocumentKeys.extraction(analysisId) }),
      ]);
    },
  });
}

export function useManualReviewAnalysis(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["financial-documents", "manual-review"],
    mutationFn: ({ analysisId, payload }: { analysisId: string; payload: FinancialDocumentManualReviewPayload }) =>
      reviewFinancialDocumentAnalysis(analysisId, payload),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financial-documents", userId] }),
        queryClient.invalidateQueries({ queryKey: financialDocumentKeys.extraction(variables.analysisId) }),
      ]);
    },
  });
}

export function useReprocessAnalysis(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["financial-documents", "reprocess"],
    mutationFn: (analysisId: string) => reprocessFinancialDocumentAnalysis(analysisId),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financial-documents", userId] }),
        queryClient.invalidateQueries({ queryKey: financialDocumentKeys.extraction(result.previousAnalysisId) }),
      ]);
    },
  });
}

export function useReplaceDocument(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["financial-documents", "replace"],
    mutationFn: ({ documentId, file }: { documentId: string; category: FinancialDocumentCategory; file: File }) =>
      replaceFinancialDocument(documentId, file),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: financialDocumentKeys.progress(userId, variables.category) }),
        queryClient.removeQueries({ queryKey: financialDocumentKeys.fileUrl(variables.documentId) }),
      ]);
    },
  });
}

export function useDeleteDocument(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["financial-documents", "delete"],
    mutationFn: ({ documentId }: { documentId: string; category: FinancialDocumentCategory }) =>
      deleteFinancialDocument(documentId),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: financialDocumentKeys.progress(userId, variables.category) }),
        queryClient.removeQueries({ queryKey: financialDocumentKeys.fileUrl(variables.documentId) }),
      ]);
    },
  });
}

export function useAnalysisExtraction(analysisId: string | null, isOpen: boolean) {
  return useQuery({
    queryKey: financialDocumentKeys.extraction(analysisId),
    queryFn: () => fetchFinancialDocumentExtraction(analysisId as string),
    enabled: isOpen && Boolean(analysisId),
    staleTime: 10_000,
  });
}

export function useDocumentFileUrl(documentId: string | null, isOpen: boolean) {
  return useQuery({
    queryKey: financialDocumentKeys.fileUrl(documentId),
    queryFn: () => fetchFinancialDocumentFileUrl(documentId as string),
    enabled: isOpen && Boolean(documentId),
    staleTime: 12 * 60 * 1_000,
    gcTime: 15 * 60 * 1_000,
  });
}
