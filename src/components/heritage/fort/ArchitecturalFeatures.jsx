"use client";

import React from "react";
import { Shield } from "lucide-react";
import SectionRouter from "../../DynamicRenderer/SectionRouter";

export default function ArchitecturalFeatures({ features }) {
  if (!features || Object.keys(features).length === 0) return null;

  // Render defensive_design specifically, leave the rest to be mapped
  const { defensive_design, ...otherFeatures } = features;

  return (
    <div className="py-16 bg-[#e2e8f0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center mb-10">
          <Shield className="w-8 h-8 mr-4 text-yellow-600" />
          <h2 className="text-3xl lg:text-4xl font-sans uppercase tracking-wider font-bold text-[#1e293b]">
            Architectural Features
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {Object.entries(otherFeatures).map(([key, value]) => (
            <div key={key} className="bg-white p-8 rounded-lg shadow-md border-l-4 border-yellow-600">
              <h3 className="text-xl font-bold text-[#0f172a] uppercase tracking-wide mb-4">
                {key.replace(/_/g, " ")}
              </h3>
              {typeof value === "string" ? (
                <p className="text-gray-700 leading-relaxed text-justify">{value}</p>
              ) : (
                <SectionRouter sectionKey={key} data={value} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
