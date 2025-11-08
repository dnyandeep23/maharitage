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
        className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive ? "border-green-600 bg-green-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <ImagePlus size={48} className="text-gray-400" />
          {isDragActive ? (
            <p className="mt-2 text-gray-600">Drop the image files here ...</p>
          ) : (
            <p className="mt-2 text-gray-600">
              Drag & drop image files here, or click to select
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
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeFile(file)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
