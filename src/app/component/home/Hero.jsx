"use client";
import React, { useEffect } from "react";
import { Search, Bot, ChevronRight, ArrowUpRight } from "lucide-react";
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
    <section className="relative min-h-[100svh] overflow-hidden bg-[#101b15] pt-24 sm:pt-28">
      <Image
        src={bg_img}
        alt="Hero Background"
        fill
        sizes="100vw"
        className="absolute inset-0 object-cover object-[center_44%] saturate-[1.08] contrast-[1.04]"
        priority
      />

      <div className="absolute inset-0 bg-linear-to-br from-[#101b15]/86 via-stone-950/30 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(217,193,138,0.18),transparent_28%),linear-gradient(275deg,rgba(18,51,39,0.2),transparent_38%)]" />
      <div className="absolute inset-0 bg-linear-to-t from-[#101b15]/78 via-stone-950/8 to-stone-950/22" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-[#f4ecdd] via-[#f4ecdd]/58 to-transparent" />

      <div className="relative z-10 flex min-h-[calc(100vh-6rem)] items-center">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-end gap-8 px-4 pb-24 pt-10 sm:gap-10 sm:px-8 sm:pb-16 lg:px-14">
          <div className="max-w-5xl text-white">
            <div className="mb-5 inline-flex items-center rounded-full border border-white/18 bg-white/10 px-3.5 py-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-amber-50/88 shadow-[0_12px_40px_rgba(12,10,9,0.18)] backdrop-blur-md sm:mb-6 sm:px-4 sm:text-xs sm:tracking-[0.28em]">
              Digital Heritage Archive
            </div>
            <h1
              className="font-cinzel-decorative text-[3.15rem] font-bold leading-[0.95] tracking-normal text-white drop-shadow-2xl min-[380px]:text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
              style={{
                textShadow: "0 8px 34px rgba(0,0,0,0.42)",
              }}
            >
              Maha
              <span className="text-[#d2ba7d]">
                rashtra
              </span>
            </h1>

            <h2
              className="mt-4 font-cinzel-decorative text-lg font-bold uppercase tracking-[0.22em] text-amber-50/90 sm:text-2xl sm:tracking-[0.36em] md:text-4xl"
              style={{
                textShadow: "0 5px 24px rgba(0,0,0,0.36)",
              }}
            >
              {heroData.subtitle}
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82 sm:mt-6 sm:text-lg">
              A cinematic record of forts, caves, inscriptions, architecture, and cultural memory across Maharashtra.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="relative w-full max-w-4xl search-dropdown-container"
          >
            <div
              className="relative z-20 flex w-full flex-col items-stretch rounded-[1.35rem] border border-white/36 bg-[#f7f0e4]/92 p-2 shadow-[0_30px_100px_rgba(12,10,9,0.34)] ring-1 ring-white/55 backdrop-blur-2xl transition focus-within:bg-[#fffaf0] sm:flex-row sm:items-center sm:rounded-full sm:pl-3"
            >
              <div
                className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-2 pr-2 text-[#263a2d]/70 transition-colors hover:text-[#263a2d] sm:pr-4"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {activeIcon === "search" ? (
                  <Search className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5 text-[#566044]" />
                )}

                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-200 
        ${isDropdownOpen ? "rotate-270" : "rotate-90"}`}
                />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeIcon === "search"
                    ? "Search forts, caves, inscriptions..."
                    : "Ask for context, period, or site history..."
                }
                className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-base text-stone-900 placeholder-stone-500 focus:outline-none sm:px-3"
                disabled={isLoading}
                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#263a2d] px-4 py-2 text-sm font-semibold whitespace-nowrap text-[#f7f0e4] transition-colors duration-200 hover:bg-[#101b15] disabled:opacity-50 sm:m-1.5 sm:mt-1.5 sm:px-6 sm:py-3 sm:text-base"
                style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
              >
                {isLoading ? "Searching" : "Explore"}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            {isDropdownOpen && (
              <div
                className="absolute top-[calc(100%+0.6rem)] left-0 z-50 w-full animate-fadeIn rounded-2xl border border-stone-200/80 bg-[#fffaf0]/96 py-2 shadow-2xl backdrop-blur-xl sm:left-0 sm:w-52"
              >
                {searchOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[#eadcc4] 
                     ${
                       activeIcon === option.id
                         ? "bg-[#eadcc4] text-[#263a2d]"
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
                          ? "text-[#566044]"
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
