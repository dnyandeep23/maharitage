"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, X } from "lucide-react";

const ImageUpload = ({ files, onFilesChange }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      onFilesChange([...files, ...acceptedFiles]);
    },
    [files, onFilesChange]
  );

  const removeFile = (fileToRemove) => {
    onFilesChange(files.filter((file) => file !== fileToRemove));
  };

  // Restrict only image types
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [], // Accept only image files (JPEG, PNG, WebP, etc.)
    },
    multiple: true, // Allow multiple image uploads
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-[1.5rem] border border-dashed p-10 text-center transition-colors ${
          isDragActive ? "border-[#b9924a] bg-[#f1e8d5]" : "border-[#123327]/22 bg-[#fffdf7]/70"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <ImagePlus size={44} className="text-[#8a6a31]" />
          {isDragActive ? (
            <p className="mt-3 text-sm font-semibold text-[#123327]">Drop image files into the archive tray</p>
          ) : (
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Drag gallery images here, or click to select archival plates
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {files.map((file, index) => (
          <div key={index} className="relative">
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="h-32 w-full rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => removeFile(file)}
              className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUpload;
