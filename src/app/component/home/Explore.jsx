"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  MapPin as LocationIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

const Explore = ({ heroData }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const [sites, setSites] = useState([]);
  const navigate = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 Responsive slide width
  const getSlideWidth = () => {
    if (typeof window === "undefined") return 900;
    if (window.innerWidth < 480) return window.innerWidth * 0.85; // mobile
    if (window.innerWidth < 768) return window.innerWidth * 0.75; // tablet
    if (window.innerWidth < 1024) return 650; // small laptop
    return 900; // desktop
  };

  const [slideWidth, setSlideWidth] = useState(getSlideWidth());
  const gap = 2;

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/sites/home");
        const data = await response.json();
        setSites(data);
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setSlideWidth(getSlideWidth());
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => handleNext(), 5000);
    return () => clearInterval(interval);
  }, [sites.length]);

  const handleNext = () => setCurrentSlide((prev) => (prev + 1) % sites.length);
  const handlePrev = () =>
    setCurrentSlide((prev) => (prev - 1 + sites.length) % sites.length);

  const offset = currentSlide * (slideWidth + gap);

  if (!sites || !heroData) return null;

  const handleLocationClick = (lat, lon) => {
    if (!lat || !lon) return alert("Location not available");
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, "_blank");
  };

  return (
    <section className="w-full max-w-full min-h-screen mt-12 md:mt-20 bg-gray-50 overflow-hidden">
      {/* Header */}
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 z-50 flex justify-center items-center">
          <Loading />
        </div>
      )}
      <div className="mx-auto px-6 sm:px-12 lg:px-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-800 font-inter mb-3">
          {heroData.tagline}
        </h2>

        <div className="flex justify-center gap-8 md:gap-80">
          <div className="w-20 md:w-full h-0.5 bg-black/20"></div>
          <div className="w-20 md:w-full h-0.5 bg-black/20"></div>
        </div>

        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4 font-inter text-sm md:text-base">
          {heroData.description}
        </p>
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        className="w-full h-[90vh] overflow-hidden mt-4 md:mt-6"
      >
        <div
          className="flex items-center transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${offset}px)`,
            gap: `${gap}px`,
            paddingLeft: `${(containerWidth - slideWidth) / 2}px`,
            paddingRight: `${(containerWidth - slideWidth) / 2}px`,
          }}
        >
          {sites.map((site, index) => {
            const isActive = index === currentSlide;
            const isPrevious =
              index === (currentSlide - 1 + sites.length) % sites.length;
            const isNext = index === (currentSlide + 1) % sites.length;

            return (
              <div
                key={site.site_id}
                className="relative cursor-pointer rounded-3xl overflow-hidden shadow-xl transition-all duration-700 ease-in-out"
                style={{
                  width: `${slideWidth}px`,
                  height: "70vh",
                  aspectRatio: "16/9",
                  flexShrink: 0,
                  transform: isActive ? "scale(1)" : "scale(0.85)",
                  zIndex: isActive ? 20 : 10,
                  opacity: isActive ? 1 : 0.75,
                }}
                onClick={() => navigate.push(`/cave/${site.site_id}`)}
              >
                <div className="relative w-full h-full rounded-3xl">
                  <Image
                    src={
                      site?.Gallary?.[0] && site.Gallary[0].startsWith("http")
                        ? site.Gallary[0]
                        : "/placeholder.svg"
                    }
                    alt={site.site_name}
                    fill
                    priority={isActive}
                    className="object-cover rounded-3xl"
                  />

                  {/* Gradient + Text */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4 md:p-6">
                    <h3 className="text-xl md:text-3xl font-extrabold text-white tracking-wide mb-1">
                      {site.site_name}
                    </h3>

                    <p
                      className="text-green-100 w-44 md:w-full text-xs md:text-sm flex items-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocationClick(
                          site.location.latitude,
                          site.location.longitude
                        );
                      }}
                    >
                      <LocationIcon className="w-6 h-6 mr-2" />
                      {site.location.district}, {site.location.state}
                    </p>
                  </div>

                  {/* Nav Buttons */}
                  {isActive && (
                    <div className="absolute bottom-6 right-6 flex gap-3 z-40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrev();
                        }}
                        aria-label="Next"
                        className="border-green-300 hover:bg-green-800 hover:text-white -rotate-90 text-white rounded-full transition duration-300 cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                        >
                          <g fill="#e6ffae">
                            <path d="m14.829 11.948l1.414-1.414L12 6.29l-4.243 4.243l1.415 1.414L11 10.12v7.537h2V10.12z" />
                            <path
                              fillRule="evenodd"
                              d="M19.778 4.222c-4.296-4.296-11.26-4.296-15.556 0s-4.296 11.26 0 15.556s11.26 4.296 15.556 0s4.296-11.26 0-15.556m-1.414 1.414A9 9 0 1 0 5.636 18.364A9 9 0 0 0 18.364 5.636"
                              clipRule="evenodd"
                            />
                          </g>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNext();
                        }}
                        aria-label="Next"
                        className="border-green-300 hover:bg-green-800 hover:text-white rotate-90 text-white rounded-full transition duration-300 cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                        >
                          <g fill="#e6ffae">
                            <path d="m14.829 11.948l1.414-1.414L12 6.29l-4.243 4.243l1.415 1.414L11 10.12v7.537h2V10.12z" />
                            <path
                              fillRule="evenodd"
                              d="M19.778 4.222c-4.296-4.296-11.26-4.296-15.556 0s-4.296 11.26 0 15.556s11.26 4.296 15.556 0s4.296-11.26 0-15.556m-1.414 1.414A9 9 0 1 0 5.636 18.364A9 9 0 0 0 18.364 5.636"
                              clipRule="evenodd"
                            />
                          </g>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Explore;
