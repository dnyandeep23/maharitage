"use client";

import React from "react";
import HeroSection from "../common/HeroSection";
import HistoricalContext from "../common/HistoricalContext";
import GallerySection from "../common/GallerySection";
import ReferencesSection from "../common/ReferencesSection";
import SectionRouter from "../../DynamicRenderer/SectionRouter";

export default function CommonLayout({ data }) {
  if (!data) return null;

  // Render everything except the ones we already handled manually
  const handledKeys = [
    "site_id", "site_name", "heritage_type", "h_type", "period", "location", 
    "gallery", "historical_context", "references", "verification_authority", 
    "_id", "__v"
  ];

  const remainingEntries = Object.entries(data).filter(([key]) => !handledKeys.includes(key));

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white">
      {/* 1. Hero Section */}
      <HeroSection site={data} theme="common" />

      {/* 2. Main Description */}
      {data.site_description && (
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 text-center">
          <p className="text-gray-300 text-xl font-sans leading-relaxed text-justify first-letter:text-6xl first-letter:font-bold first-letter:text-white first-letter:mr-3 first-letter:float-left">
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
      <HistoricalContext data={data.historical_context} theme="common" />

      {/* 5. Gallery */}
      <GallerySection gallery={data.gallery} theme="common" />

      {/* 6. Remaining Dynamic Sections (Fallback) */}
      {remainingEntries.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-sans font-bold text-white mb-8 border-b border-gray-700 pb-4">
            Additional Details
          </h2>
          <div className="space-y-8">
            {remainingEntries.map(([key, value]) => (
              <SectionRouter key={key} sectionKey={key} data={value} />
            ))}
          </div>
        </div>
      )}

      {/* 7. References */}
      <ReferencesSection 
        references={data.references} 
        verification_authority={data.verification_authority} 
        theme="common" 
      />
    </div>
  );
}
