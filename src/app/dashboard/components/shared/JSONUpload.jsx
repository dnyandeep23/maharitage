"use client";

import React, { useState, useCallback } from "react";
import { UploadCloud, FileJson, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
export default function JSONUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    setError(null);
    setResult(null);
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
  });

  const dropzoneClass = `group relative overflow-hidden rounded-[1.35rem] border border-dashed p-8 text-center transition-all duration-300 sm:p-12 ${
    isDragActive
      ? "border-[#8a6a31] bg-[#fff8e8]/90 shadow-[0_24px_70px_rgba(138,106,49,0.18)]"
      : file
      ? "border-emerald-400/80 bg-emerald-50/80 shadow-[0_22px_60px_rgba(16,185,129,0.12)]"
      : "border-[#c8b48d]/80 bg-[#fffaf0]/70 hover:border-[#8a6a31] hover:bg-[#fff8e8]/90 hover:shadow-[0_22px_64px_rgba(21,18,13,0.1)]"
  }`;

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("auth-token");
      const res = await fetch("/api/sites/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setFile(null); // reset file on success
      } else {
        setError(data.error || "Failed to upload JSON file.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="museum-card-premium mx-auto w-full max-w-4xl p-5 text-stone-900 sm:p-8">
      <div className="relative z-10 mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8a6a31]">
          Archive Operations
        </p>
        <h2 className="mt-2 font-cinzel-decorative text-3xl font-bold text-[#123327]">
          Universal Data Ingestion
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
          Upload any heritage JSON dataset. Our system automatically normalizes schema, maps keys, and dynamically generates the required structures.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`${dropzoneClass} relative z-10 cursor-pointer`}
      >
        <input {...getInputProps()} />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80" />
        {file ? (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_34px_rgba(16,185,129,0.12)]">
              <FileJson className="h-8 w-8 text-emerald-700" />
            </div>
            <p className="max-w-full break-words text-xl font-semibold text-[#123327]">{file.name}</p>
            <p className="mt-2 text-sm font-medium text-stone-500">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e4d6b9] bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_34px_rgba(21,18,13,0.08)] transition group-hover:border-[#c7a765]">
              <UploadCloud className="h-8 w-8 text-[#8a6a31]" />
            </div>
            <p className="text-xl font-semibold text-[#123327]">Drag & drop your .json file here</p>
            <p className="mt-2 text-sm font-medium text-stone-500">or click to select file</p>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-8 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`flex items-center rounded-2xl px-7 py-3 text-base font-bold transition-all duration-300 ${
            !file || uploading
              ? "cursor-not-allowed border border-stone-200 bg-stone-100/80 text-stone-400"
              : "border border-[#d8bc7a]/70 bg-[#123327] text-[#fff8e8] shadow-[0_18px_42px_rgba(18,51,39,0.24)] hover:-translate-y-0.5 hover:bg-[#183f31] hover:shadow-[0_22px_52px_rgba(18,51,39,0.28)]"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" /> Processing Schema...
            </>
          ) : (
            "Analyze & Ingest"
          )}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="relative z-10 mt-6 flex items-start rounded-2xl border border-red-200 bg-red-50/85 p-4 shadow-[0_14px_36px_rgba(127,29,29,0.08)]">
          <XCircle className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium leading-6 text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="relative z-10 mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-[0_18px_48px_rgba(16,185,129,0.12)] sm:p-6">
          <div className="flex items-center mb-4">
            <CheckCircle className="mr-3 h-6 w-6 text-emerald-700" />
            <h3 className="text-xl font-bold text-[#123327]">Ingestion Successful</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
              <span className="mb-1 block text-stone-500">Successfully Parsed</span>
              <span className="text-2xl font-bold text-[#123327]">{result.successCount}</span>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/65 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
              <span className="mb-1 block text-stone-500">Errors Encountered</span>
              <span className="text-2xl font-bold text-red-700">{result.errorsCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
