"use client";

import React from "react";
import { BookOpen, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ReferencesSection({ references, verification_authority, theme = "common" }) {
  if ((!references || references.length === 0) && (!verification_authority?.curated_by || verification_authority.curated_by.length === 0)) {
    return null;
  }

  const isCave = theme === "cave";
  const isFort = theme === "fort";

  const sectionBg = isCave ? "bg-[#e8dcc4]" : isFort ? "bg-[#cbd5e1]" : "bg-black/40";
  const textColor = isCave ? "text-[#5c4f3c]" : isFort ? "text-gray-700" : "text-gray-300";
  const headingColor = isCave ? "text-[#3e3527]" : isFort ? "text-[#0f172a]" : "text-white";
  const iconColor = isCave ? "text-[#8c7b65]" : isFort ? "text-gray-600" : "text-gray-400";
  const borderStyle = isCave ? "border-[#c2b49a]" : isFort ? "border-gray-400" : "border-white/10";
  const linkColor = isCave ? "text-[#8c7b65] hover:text-[#5c4f3c]" : isFort ? "text-blue-700 hover:text-blue-900" : "text-blue-400 hover:text-blue-300";

  return (
    <div className={`py-16 ${sectionBg} border-t ${borderStyle}`}>
      <div className="max-w-4xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Verification Authority */}
        {verification_authority?.curated_by && verification_authority.curated_by.length > 0 && (
          <div>
            <h3 className={`font-bold mb-6 ${headingColor} flex items-center text-xl`}>
              <ShieldCheck className={`mr-3 ${iconColor}`} /> Verification Authority
            </h3>
            <ul className={`space-y-3 ${textColor}`}>
              {verification_authority.curated_by.map((curator, idx) => (
                <li key={idx} className="flex items-start">
                  <span className={`mr-2 ${iconColor}`}>•</span>
                  <span className={isCave ? "font-serif" : ""}>{curator}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* References */}
        {references && references.length > 0 && (
          <div>
            <h3 className={`font-bold mb-6 ${headingColor} flex items-center text-xl`}>
              <BookOpen className={`mr-3 ${iconColor}`} /> Sources & References
            </h3>
            <ul className={`space-y-4 ${textColor}`}>
              {references.map((ref, idx) => {
                const content = (
                  <span className={isCave ? "font-serif" : ""}>
                    <span className="font-semibold">{ref.title}</span> — {ref.author}, {ref.year}
                  </span>
                );
                
                return (
                  <li key={idx} className="flex items-start leading-relaxed">
                    <span className={`mr-2 ${iconColor}`}>•</span>
                    {ref.url ? (
                      <Link href={ref.url} target="_blank" rel="noopener noreferrer" className={`transition-colors ${linkColor}`}>
                        {content}
                      </Link>
                    ) : (
                      <span>{content}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
