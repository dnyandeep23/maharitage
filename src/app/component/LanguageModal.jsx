'use client';
import React, { useState, useEffect } from 'react';
import { Globe, X, Check, Sparkles } from 'lucide-react';

export default function LanguageModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [hoveredLang, setHoveredLang] = useState(null);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', icon: 'Aa', gradient: 'from-blue-500 to-purple-600' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: 'अ', gradient: 'from-orange-500 to-red-600' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', icon: 'म', gradient: 'from-green-500 to-emerald-600' },
  ];

  useEffect(() => {
    const openModal = () => setIsOpen(true);
    window.addEventListener('open-language-modal', openModal);
    return () => window.removeEventListener('open-language-modal', openModal);
  }, []);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    // @ts-ignore
    if (window.google && window.google.translate) {
      // @ts-ignore
      window.google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'google_translate_element');
      const teCombo = document.querySelector('.goog-te-combo');
      if (teCombo) {
        teCombo.value = langCode;
        teCombo.dispatchEvent(new Event('change'));
      }
    }
    setIsOpen(false);
  };


  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:rotate-12 group"
      >
        <Globe size={24} className="group-hover:rotate-180 transition-transform duration-500" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black bg-opacity-80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in border border-gray-200">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400 to-emerald-600 opacity-10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-400 to-purple-600 opacity-10 rounded-full blur-3xl translate-y-32 -translate-x-32"></div>
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 px-8 py-6 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent_50%)] animate-pulse-slow"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-md p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Globe className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    Choose Language
                    <Sparkles size={18} className="animate-pulse" />
                  </h2>
                  <p className="text-green-100 text-sm mt-0.5">Select your preferred language</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2.5 rounded-xl transition-all duration-300 hover:rotate-90 backdrop-blur-sm"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative p-8">
            {/* Language Cards */}
            <div className="space-y-4">
              {languages.map((lang, index) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  onMouseEnter={() => setHoveredLang(lang.code)}
                  onMouseLeave={() => setHoveredLang(null)}
                  className={`group relative w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                    selectedLanguage === lang.code
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-xl scale-105'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-lg hover:scale-102'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Animated background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${lang.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  {/* Selection indicator line */}
                  {selectedLanguage === lang.code && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-green-400 to-emerald-600 rounded-r-full animate-slide-in"></div>
                  )}
                  
                  <div className="relative flex items-center gap-5">
                    {/* Icon with gradient background */}
                    <div className={`relative rounded-2xl w-16 h-16 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      selectedLanguage === lang.code || hoveredLang === lang.code
                        ? `bg-gradient-to-br ${lang.gradient} shadow-lg scale-110`
                        : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <span className={`text-2xl font-bold transition-colors duration-300 ${
                        selectedLanguage === lang.code || hoveredLang === lang.code
                          ? 'text-white'
                          : 'text-gray-600'
                      }`}>
                        {lang.icon}
                      </span>
                      
                      {/* Pulse effect for selected */}
                      {selectedLanguage === lang.code && (
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${lang.gradient} animate-ping opacity-30`}></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className={`font-bold text-lg transition-colors duration-300 ${
                        selectedLanguage === lang.code ? 'text-green-700' : 'text-gray-800'
                      }`}>
                        {lang.name}
                      </div>
                      <div className={`text-base mt-0.5 transition-colors duration-300 ${
                        selectedLanguage === lang.code ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {lang.nativeName}
                      </div>
                    </div>
                    
                    {/* Checkmark with animation */}
                    <div className={`transition-all duration-300 ${
                      selectedLanguage === lang.code ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}>
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-2 shadow-lg">
                        <Check size={18} className="text-white" strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-semibold hover:scale-105 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // The language is already changed, so just close the modal
                  setIsOpen(false);
                }}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-2xl hover:scale-105 relative overflow-hidden group"
              >
                <span className="relative z-10">Apply Changes</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes slide-in {
          from {
            transform: scaleY(0);
          }
          to {
            transform: scaleY(1);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </>
  );
}
