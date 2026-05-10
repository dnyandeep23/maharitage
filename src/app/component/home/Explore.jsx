"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MapPin as LocationIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";
import { fetchWithInternalToken } from "../../../lib/fetch";
import ajantaSlide from "../../../assets/images/agenta_slide.png";
import elephantaSlide from "../../../assets/images/elephanta_slide.png";
import heroArchiveImage from "../../../assets/images/bg_image.png";

const fallbackSites = [
  {
    site_id: "Aja0003",
    site_name: "Ajanta Caves",
    heritage_type: "Cave Archive",
    gallery: [ajantaSlide],
    location: {
      district: "Aurangabad",
      state: "Maharashtra",
    },
    isFallback: true,
  },
  {
    site_id: "Ell0001",
    site_name: "Ellora Caves",
    heritage_type: "Rock-cut Complex",
    gallery: [heroArchiveImage],
    location: {
      district: "Aurangabad",
      state: "Maharashtra",
    },
    isFallback: true,
  },
  {
    site_id: "Ele0002",
    site_name: "Elephanta Caves",
    heritage_type: "Island Cave Archive",
    gallery: [elephantaSlide],
    location: {
      district: "Mumbai",
      state: "Maharashtra",
    },
    isFallback: true,
  },
];

const Explore = ({ heroData }) => {
  const scrollerRef = useRef(null);
  const [sites, setSites] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useRouter();

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setIsLoading(true);
        const response = await fetchWithInternalToken("/api/sites/home");
        const data = await response.json();
        setSites(Array.isArray(data) && data.length ? data : fallbackSites);
      } catch (e) {
        setSites(fallbackSites);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSites();
  }, []);

  const scrollByCard = (direction) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector("[data-archive-card]");
    const distance = card
      ? card.getBoundingClientRect().width + 24
      : scroller.clientWidth * 0.82;
    scroller.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  useEffect(() => {
    if (!sites.length) return undefined;
    const interval = setInterval(() => scrollByCard(1), 6500);
    return () => clearInterval(interval);
  }, [sites.length]);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = Array.from(scroller.querySelectorAll("[data-archive-card]"));
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    const nearest = cards.reduce(
      (best, card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(center - cardCenter);
        return distance < best.distance ? { index, distance } : best;
      },
      { index: 0, distance: Infinity }
    );
    setActiveIndex(nearest.index);
  };

  const handleWheel = (event) => {
    const scroller = scrollerRef.current;
    if (!scroller || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    event.preventDefault();
    scroller.scrollLeft += event.deltaY;
  };

  if (!sites || !heroData) return null;

  const handleLocationClick = (lat, lon) => {
    if (!lat || !lon) return alert("Location not available");
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, "_blank");
  };

  return (
    <section className="heritage-surface heritage-texture w-full max-w-full overflow-hidden py-14 md:py-28">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fbf7ee]/80 backdrop-blur-sm">
          <Loading />
        </div>
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-8 lg:px-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#8f7244] sm:text-xs sm:tracking-[0.28em]">
              Curated Sites
            </p>
            <h2 className="mt-3 max-w-3xl font-cinzel-decorative text-3xl font-bold leading-tight text-[#263a2d] md:text-5xl">
              {heroData.tagline}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-700 md:text-base">
              {heroData.description} across an evolving archive of landscapes, inscriptions, and built memory.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#263a2d]/20 bg-[#f7f0e4]/80 text-[#263a2d] shadow-sm backdrop-blur transition hover:bg-[#263a2d] hover:text-[#f7f0e4]"
              aria-label="Previous heritage site"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#263a2d]/20 bg-[#f7f0e4]/80 text-[#263a2d] shadow-sm backdrop-blur transition hover:bg-[#263a2d] hover:text-[#f7f0e4]"
              aria-label="Next heritage site"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="archive-scroll mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-7 sm:mt-10 sm:gap-6 sm:px-[max(1.25rem,calc((100vw-80rem)/2+3.5rem))]"
      >
        {sites.map((site, index) => {
          const isActive = index === activeIndex;
          const imageUrl = site?.gallery?.[0] || site?.gallary?.[0] || "";

          return (
            <button
              type="button"
              data-archive-card
              key={site.site_id}
              className={`touch-card group relative h-[420px] w-[86vw] max-w-[900px] shrink-0 snap-center overflow-hidden rounded-[1.35rem] text-left shadow-[0_28px_80px_rgba(21,18,13,0.18)] transition-[opacity,transform,box-shadow] duration-500 ease-out sm:h-[470px] sm:rounded-[2rem] md:h-[620px] md:w-[72vw] lg:w-[820px] ${
                isActive
                  ? "opacity-100 shadow-[0_34px_100px_rgba(21,18,13,0.24)]"
                  : "opacity-80 hover:opacity-95"
              }`}
              onClick={() => navigate.push(`/heritage/${site.site_id}`)}
            >
              <Image
                src={
                  typeof imageUrl === "string"
                    ? imageUrl.startsWith("http")
                      ? imageUrl
                      : "/placeholder.svg"
                    : imageUrl || "/placeholder.svg"
                }
                alt={site.site_name}
                fill
                priority={index < 2}
                sizes="(max-width: 768px) 82vw, (max-width: 1280px) 72vw, 820px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
              />

              <div className="absolute inset-0 bg-linear-to-t from-black/88 via-black/22 to-transparent" />
              <div className="absolute inset-0 ring-1 ring-white/16" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 text-white md:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-50 backdrop-blur sm:text-[0.65rem] sm:tracking-[0.2em]">
                    Plate {index + 1}
                  </span>
                  <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/78 backdrop-blur sm:text-[0.65rem] sm:tracking-[0.2em]">
                    {site.heritage_type || site.h_type || "Heritage Site"}
                  </span>
                  {site.isFallback && (
                    <span className="rounded-full border border-[#d2ba7d]/25 bg-[#d2ba7d]/18 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-amber-50 backdrop-blur sm:text-[0.65rem] sm:tracking-[0.2em]">
                      Featured
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h3 className="font-cinzel-decorative text-2xl font-bold leading-tight tracking-normal text-white md:text-4xl">
                      {site.site_name}
                    </h3>

                    <p
                      className="mt-3 inline-flex items-center text-xs font-semibold uppercase tracking-[0.14em] text-amber-50/88 md:text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLocationClick(
                          site.location?.latitude,
                          site.location?.longitude
                        );
                      }}
                    >
                      <LocationIcon className="mr-2 h-4 w-4" />
                      {site.location?.district}, {site.location?.state}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/12 text-white backdrop-blur transition group-hover:bg-[#f7f0e4] group-hover:text-[#263a2d]">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-2 flex max-w-7xl justify-center gap-2 px-4 sm:px-8 lg:px-14">
        {sites.map((site, index) => (
          <button
            key={site.site_id}
            type="button"
            aria-label={`Go to ${site.site_name}`}
            onClick={() => {
              const card = scrollerRef.current?.querySelectorAll("[data-archive-card]")?.[index];
              card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? "w-10 bg-[#263a2d]" : "w-2.5 bg-[#263a2d]/24"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Explore;
