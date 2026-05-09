"use client";

import React from "react";
import HeroSection from "../common/HeroSection";
import HistoricalContext from "../common/HistoricalContext";
import GallerySection from "../common/GallerySection";
import ReferencesSection from "../common/ReferencesSection";
import InscriptionsSection from "./InscriptionsSection";
import SectionRouter from "../../DynamicRenderer/SectionRouter";

export default function CaveLayout({ data }) {
  if (!data) return null;

  // Render everything except the ones we already handled manually
  const handledKeys = [
    "site_id", "site_name", "heritage_type", "h_type", "period", "location", 
    "gallery", "historical_context", "references", "verification_authority", 
    "inscriptions", "_id", "__v"
  ];

  const remainingEntries = Object.entries(data).filter(([key]) => !handledKeys.includes(key));

  return (
    <div className="bg-[#efeadd] min-h-screen">
      {/* 1. Hero Section */}
      <HeroSection site={data} theme="cave" />

      {/* 2. Main Description */}
      {data.site_description && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-[#3e3527] text-xl md:text-2xl font-serif leading-relaxed text-justify first-letter:text-6xl first-letter:font-bold first-letter:text-[#8c7b65] first-letter:mr-3 first-letter:float-left">
            {data.site_description}
          </p>
        </div>
      )}

      {/* 3. Location (if needed, usually in Hero, but let SectionRouter handle if complex) */}
      {data.location && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 pb-12">
          <SectionRouter sectionKey="location" data={data.location} />
        </div>
      )}

      {/* 4. Historical Context */}
      <HistoricalContext data={data.historical_context} theme="cave" />

      {/* 5. Inscriptions (Cave Specific) */}
      <InscriptionsSection inscriptions={data.inscriptions} />

      {/* 6. Gallery */}
      <GallerySection gallery={data.gallery} theme="cave" />

      {/* 7. Remaining Dynamic Sections (Fallback) */}
      {remainingEntries.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-serif font-bold text-[#3e3527] mb-8 border-b border-[#d8d0bd] pb-4">Additional Details</h2>
          <div className="space-y-8">
            {remainingEntries.map(([key, value]) => (
              <SectionRouter key={key} sectionKey={key} data={value} />
            ))}
          </div>
        </div>
      )}

      {/* 8. References */}
      <ReferencesSection 
        references={data.references} 
        verification_authority={data.verification_authority} 
        theme="cave" 
      />
    </div>
  );
}
