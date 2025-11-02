"use client";
import React, { useState, useEffect } from "react";
import { Search, Bot, ChevronRight } from "lucide-react";
import Image from "next/image";
import bg_img from "../../../assets/images/bg_image.png";

const Hero = ({
  heroData,
  handleSearch,
  searchQuery,
  setSearchQuery,
  isLoading,
  activeIcon,
  setActiveIcon,
  isDropdownOpen,
  setIsDropdownOpen,
  searchOptions,
}) => {
  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        !event.target.closest(".search-dropdown-container")
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <section className="relative h-screen bg-cover bg-center bg-no-repeat overflow-hidden pt-20">
      {/* Background Image */}
      <Image
        src={bg_img}
        alt="Hero Background"
        className="absolute inset-0 w-full h-full object-cover"
        priority
      />

      {/* Overlay Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white max-w-6xl mx-auto px-4">
          {/* Main Heading */}
          <h1
            className="text-6xl md:text-8xl font-bold mb-3 tracking-wider leading-none font-cinzel-decorative drop-shadow-xl"
            style={{
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              letterSpacing: "0.1em",
            }}
          >
            Maha
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-green-400">
              rashtra
            </span>
          </h1>

          {/* Subtitle */}
          <h2
            className="text-2xl flex font-bold justify-end font-cinzel-decorative md:text-4xl mb-10 tracking-widest opacity-95"
            style={{
              textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
              letterSpacing: "0.2em",
            }}
          >
            {heroData.subtitle}
          </h2>

          {/* ✅ Search Bar with Dropdown */}
          <form
            onSubmit={handleSearch}
            className="relative max-w-4xl mx-auto mb-8 search-dropdown-container"
          >
            {/* Search Bar */}
            <div className="flex items-center bg-white w-full rounded-full shadow-2xl relative z-20">
              {/* Icon + Toggle */}
              <div className="flex items-center">
                <div
                  className="flex items-center gap-2 px-4 cursor-pointer hover:text-green-600 transition-colors py-2"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {activeIcon === "search" ? (
                    <Search className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Bot className="w-5 h-5 text-green-600" />
                  )}
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-[270deg]" : "rotate-90"
                    }`}
                  />
                </div>
              </div>

              {/* Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeIcon === "search"
                    ? "Search heritage sites..."
                    : "Ask AI about heritage sites..."
                }
                className="flex-1 px-4 py-4 text-gray-800 placeholder-gray-500 focus:outline-none"
                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                disabled={isLoading}
              />

              {/* Search Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 rounded-full hover:bg-green-700 text-white px-8 py-4 transition-colors duration-200 disabled:opacity-50 font-medium"
                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </div>

            {/* ✅ Dropdown (placed below bar, not inside) */}
            {isDropdownOpen && (
              <div className="absolute top-[calc(100%+0.5rem)] left-0 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-fadeIn">
                {searchOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      activeIcon === option.id
                        ? "text-green-600 bg-gray-50"
                        : "text-gray-600"
                    }`}
                    onClick={() => {
                      setActiveIcon(option.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div
                      className={
                        activeIcon === option.id
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      {option.icon}
                    </div>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Hero;
