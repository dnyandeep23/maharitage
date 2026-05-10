"use client";
import React from 'react';
import Location from '../../../assets/images/features_location.png'
import Code from '../../../assets/images/features_code.png'
import Communities from '../../../assets/images/features_communities.png'
import Camera from '../../../assets/images/features_camera.png'
import Image from 'next/image';
const Features = () => {
    const features = [
        {
            icon: <Image src={Code} alt="Code" className="w-34 h-34" />,
            title: "Digital Archive",
            description: "Access a curated collection of historical data, cave documentation, and digital resources preserved for future generations."
        },
        {
            icon: <Image src={Location} alt="Location" className="w-34 h-34" />,
            title: "Discover Historic Places",
            description: "Discover Maharashtra's ancient caves, monuments, and historic cultural treasures with guided maps and detailed information."
        },
        {
            icon: <Image src={Communities} alt="Culture" className="w-34 h-34" />,
            title: "Cultural Exchange",
            description: "Join our vibrant heritage community, contributions, and cultural data that preserve heritage for future generations."
        },
        {
            icon: <Image src={Camera} alt="camera" className="w-34 h-34" />,
            title: "Verified Visuals",
            description: "All images are sourced responsibly, hand with permission, and backed by comprehensive documentation for authenticity."
        }
    ];

    return (
        <section className="cinematic-section py-20 md:py-28">
            <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-14">
                <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div className="max-w-3xl">
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8a6a31]">
                        Archive Method
                    </p>
                    <h2 className="mt-3 font-cinzel-decorative text-4xl font-bold leading-tight text-[#123327] md:text-6xl">
                        Cultural records with visual depth
                    </h2>
                </div>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-700 md:text-base">
                        MahaRitage brings site photography, geography, inscriptions, and scholarly references into one coherent preservation experience.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 py-14 md:grid-cols-2">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="museum-card-premium group p-7 transition duration-300 hover:-translate-y-1"
                        >
                            <div className="relative z-10 mb-8 flex justify-start opacity-90 transition duration-300 group-hover:opacity-100">
                                {feature.icon}
                            </div>
                            <h3
                                className="relative z-10 mb-4 font-cinzel-decorative text-2xl font-bold text-[#123327] md:text-3xl"
                            >
                                {feature.title}
                            </h3>
                            <p
                                className="relative z-10 max-w-xl text-left text-base leading-7 text-stone-700"

                            >
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Features;
