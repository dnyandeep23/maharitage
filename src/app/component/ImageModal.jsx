"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const ImageModal = ({ images, selectedImage, onClose, onNext, onPrev }) => {
    const [zoom, setZoom] = useState(1);
    const [panning, setPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 1));

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        if (panning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setPanning(false);
    };

    useEffect(() => {
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setIsLoaded(false);
    }, [selectedImage]);

    if (!selectedImage) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-4 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
            <motion.div
                className="relative flex h-full w-full items-center justify-center"
                initial={{ opacity: 0, scale: 0.96, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 18 }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            >
                <button
                    onClick={onClose}
                    aria-label="Close image viewer"
                    className="absolute right-4 top-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur transition hover:bg-white hover:text-stone-950"
                >
                    <X size={24} />
                </button>

                <div
                    className="relative flex h-[88vh] w-full max-w-7xl items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-2xl"
                    onMouseDown={handleMouseDown}
                    style={{ cursor: zoom > 1 ? "move" : "default" }}
                >
                    <div
                        className={`absolute inset-0 bg-linear-to-r from-stone-900 via-stone-800 to-stone-900 transition-opacity duration-500 ${
                            isLoaded ? "opacity-0" : "animate-pulse opacity-100"
                        }`}
                    />
                    <Image
                        src={selectedImage}
                        alt=""
                        fill
                        sizes="100vw"
                        className={`object-contain transition duration-500 ${
                            isLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        onLoad={() => setIsLoaded(true)}
                        style={{
                            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                        }}
                    />
                </div>

                <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-white/10 p-2 text-white shadow-2xl backdrop-blur-md">
                    <button onClick={handleZoomOut} aria-label="Zoom out" className="rounded-full p-2 transition hover:bg-white hover:text-stone-950">
                        <ZoomOut size={22} />
                    </button>
                    <span className="min-w-14 text-center text-sm font-semibold">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} aria-label="Zoom in" className="rounded-full p-2 transition hover:bg-white hover:text-stone-950">
                        <ZoomIn size={22} />
                    </button>
                </div>

                <button
                    onClick={onPrev}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur transition hover:bg-white hover:text-stone-950"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={onNext}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-2xl backdrop-blur transition hover:bg-white hover:text-stone-950"
                >
                    <ChevronRight size={24} />
                </button>
            </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageModal;
