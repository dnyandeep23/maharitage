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
    <section className="relative min-h-screen overflow-hidden bg-stone-950 pt-24 sm:pt-28">
      {/* Background Image */}
      <Image
        src={bg_img}
        alt="Hero Background"
        fill
        sizes="100vw"
        className="absolute inset-0 object-cover object-[center_44%] saturate-[1.08] contrast-[1.04]"
        priority
      />

      {/* Cinematic heritage-grade image treatment */}
      <div className="absolute inset-0 bg-linear-to-br from-stone-950/70 via-stone-950/24 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_28%,rgba(245,158,11,0.22),transparent_34%),radial-gradient(circle_at_82%_52%,rgba(22,101,52,0.18),transparent_34%)]" />
      <div className="absolute inset-0 bg-linear-to-t from-stone-950/72 via-stone-950/8 to-stone-950/18" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-white via-white/55 to-transparent" />

      {/* Overlay Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-6rem)] items-center">
        <div className="mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-14">
          {/* Main Heading */}
          <div className="max-w-5xl text-white">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-white/85 shadow-[0_12px_40px_rgba(12,10,9,0.18)] backdrop-blur-md">
              Digital Heritage Archive
            </div>
            <h1
              className="font-cinzel-decorative text-5xl font-bold leading-[0.92] tracking-normal drop-shadow-2xl sm:text-7xl md:text-8xl lg:text-9xl"
              style={{
                textShadow: "0 8px 34px rgba(0,0,0,0.42)",
              }}
            >
              Maha
              <span className="text-[#d8f2d3]">
                rashtra
              </span>
            </h1>

            {/* Subtitle */}
            <h2
              className="mt-4 font-cinzel-decorative text-xl font-bold uppercase tracking-[0.36em] text-amber-50/90 sm:text-2xl md:text-4xl"
              style={{
                textShadow: "0 5px 24px rgba(0,0,0,0.36)",
              }}
            >
              {heroData.subtitle}
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
              Explore Maharashtra through forts, caves, inscriptions, architecture, and living cultural memory.
            </p>
          </div>

          {/* ✅ Search Bar with Dropdown */}
          <form
            onSubmit={handleSearch}
            className="relative w-full max-w-3xl search-dropdown-container lg:justify-self-end"
          >
            <div className="mb-4 rounded-[2rem] border border-white/18 bg-white/10 p-4 text-white shadow-[0_24px_80px_rgba(12,10,9,0.28)] backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/62">
                Begin Exploring
              </p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                Search verified heritage sites or ask the AI guide for context.
              </p>
            </div>
            {/* Search Wrapper */}
            <div
              className="relative z-20 flex w-full items-center rounded-full border border-white/35 bg-white/92 pl-3 shadow-[0_22px_70px_rgba(12,10,9,0.24)] ring-1 ring-white/60 backdrop-blur-xl transition focus-within:bg-white"
            >
              {/* Icon Toggle */}
              <div
                className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-2 pr-2 text-stone-500 transition-colors hover:text-green-700 sm:pr-4"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {activeIcon === "search" ? (
                  <Search className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5 text-green-700" />
                )}

                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-200 
        ${isDropdownOpen ? "rotate-270" : "rotate-90"}`}
                />
              </div>

              {/* Input Field */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeIcon === "search"
                    ? "Search heritage sites..."
                    : "Ask AI about heritage sites..."
                }
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-stone-900 placeholder-stone-500 focus:outline-none sm:px-3 sm:text-base"
                disabled={isLoading}
                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
              />

              {/* Search Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-green-800 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition-colors duration-200 hover:bg-green-900 disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div
                className="absolute top-[calc(100%+0.6rem)] left-3 z-50 w-48 animate-fadeIn rounded-2xl border border-stone-200 bg-white/96 py-2 shadow-2xl backdrop-blur-xl sm:left-0"
              >
                {searchOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-stone-50 
                     ${
                       activeIcon === option.id
                         ? "bg-stone-50 text-green-700"
                         : "text-stone-600"
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
