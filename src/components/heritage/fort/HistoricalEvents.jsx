"use client";

import React from "react";
import { Flag } from "lucide-react";

export default function HistoricalEvents({ events }) {
  if (!events) return null;

  const entries = Array.isArray(events) 
    ? events 
    : Object.entries(events).map(([key, value]) => ({ year: key, description: value }));

  if (entries.length === 0) return null;

  return (
    <div className="py-16 bg-[#cbd5e1] border-t border-gray-400">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-center mb-12">
          <Flag className="w-8 h-8 mr-4 text-[#1e293b]" />
          <h2 className="text-3xl lg:text-4xl font-sans uppercase tracking-wider font-bold text-[#1e293b] text-center">
            Campaigns and Turning Points
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((entry, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-300 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <span className="bg-[#1e293b] text-yellow-500 font-mono font-bold px-3 py-1 rounded-sm text-sm mr-3">
                  {entry.year || entry.date || "Turning Point"}
                </span>
                {entry.event_name && (
                  <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">{entry.event_name}</h3>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                {typeof entry.description === "string" ? entry.description : typeof entry === "string" ? entry : JSON.stringify(entry.description || entry)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
