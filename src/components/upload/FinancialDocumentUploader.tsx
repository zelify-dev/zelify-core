"use client";

import React, { useState, useCallback } from "react";
import { UploadCloud, X, File as FileIcon, AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";

interface FileState {
  file: File;
  id: string;
}

interface FinancialDocumentUploaderProps {
  userId: string;
  onClose: () => void;
}

export function FinancialDocumentUploader({ userId, onClose }: FinancialDocumentUploaderProps) {
  const [nominaFiles, setNominaFiles] = useState<FileState[]>([]);
  const [extractoFiles, setExtractoFiles] = useState<FileState[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, category: "nomina" | "extracto") => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles, category);
  }, [nominaFiles, extractoFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, category: "nomina" | "extracto") => {
    setError(null);
    setSuccessMsg(null);

    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      validateAndAddFiles(selectedFiles, category);
    }
  };

  const validateAndAddFiles = (newFiles: File[], category: "nomina" | "extracto") => {
    let validFiles: FileState[] = [];
    let hasError = false;

    for (const file of newFiles) {
      if (file.type !== "application/pdf") {
        setError("Todos los archivos deben ser formato PDF.");
        hasError = true;
        break;
      }
      if (file.size > 3 * 1024 * 1024) {
        setError(`El archivo "${file.name}" supera el límite de 3 MB.`);
        hasError = true;
        break;
      }
      validFiles.push({ file, id: Math.random().toString(36).substring(7) });
    }

    if (hasError) return;

    if (category === "nomina") {
      if (nominaFiles.length + validFiles.length > 5) {
        setError("Solo se requieren 5 archivos de nómina.");
        return;
      }
      setNominaFiles(prev => [...prev, ...validFiles]);
    } else {
      if (extractoFiles.length + validFiles.length > 3) {
        setError("Solo se requieren 3 archivos de extracto.");
        return;
      }
      setExtractoFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (id: string, category: "nomina" | "extracto") => {
    if (category === "nomina") {
      setNominaFiles(prev => prev.filter(f => f.id !== id));
    } else {
      setExtractoFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleUpload = async (category: "nomina" | "extracto") => {
    const filesToUpload = category === "nomina" ? nominaFiles : extractoFiles;
    const requiredCount = category === "nomina" ? 5 : 3;

    if (filesToUpload.length !== requiredCount) {
      setError(`Debes cargar exactamente ${requiredCount} archivos para ${category}. Tienes ${filesToUpload.length}.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    filesToUpload.forEach(f => {
      formData.append("files", f.file);
    });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_MDC_API_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/financial-documents/${userId}/${category}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error en la subida de archivos");
      }

      setSuccessMsg(`Archivos de ${category} cargados exitosamente.`);
      if (category === "nomina") {
        setNominaFiles([]);
      } else {
        setExtractoFiles([]);
      }
    } catch (err) {
      setError(`Ocurrió un error al cargar los archivos de ${category}.`);
    } finally {
      setIsUploading(false);
    }
  };

  const preventDefault = (e: React.DragEvent) => e.preventDefault();

  const DropzoneArea = ({ title, category, files, maxFiles }: { title: string, category: "nomina" | "extracto", files: FileState[], maxFiles: number }) => (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <label className="block text-sm font-semibold text-gray-700">{title}</label>
        <span className="text-xs text-gray-500 font-medium">{files.length} / {maxFiles} archivos</span>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${files.length === maxFiles ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-blue-400 bg-gray-50/50'}`}
        onDragOver={preventDefault}
        onDragEnter={preventDefault}
        onDrop={(e) => handleDrop(e, category)}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 mb-1">
          Arrastra tus archivos aquí o{" "}
          <label className="text-blue-600 cursor-pointer hover:underline font-medium">
            examina
            <input
              type="file"
              className="hidden"
              multiple
              accept="application/pdf"
              onChange={(e) => handleFileSelect(e, category)}
            />
          </label>
        </p>
        <p className="text-xs text-gray-400">PDF hasta 3MB</p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-red-50 text-red-500 p-1.5 rounded-md">
                  <FileIcon size={16} />
                </div>
                <span className="text-xs font-medium text-gray-700 truncate">{f.file.name}</span>
              </div>
              <button
                onClick={() => removeFile(f.id, category)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="pt-2 flex justify-end">
            <button
              className="text-xs font-semibold px-4 py-2 bg-[#1c4ed8] text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
              disabled={files.length !== maxFiles || isUploading}
              onClick={() => handleUpload(category)}
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : "Subir " + title}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-[#1c2b4c]">Carga de Documentos</h2>
            <p className="text-xs text-gray-500 font-medium">Requeridos para el motor de decisión</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors border-none outline-none focus:outline-none shadow-none flex items-center justify-center bg-transparent">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 max-h-[60vh] md:max-h-[500px]">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-green-50 border border-green-100 text-green-700 rounded-lg flex items-start gap-3 text-sm">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p className="font-medium">{successMsg}</p>
            </div>
          )}

          <DropzoneArea title="Comprobantes de Nómina" category="nomina" files={nominaFiles} maxFiles={5} />

          <hr className="border-gray-100 mb-6" />

          <DropzoneArea title="Extractos Bancarios" category="extracto" files={extractoFiles} maxFiles={3} />
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
