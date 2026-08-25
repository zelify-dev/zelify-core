"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchFinancialDocumentExtraction,
  fetchFinancialDocumentFileUrl,
  fetchFinancialDocumentProgress,
  processFinancialDocumentAnalysis,
} from "@/modules/mdc/services/mdc-finance-requests.service";

export const financialDocumentKeys = {
  progress: (userId: string | null | undefined) => ["financial-documents", userId, "nomina", "progress"] as const,
  extraction: (analysisId: string | null | undefined) => ["financial-documents", analysisId, "extraction"] as const,
  fileUrl: (documentId: string | null | undefined) => ["financial-documents", documentId, "file-url"] as const,
};

export function usePayrollProgress(userId: string | null, isOpen: boolean) {
  return useQuery({
    queryKey: financialDocumentKeys.progress(userId),
    queryFn: () => fetchFinancialDocumentProgress(userId as string, "nomina"),
    enabled: isOpen && Boolean(userId),
    staleTime: 10_000,
    refetchInterval: (query) => (isOpen && (query.state.data?.processing ?? 0) > 0 ? 5_000 : false),
  });
}

export function useProcessAnalysis(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["financial-documents", "process"],
    mutationFn: (analysisId: string) => processFinancialDocumentAnalysis(analysisId),
    onSuccess: async (_result, analysisId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: financialDocumentKeys.progress(userId) }),
        queryClient.invalidateQueries({ queryKey: financialDocumentKeys.extraction(analysisId) }),
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
