"use client";

import React from "react";
import dynamic from "next/dynamic";

const HeritageClient = dynamic(() => import("../../app/cave/CaveClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#f4ecdd]">
      <p className="animate-pulse font-cinzel-decorative text-xl font-semibold text-[#263a2d]">Loading heritage site...</p>
    </div>
  ),
});

/**
 * DynamicPage delegates all rendering to CaveClient (the unified heritage client).
 * CaveClient internally checks h_type to render cave vs fort sections.
 */
export default function DynamicPage({ data }) {
  if (!data) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f4ecdd]">
      <p className="text-gray-400 text-xl">Loading data...</p>
    </div>
  );

  return <HeritageClient site={data} />;
}
