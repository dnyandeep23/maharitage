"use client";

import React from "react";
import FallbackSection from "./FallbackSection";
import { MapPin, Image as ImageIcon, FileText, Info } from "lucide-react";

/**
 * SectionRouter dynamically decides how to render a given normalized section
 * of the heritage JSON data. It maps known section keys to optimized visual components.
 */
export default function SectionRouter({ sectionKey, data }) {
  // Ignore base level keys we don't need to render as blocks
  const ignoreKeys = ["_id", "__v", "site_id", "site_name", "heritage_type", "status", "researchExpertId", "action", "type", "expiresAt", "adminFeedback"];
  if (ignoreKeys.includes(sectionKey)) return null;

  // Renders simple coordinates mapping
  if (sectionKey === "location") {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-6 shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center mb-4 capitalize">
          <MapPin className="mr-2 text-blue-400" /> Location Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-gray-300">
          {Object.entries(data).map(([k, v]) => (
            v && (
              <div key={k} className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{k.replace(/_/g, " ")}</p>
                <p className="font-medium text-white">{String(v)}</p>
              </div>
            )
          ))}
        </div>
      </div>
    );
  }

  // Renders gallery of images
  if (sectionKey === "gallery" && Array.isArray(data)) {
    if (data.length === 0) return null;
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-6 shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center mb-4 capitalize">
          <ImageIcon className="mr-2 text-purple-400" /> Image Gallery
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden shadow-lg border border-white/10 group">
              <img 
                src={url} 
                alt={`Gallery image ${i + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found"; }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Renders description text blocks
  if (typeof data === "string" && (sectionKey.includes("description") || sectionKey.includes("context") || data.length > 50)) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-6 shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center mb-4 capitalize">
          <FileText className="mr-2 text-green-400" /> {sectionKey.replace(/_/g, " ")}
        </h3>
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{data}</p>
      </div>
    );
  }

  // Fallback for everything else
  return <FallbackSection sectionKey={sectionKey} data={data} />;
}
