"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function GallerySection({ gallery, theme = "common" }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!gallery || gallery.length === 0) return null;

  const isCave = theme === "cave";
  const isFort = theme === "fort";

  const sectionBg = isCave ? "bg-[#efeadd]" : isFort ? "bg-[#1f2937]" : "bg-white/5";
  const textColor = isCave ? "text-[#3e3527]" : isFort ? "text-gray-100" : "text-white";
  const gridBorder = isCave ? "border-[#8c7b65]" : isFort ? "border-gray-600" : "border-white/10";
  const titleFont = isCave ? "font-serif text-3xl" : isFort ? "font-sans uppercase tracking-wider text-2xl" : "font-sans text-2xl";

  const handleOpen = (index) => {
    setCurrentIndex(index);
    setSelectedImage(gallery[index]);
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const nextIndex = (currentIndex + 1) % gallery.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(gallery[nextIndex]);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const prevIndex = (currentIndex - 1 + gallery.length) % gallery.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(gallery[prevIndex]);
  };

  return (
    <div className={`py-12 ${sectionBg}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className={`font-bold mb-8 ${textColor} ${titleFont} border-b ${gridBorder} pb-4`}>
          Gallery
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((url, index) => (
            <div 
              key={index} 
              className={`relative aspect-[4/3] overflow-hidden rounded-md cursor-pointer group shadow-sm border ${gridBorder}`}
              onClick={() => handleOpen(index)}
            >
              <img 
                src={url} 
                alt={`Gallery image ${index + 1}`} 
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isCave ? "sepia-[0.2]" : isFort ? "contrast-125" : ""}`}
                onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found"; }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={handleClose}>
          <button onClick={handleClose} className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors">
            <X size={36} />
          </button>
          
          <button onClick={handlePrev} className="absolute left-6 text-white/50 hover:text-white transition-colors p-2">
            <ChevronLeft size={48} />
          </button>

          <img 
            src={selectedImage} 
            alt="Enlarged view" 
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />

          <button onClick={handleNext} className="absolute right-6 text-white/50 hover:text-white transition-colors p-2">
            <ChevronRight size={48} />
          </button>
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 font-mono text-sm">
            {currentIndex + 1} / {gallery.length}
          </div>
        </div>
      )}
    </div>
  );
}
