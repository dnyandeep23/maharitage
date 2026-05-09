"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Languages, BookOpen } from "lucide-react";

export default function InscriptionsSection({ inscriptions }) {
  const [selectedInscription, setSelectedInscription] = useState(null);

  if (!inscriptions || inscriptions.length === 0) return null;

  return (
    <div className="py-16 bg-[#e8dcc4]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center mb-10">
          <BookOpen className="w-8 h-8 mr-4 text-[#8c7b65]" />
          <h2 className="text-4xl font-serif font-bold text-[#3e3527]">Epigraphy & Inscriptions</h2>
        </div>

        {selectedInscription ? (
          <InscriptionViewer 
            inscription={selectedInscription} 
            onBack={() => setSelectedInscription(null)} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inscriptions.map((inscription, idx) => (
              <div 
                key={idx}
                className="bg-[#efeadd] border border-[#d8d0bd] rounded-sm overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
                onClick={() => setSelectedInscription(inscription)}
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img 
                    src={inscription.image_urls?.[0] || "https://via.placeholder.com/400x300?text=No+Image"} 
                    alt={`Inscription ${inscription.inscription_id}`}
                    className="w-full h-full object-cover sepia-[0.3] group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2c261e]/80 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-[#e8dcc4] font-serif font-bold text-xl tracking-wide">
                    {inscription.inscription_id?.replace(/_/g, " ") || `Inscription ${idx + 1}`}
                  </h3>
                </div>
                <div className="p-5">
                  <p className="text-[#5c4f3c] text-sm font-serif line-clamp-3 leading-relaxed">
                    {inscription.description}
                  </p>
                  <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-wider text-[#8c7b65]">
                    {inscription.original_script && <span>{inscription.original_script}</span>}
                    {inscription.language_detected && <span>• {inscription.language_detected}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InscriptionViewer({ inscription, onBack }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [language, setLanguage] = useState("en");
  const [translatedDescription, setTranslatedDescription] = useState({
    en: inscription.description,
    mr: "भाषांतर चालू आहे...",
  });

  const nextImage = () => {
    if (inscription.image_urls && currentImage < inscription.image_urls.length - 1) {
      setCurrentImage(currentImage + 1);
    }
  };

  const prevImage = () => {
    if (currentImage > 0) {
      setCurrentImage(currentImage - 1);
    }
  };

  useEffect(() => {
    const runTranslation = async () => {
      if (inscription?.description) {
        try {
          // Standard fetch for external API, no internal token needed
          const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=mr&dt=t&q=${encodeURIComponent(
              inscription.description
            )}`
          );

          if (!response.ok) throw new Error("Translation failed");

          const data = await response.json();
          const translatedText = data?.[0]?.map((item) => item[0]).join(" ");

          setTranslatedDescription({
            en: inscription.description,
            mr: translatedText || "⚠️ भाषांतर उपलब्ध नाही.",
          });
        } catch (error) {
          console.error("Google Translation Error:", error);
          setTranslatedDescription({
            en: inscription.description,
            mr: "⚠️ भाषांतर करण्यात अडचण आली.",
          });
        }
      }
    };
    runTranslation();
  }, [inscription]);

  return (
    <div className="bg-[#efeadd] border border-[#d8d0bd] rounded-sm p-6 lg:p-10 shadow-lg animate-fadeIn">
      <button 
        onClick={onBack}
        className="text-[#8c7b65] hover:text-[#5c4f3c] font-bold uppercase tracking-widest text-sm flex items-center mb-8 transition-colors"
      >
        <ChevronLeft size={16} className="mr-1" /> Back to Inscriptions
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Image Gallery */}
        <div className="lg:col-span-2 space-y-4 relative">
          <div className="aspect-[3/4] relative rounded-sm overflow-hidden border border-[#d8d0bd] shadow-inner bg-[#d8d0bd]/30">
            {inscription.image_urls && inscription.image_urls.length > 0 ? (
              <img 
                src={inscription.image_urls[currentImage]} 
                alt={`Inscription detail ${currentImage + 1}`}
                className="w-full h-full object-cover sepia-[0.2]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8c7b65] font-serif">No Image Available</div>
            )}
            
            {inscription.image_urls && inscription.image_urls.length > 1 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                <button 
                  onClick={prevImage} 
                  disabled={currentImage === 0}
                  className="bg-[#2c261e]/80 text-[#e8dcc4] p-2 rounded-full disabled:opacity-0 pointer-events-auto transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage} 
                  disabled={currentImage === inscription.image_urls.length - 1}
                  className="bg-[#2c261e]/80 text-[#e8dcc4] p-2 rounded-full disabled:opacity-0 pointer-events-auto transition-opacity"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </div>
          {inscription.image_urls && inscription.image_urls.length > 1 && (
            <div className="text-center text-[#8c7b65] font-mono text-sm tracking-widest">
              {currentImage + 1} / {inscription.image_urls.length}
            </div>
          )}
        </div>

        {/* Details & Translation */}
        <div className="lg:col-span-3">
          <h3 className="text-3xl lg:text-5xl font-serif font-bold text-[#3e3527] mb-6">
            {inscription.inscription_id?.replace(/_/g, " ")}
          </h3>

          <div className="flex gap-8 mb-10 pb-6 border-b border-[#d8d0bd]">
            {inscription.original_script && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8c7b65] mb-1">Script</p>
                <p className="text-lg text-[#5c4f3c] font-serif">{inscription.original_script}</p>
              </div>
            )}
            {inscription.language_detected && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8c7b65] mb-1">Language</p>
                <p className="text-lg text-[#5c4f3c] font-serif">{inscription.language_detected}</p>
              </div>
            )}
          </div>

          <div className="bg-[#f5f2eb] rounded-sm p-6 lg:p-8 border border-[#e8dcc4] shadow-inner">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-[#8c7b65]">
                <Languages size={20} className="mr-2" />
                <span className="font-bold uppercase tracking-widest text-xs">Translation</span>
              </div>
              <div className="flex bg-[#e8dcc4] p-1 rounded-sm">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${
                    language === "en" ? "bg-[#3e3527] text-[#e8dcc4] shadow-sm" : "text-[#8c7b65] hover:text-[#5c4f3c]"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("mr")}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${
                    language === "mr" ? "bg-[#3e3527] text-[#e8dcc4] shadow-sm" : "text-[#8c7b65] hover:text-[#5c4f3c]"
                  }`}
                >
                  Marathi
                </button>
              </div>
            </div>

            <p className="text-lg lg:text-xl text-[#3e3527] font-serif leading-loose text-justify">
              {translatedDescription[language]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
