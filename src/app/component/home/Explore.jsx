"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin as LocationIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import ImageModal from "../ImageModal";

const Explore = ({ featuredSites, heroData }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef(null);
    const navigate = useRouter();
    const slideWidth = 900;
    const gap = 0.1;



    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => handleNext(), 5000);
        return () => clearInterval(interval);
    }, [featuredSites?.length]);

    const handleNext = () => {
        setCurrentSlide((prev) => (prev + 1) % featuredSites.length);
    };

    const handlePrev = () => {
        setCurrentSlide(
            (prev) => (prev - 1 + featuredSites.length) % featuredSites.length
        );
    };

    const offset = currentSlide * (slideWidth + gap);

    if (!featuredSites || !heroData) {
        return null;
    }

    return (
        <section className=" w-full max-w-full h-screen mt-20 bg-gray-50 overflow-hidden">
            <div className="mx-auto px-24 text-center ">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 font-inter">
                    {heroData.tagline}
                </h2>
                <div className='flex justify-between gap-80'>
                    <div className="w-full h-0.5 bg-black/20 mx-auto mb-0"></div>
                    <div className="w-full h-0.5 bg-black/20 mx-auto mb-0"></div>
                </div>
                <p className="text-gray-600  max-w-2xl mx-auto leading-relaxed mt-0 font-inter">
                    {heroData.description}
                </p>
            </div>

            <div
                ref={containerRef}
                className=" w-full h-full overflow-hidden"
            >
                <div
                    className="flex items-center h-[83%] transition-transform duration-700 ease-in-out"
                    style={{
                        transform: `translateX(-${offset}px)`,
                        gap: `${gap}px`,
                        paddingLeft: `${(containerWidth - slideWidth) / 2}px`,
                        paddingRight: `${(containerWidth - slideWidth) / 2}px`,
                    }}
                >
                    {featuredSites.map((site, index) => {
                        const isActive = index === currentSlide;
                        const isPrevious = index === (currentSlide - 1 + featuredSites.length) % featuredSites.length;
                        const isNext = index === (currentSlide + 1) % featuredSites.length;

                        return (
                            <div
                                key={site.id}
                                className="relative cursor-pointer rounded-3xl overflow-hidden  shadow-2xs transition-all duration-700 ease-in-out"
                                style={{
                                    width: `${slideWidth}px`,
                                    height: "70vh",
                                    flexShrink: 0,
                                    transform: isActive ? "scale(1.05)" : isPrevious || isNext ? "scale(0.9)" : "scale(0.8)",
                                    zIndex: isActive ? 20 : isPrevious || isNext ? 15 : 10,
                                    opacity: isActive ? 1 : isPrevious || isNext ? 0.9 : 0.7,
                                }}
                                onClick={() => navigate.push(`/cave/${site.id}`)}
                            >
                                <div className="relative w-full h-full rounded-3xl">
                                    <div>
                                        <Image
                                            src={site.image}
                                            alt={site.name}
                                            fill
                                            priority={isActive}
                                            className="object-cover rounded-3xl"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
                                            <div>
                                                <h3 className="text-3xl font-extrabold text-white mb-1 tracking-wide">
                                                    {site.name}
                                                </h3>
                                                <p className="text-green-100 text-sm flex items-center">
                                                    <LocationIcon className="w-4 h-4 mr-2" />
                                                    {site.location}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="absolute bottom-8 right-8 flex gap-2 z-40">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                                aria-label="Previous"
                                                className=" border-green-300 hover:bg-green-800 hover:text-white -rotate-90 text-white rounded-full transition duration-300 cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
                                                    <g fill="#e6ffae">
                                                        <path d="m14.829 11.948l1.414-1.414L12 6.29l-4.243 4.243l1.415 1.414L11 10.12v7.537h2V10.12z" />
                                                        <path fill-rule="evenodd" d="M19.778 4.222c-4.296-4.296-11.26-4.296-15.556 0s-4.296 11.26 0 15.556s11.26 4.296 15.556 0s4.296-11.26 0-15.556m-1.414 1.414A9 9 0 1 0 5.636 18.364A9 9 0 0 0 18.364 5.636" clip-rule="evenodd" />
                                                    </g>
                                                </svg>
                                            </button>
                                            .                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                                aria-label="Next"
                                                className=" border-green-300 hover:bg-green-800 hover:text-white rotate-90 text-white rounded-full transition duration-300 cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
                                                    <g fill="#e6ffae">
                                                        <path d="m14.829 11.948l1.414-1.414L12 6.29l-4.243 4.243l1.415 1.414L11 10.12v7.537h2V10.12z" />
                                                        <path fill-rule="evenodd" d="M19.778 4.222c-4.296-4.296-11.26-4.296-15.556 0s-4.296 11.26 0 15.556s11.26 4.296 15.556 0s4.296-11.26 0-15.556m-1.414 1.414A9 9 0 1 0 5.636 18.364A9 9 0 0 0 18.364 5.636" clip-rule="evenodd" />
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