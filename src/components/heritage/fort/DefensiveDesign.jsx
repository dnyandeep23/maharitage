"use client";

import React from "react";
import { Crosshair } from "lucide-react";
import SectionRouter from "../../DynamicRenderer/SectionRouter";

export default function DefensiveDesign({ data }) {
  if (!data) return null;

  return (
    <div className="py-16 bg-[#1e293b] text-white relative overflow-hidden">
      {/* Background texture/pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-center mb-10">
          <Crosshair className="w-8 h-8 mr-4 text-yellow-500" />
          <h2 className="text-3xl lg:text-4xl font-sans uppercase tracking-wider font-bold text-white text-center">
            Defensive Design & Strategy
          </h2>
        </div>

        <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-xl p-8 lg:p-12 border border-gray-700 shadow-2xl">
          {typeof data === "string" ? (
            <p className="text-gray-300 text-lg leading-relaxed text-justify first-letter:text-5xl first-letter:font-bold first-letter:text-yellow-500 first-letter:mr-2 first-letter:float-left">
              {data}
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(data).map(([key, value]) => (
                <div key={key} className="border-b border-gray-700 pb-6 last:border-0 last:pb-0">
                  <h3 className="text-xl font-bold text-yellow-500 uppercase tracking-wide mb-3">
                    {key.replace(/_/g, " ")}
                  </h3>
                  {typeof value === "string" ? (
                    <p className="text-gray-300 leading-relaxed">{value}</p>
                  ) : (
                    <SectionRouter sectionKey={key} data={value} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
