"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

/**
 * FallbackSection is used when the SectionRouter encounters an unknown key
 * or a deeply nested structure that doesn't have a specific renderer.
 */
export default function FallbackSection({ sectionKey, data }) {
  const [isOpen, setIsOpen] = useState(true);

  if (data === null || data === undefined) return null;
  // Ignore empty objects/arrays
  if (typeof data === "object" && Object.keys(data).length === 0) return null;

  const renderData = (content) => {
    // Strings/Numbers/Booleans
    if (typeof content !== "object") {
      return <p className="text-gray-300 break-words">{String(content)}</p>;
    }

    // Arrays
    if (Array.isArray(content)) {
      return (
        <ul className="space-y-3">
          {content.map((item, index) => (
            <li key={index} className="bg-white/5 rounded-xl p-4 border border-white/5">
              {renderData(item)}
            </li>
          ))}
        </ul>
      );
    }

    // Objects
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(content).map(([k, v]) => (
          v !== null && v !== undefined && (
            <div key={k} className="bg-black/20 p-4 rounded-xl border border-white/5 shadow-inner">
              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">{k.replace(/_/g, " ")}</span>
              <div className="text-gray-200">
                {renderData(v)}
              </div>
            </div>
          )
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 mb-6 shadow-xl overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 transition-colors"
      >
        <h3 className="text-xl font-bold text-white flex items-center capitalize">
          <Layers className="mr-3 text-orange-400" /> {sectionKey.replace(/_/g, " ")}
        </h3>
        {isOpen ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
      </button>
      
      {isOpen && (
        <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="w-full h-px bg-white/10 mb-6"></div>
          {renderData(data)}
        </div>
      )}
    </div>
  );
}
