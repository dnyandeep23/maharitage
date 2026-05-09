"use client";

import React from "react";
import { History } from "lucide-react";

export default function RulingPowerChronology({ chronology }) {
  if (!chronology) return null;

  // Convert to array if it's an object, or just map if it's already an array
  const entries = Array.isArray(chronology) 
    ? chronology 
    : Object.entries(chronology).map(([key, value]) => ({ dynasty: key.replace(/_/g, " "), details: value }));

  if (entries.length === 0) return null;

  return (
    <div className="py-16 bg-[#e2e8f0]">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-center mb-12">
          <History className="w-8 h-8 mr-4 text-[#1e293b]" />
          <h2 className="text-3xl lg:text-4xl font-sans uppercase tracking-wider font-bold text-[#1e293b] text-center">
            Ruling Power Chronology
          </h2>
        </div>

        <div className="relative border-l-4 border-yellow-600 ml-4 md:ml-8 space-y-12">
          {entries.map((entry, idx) => (
            <div key={idx} className="relative pl-8 md:pl-12 group">
              {/* Timeline marker */}
              <div className="absolute w-6 h-6 bg-yellow-500 rounded-full border-4 border-[#e2e8f0] -left-[15px] top-1 group-hover:bg-yellow-400 transition-colors shadow-sm" />
              
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 group-hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:justify-between md:items-baseline mb-2">
                  <h3 className="text-xl font-bold text-[#0f172a] uppercase tracking-wide">
                    {entry.dynasty || entry.name || "Unknown Dynasty"}
                  </h3>
                  {entry.period && (
                    <span className="text-sm font-semibold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full mt-2 md:mt-0 inline-block">
                      {entry.period}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed mt-2">
                  {typeof entry.details === "string" ? entry.details : typeof entry === "string" ? entry : JSON.stringify(entry.details || entry)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
