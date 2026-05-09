"use client";

import React from "react";
import { Clock, User, Award } from "lucide-react";

export default function HistoricalContext({ data, theme = "common" }) {
  if (!data) return null;

  const isCave = theme === "cave";
  const isFort = theme === "fort";

  const sectionBg = isCave ? "bg-[#f5f2eb]" : isFort ? "bg-[#e2e8f0]" : "bg-white/5";
  const textColor = isCave ? "text-[#5c4f3c]" : isFort ? "text-gray-800" : "text-gray-300";
  const headingColor = isCave ? "text-[#3e3527]" : isFort ? "text-[#1e293b]" : "text-white";
  const cardBg = isCave ? "bg-[#efeadd]" : isFort ? "bg-white" : "bg-black/20";
  const iconColor = isCave ? "text-[#a38f72]" : isFort ? "text-yellow-600" : "text-gray-400";
  const borderStyle = isCave ? "border-[#d8d0bd]" : isFort ? "border-gray-300" : "border-white/10";
  const titleFont = isCave ? "font-serif text-3xl" : isFort ? "font-sans uppercase tracking-wider text-2xl" : "font-sans text-2xl";

  return (
    <div className={`py-12 ${sectionBg} border-t ${borderStyle}`}>
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <h2 className={`font-bold mb-8 ${headingColor} ${titleFont} text-center`}>
          Historical Context
        </h2>

        <div className="space-y-6">
          {data.ruler_or_dynasty && (
            <div className={`p-6 rounded-lg border ${borderStyle} ${cardBg} shadow-sm flex items-start gap-4`}>
              <Award className={`w-6 h-6 mt-1 shrink-0 ${iconColor}`} />
              <div>
                <h3 className={`font-bold text-sm uppercase tracking-wider mb-1 ${headingColor}`}>Ruler / Dynasty</h3>
                <p className={`text-lg ${textColor} ${isCave ? "font-serif" : ""}`}>{data.ruler_or_dynasty}</p>
              </div>
            </div>
          )}

          {data.approx_date && (
            <div className={`p-6 rounded-lg border ${borderStyle} ${cardBg} shadow-sm flex items-start gap-4`}>
              <Clock className={`w-6 h-6 mt-1 shrink-0 ${iconColor}`} />
              <div>
                <h3 className={`font-bold text-sm uppercase tracking-wider mb-1 ${headingColor}`}>Approximated Date</h3>
                <p className={`text-lg ${textColor} ${isCave ? "font-serif" : ""}`}>{data.approx_date}</p>
              </div>
            </div>
          )}

          {data.related_figures && data.related_figures.length > 0 && (
            <div className={`p-6 rounded-lg border ${borderStyle} ${cardBg} shadow-sm flex items-start gap-4`}>
              <User className={`w-6 h-6 mt-1 shrink-0 ${iconColor}`} />
              <div>
                <h3 className={`font-bold text-sm uppercase tracking-wider mb-2 ${headingColor}`}>Related Figures</h3>
                <div className="flex flex-wrap gap-2">
                  {data.related_figures.map((fig, idx) => (
                    <span key={idx} className={`px-3 py-1 text-sm rounded-full border ${borderStyle} ${isCave ? "bg-[#d8d0bd]/50" : isFort ? "bg-gray-100" : "bg-white/10"} ${textColor}`}>
                      {fig}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {data.cultural_significance && (
            <div className={`p-8 mt-8 rounded-lg border-l-4 ${isCave ? "border-l-[#a38f72]" : isFort ? "border-l-yellow-600" : "border-l-gray-400"} ${cardBg} shadow-md`}>
              <h3 className={`font-bold text-sm uppercase tracking-wider mb-3 ${headingColor}`}>Cultural Significance</h3>
              <p className={`text-lg leading-relaxed ${textColor} ${isCave ? "font-serif" : ""}`}>
                {data.cultural_significance}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
