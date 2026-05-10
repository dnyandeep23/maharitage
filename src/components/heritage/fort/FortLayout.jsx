"use client";

import React from "react";
import HeroSection from "../common/HeroSection";
import HistoricalContext from "../common/HistoricalContext";
import GallerySection from "../common/GallerySection";
import ReferencesSection from "../common/ReferencesSection";
import ArchitecturalFeatures from "./ArchitecturalFeatures";
import DefensiveDesign from "./DefensiveDesign";
import RulingPowerChronology from "./RulingPowerChronology";
import HistoricalEvents from "./HistoricalEvents";
import SectionRouter from "../../DynamicRenderer/SectionRouter";

export default function FortLayout({ data }) {
  if (!data) return null;

  // Render everything except the ones we already handled manually
  const handledKeys = [
    "site_id", "site_name", "heritage_type", "h_type", "period", "location", 
    "gallery", "historical_context", "references", "verification_authority", 
    "architectural_features", "ruling_powers_chronology", "historical_events",
    "inscriptions", // explicitly handle inscriptions to avoid rendering them incorrectly
    "_id", "__v"
  ];

  const remainingEntries = Object.entries(data).filter(([key]) => !handledKeys.includes(key));

  return (
    <div className="bg-[#e2e8f0] min-h-screen">
      {/* 1. Hero Section */}
      <HeroSection site={data} theme="fort" />

      {/* 2. Main Description */}
      {data.site_description && (
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-[#1e293b] text-xl font-sans leading-relaxed text-justify first-letter:text-6xl first-letter:font-bold first-letter:text-yellow-600 first-letter:mr-3 first-letter:float-left">
            {data.site_description}
          </p>
        </div>
      )}

      {/* 3. Location */}
      {data.location && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 pb-12">
          <SectionRouter sectionKey="location" data={data.location} />
        </div>
      )}

      {/* 4. Historical Context */}
      <HistoricalContext data={data.historical_context} theme="fort" />

      {/* 5. Ruling Power Chronology */}
      {data.ruling_powers_chronology && (
        <RulingPowerChronology chronology={data.ruling_powers_chronology} />
      )}

      {/* 6. Architectural Features */}
      {data.architectural_features && (
        <>
          <ArchitecturalFeatures features={data.architectural_features} />
          {data.architectural_features.defensive_design && (
            <DefensiveDesign data={data.architectural_features.defensive_design} />
          )}
        </>
      )}

      {/* 7. Historical Events */}
      {data.historical_events && (
        <HistoricalEvents events={data.historical_events} />
      )}

      {/* 8. Gallery */}
      <GallerySection gallery={data.gallery} theme="fort" />

      {/* 9. Remaining Dynamic Sections (Fallback) */}
      {remainingEntries.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-sans uppercase tracking-wider font-bold text-[#1e293b] mb-8 border-b border-gray-400 pb-4">
            Archival Notes
          </h2>
          <div className="space-y-8">
            {remainingEntries.map(([key, value]) => (
              <SectionRouter key={key} sectionKey={key} data={value} />
            ))}
          </div>
        </div>
      )}

      {/* 10. References */}
      <ReferencesSection 
        references={data.references} 
        verification_authority={data.verification_authority} 
        theme="fort" 
      />
    </div>
  );
}
