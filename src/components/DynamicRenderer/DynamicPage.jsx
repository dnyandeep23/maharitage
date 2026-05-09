"use client";

import React from "react";
import dynamic from "next/dynamic";

const HeritageClient = dynamic(() => import("../../app/cave/CaveClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-green-50">
      <p className="text-green-900 font-semibold text-xl animate-pulse">Loading heritage site...</p>
    </div>
  ),
});

/**
 * DynamicPage delegates all rendering to CaveClient (the unified heritage client).
 * CaveClient internally checks h_type to render cave vs fort sections.
 */
export default function DynamicPage({ data }) {
  if (!data) return (
    <div className="w-full h-screen flex items-center justify-center bg-green-50">
      <p className="text-gray-400 text-xl">Loading data...</p>
    </div>
  );

  return <HeritageClient site={data} />;
}
