"use client";

import React, { useState, useCallback } from "react";
import { UploadCloud, FileJson, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { fetchWithInternalToken } from "../../../../lib/fetch";

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
    <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl w-full max-w-4xl mx-auto text-white">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Universal Data Ingestion
        </h2>
        <p className="text-gray-300">
          Upload any heritage JSON dataset. Our system automatically normalizes schema, maps keys, and dynamically generates the required structures.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-purple-400 bg-purple-400/10"
            : file
            ? "border-green-400 bg-green-400/10"
            : "border-white/20 bg-white/5 hover:border-purple-400 hover:bg-white/10"
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex flex-col items-center">
            <FileJson className="w-16 h-16 text-green-400 mb-4" />
            <p className="text-xl font-semibold text-white">{file.name}</p>
            <p className="text-sm text-gray-400 mt-2">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-xl font-medium text-gray-300">Drag & drop your .json file here</p>
            <p className="text-sm text-gray-500 mt-2">or click to select file</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center ${
            !file || uploading
              ? "bg-white/10 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin mr-3" /> Processing Schema...
            </>
          ) : (
            "Analyze & Ingest"
          )}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 flex items-start">
          <XCircle className="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-6 rounded-xl bg-green-500/10 border border-green-500/30">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            <h3 className="text-xl font-bold text-green-400">Ingestion Successful</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-black/20 p-4 rounded-lg">
              <span className="text-gray-400 block mb-1">Successfully Parsed</span>
              <span className="text-2xl font-bold text-white">{result.successCount}</span>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <span className="text-gray-400 block mb-1">Errors Encountered</span>
              <span className="text-2xl font-bold text-red-400">{result.errorsCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
