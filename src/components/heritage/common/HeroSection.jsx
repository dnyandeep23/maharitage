"use client";

import React from "react";
import Image from "next/image";

export default function HeroSection({ site, theme = "common" }) {
  const isCave = theme === "cave";
  const isFort = theme === "fort";

  const titleFont = isCave ? "font-serif tracking-widest" : isFort ? "font-cinzel-decorative tracking-tight uppercase" : "font-sans font-extrabold";
  const bgOverlay = isCave ? "bg-[#2c261e]/80" : isFort ? "bg-[#1a202c]/80" : "bg-black/60";
  const borderStyle = isCave ? "border-b-4 border-[#8c7b65]" : isFort ? "border-b-4 border-yellow-700/50" : "border-b border-gray-700";
  const textGradient = isCave ? "from-[#e8dcc4] to-[#a38f72]" : isFort ? "from-yellow-200 to-yellow-600" : "from-white to-gray-400";

  return (
    <div className={`relative w-full h-[60vh] lg:h-[80vh] flex items-center justify-center overflow-hidden ${borderStyle}`}>
      {/* Background Image */}
      {site.gallery && site.gallery.length > 0 && (
        <Image
          src={site.gallery[0]}
          alt={site.site_name}
          fill
          priority
          className="object-cover object-center"
        />
      )}
      
      {/* Texture Overlay */}
      <div className={`absolute inset-0 ${bgOverlay} backdrop-blur-[2px] mix-blend-multiply`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <span className={`px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-sm border 
            ${isCave ? "bg-[#3e3527]/80 text-[#e8dcc4] border-[#8c7b65]" : isFort ? "bg-black/50 text-yellow-500 border-yellow-700" : "bg-white/10 text-white border-white/20"} backdrop-blur-md`}>
            {site.heritage_type || site.h_type || "Heritage"}
          </span>
          <span className={`px-4 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest rounded-sm border 
            ${isCave ? "bg-[#3e3527]/80 text-[#e8dcc4] border-[#8c7b65]" : isFort ? "bg-black/50 text-yellow-500 border-yellow-700" : "bg-white/10 text-white border-white/20"} backdrop-blur-md`}>
            {site.location?.district || "Maharashtra"}
          </span>
        </div>
        
        <h1 className={`text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-br ${textGradient} ${titleFont} drop-shadow-2xl`}>
          {site.site_name}
        </h1>
        
        {site.period && (
          <p className={`mt-6 text-lg md:text-2xl ${isCave ? "text-[#c2b49a] font-serif italic" : isFort ? "text-gray-300 font-medium tracking-wide" : "text-gray-300"}`}>
            {site.period}
          </p>
        )}
      </div>
    </div>
  );
}
