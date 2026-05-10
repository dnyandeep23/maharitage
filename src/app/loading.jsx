"use client";
import React from "react";

const Loading = ({ to }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#f7f3ea]">
      <div className="absolute inset-0 heritage-texture opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_18%,rgba(185,146,74,0.16),transparent_32%),linear-gradient(135deg,#fbf7ee,#e9ddc8)]" />

      <div className="relative w-[min(90vw,360px)] border border-[#123327]/14 bg-[#fffdf7]/86 p-8 text-center shadow-[0_30px_90px_rgba(21,18,13,0.12)] backdrop-blur-xl">
        <div className="mx-auto mb-6 h-1 w-28 overflow-hidden rounded-full bg-[#123327]/12">
          <div className="h-full w-1/2 animate-[archiveLoad_1.4s_var(--ease-archive)_infinite] rounded-full bg-[#b9924a]" />
        </div>
        <h1 className="font-cinzel-decorative text-4xl font-bold text-[#123327]">
          MahaRitage
        </h1>
        <p className="mt-3 text-sm font-medium text-stone-500">
          {to ? `Opening ${to}...` : "Preparing the archive..."}
        </p>
      </div>

      <style>
        {`
          @keyframes archiveLoad {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(240%); }
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
