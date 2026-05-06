"use client";

import React from "react";
import SectionRouter from "./SectionRouter";

/**
 * DynamicPage is the root dynamic renderer.
 * It takes a fully normalized heritage JSON object and generates the UI automatically.
 */
export default function DynamicPage({ data }) {
  if (!data) return <div className="text-center p-12 text-gray-400">Loading data...</div>;

  // Extract base required metadata for the hero header
  const title = data.site_name || "Unknown Heritage Site";
  const type = data.heritage_type || "Heritage";
  const district = data.location?.district || "Unknown District";
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      {/* Hero Header with dynamic tags */}
      <div className="relative pt-32 pb-20 px-6 lg:px-8 border-b border-white/10 mb-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[120px]" />
          <div className="absolute -bottom-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-purple-300 uppercase tracking-widest backdrop-blur-sm">
              {type}
            </span>
            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-blue-300 uppercase tracking-widest backdrop-blur-sm">
              {district}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>
      </div>

      {/* Dynamic Content Body */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main content column */}
          <div className="lg:col-span-8">
            {Object.entries(data).map(([key, value]) => (
              // Use SectionRouter to decide how to render each block
              <SectionRouter key={key} sectionKey={key} data={value} />
            ))}
          </div>

          {/* Sidebar / Quick Info */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 sticky top-24">
               <h4 className="text-lg font-bold text-white mb-4">Metadata</h4>
               <div className="space-y-4">
                 <div className="flex justify-between items-center border-b border-white/10 pb-2">
                   <span className="text-gray-400">ID</span>
                   <span className="text-white font-mono text-sm">{data.site_id || "N/A"}</span>
                 </div>
                 {data.period && (
                   <div className="flex justify-between items-center border-b border-white/10 pb-2">
                     <span className="text-gray-400">Period</span>
                     <span className="text-white">{data.period}</span>
                   </div>
                 )}
               </div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
