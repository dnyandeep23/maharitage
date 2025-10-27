"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

const ImageModal = ({ images, selectedImage, onClose, onNext, onPrev }) => {
    const [zoom, setZoom] = useState(1);
    const [panning, setPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

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
    }, [selectedImage]);

    if (!selectedImage) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors"
                >
                    <X size={30} />
                </button>

                {/* Main Image */}
                <div
                    className="relative w-[80%] h-[80%] flex items-center justify-center"
                    onMouseDown={handleMouseDown}
                    style={{ cursor: zoom > 1 ? "move" : "default" }}
                >
                    <Image
                        src={selectedImage}
                        alt=""
                        fill
                        className="object-contain transition-transform duration-300"
                        style={{
                            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800 bg-opacity-50 rounded-full p-2">
                    <button onClick={handleZoomOut} className="text-white p-2 hover:bg-gray-700 rounded-full">
                        <ZoomOut size={24} />
                    </button>
                    <span className="text-white font-semibold">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} className="text-white p-2 hover:bg-gray-700 rounded-full">
                        <ZoomIn size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <button
                    onClick={onPrev}
                    className="cursor-pointer absolute left-5 top-1/2 -translate-y-1/2 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors"
                >
                    <ChevronLeft size={30} />
                </button>
                <button
                    onClick={onNext}
                    className="absolute cursor-pointer right-5 top-1/2 -translate-y-1/2 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors"
                >
                    <ChevronRight size={30} />
                </button>
            </div>
        </div>
    );
};

export default ImageModal;