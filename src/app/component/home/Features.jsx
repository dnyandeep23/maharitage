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
        <section className="py-16 bg-white">
            <div className=" mx-auto px-4 sm:px-6 lg:px-8"> <div className="mx-auto px-24 text-center ">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 font-inter">
                    Features
                </h2>
                <div className='flex justify-between gap-80'>
                    <div className="w-full h-0.5 bg-black/20 mx-auto mb-0"></div>
                    <div className="w-full h-0.5 bg-black/20 mx-auto mb-0"></div>
                </div>
                <p className="text-gray-600  max-w-2xl mx-auto leading-relaxed mt-2 text-base">
                    Immerse yourself in Maharashtra's heritage through our carefully
                    curated collection of historic sites and cultural stories.
                </p>
            </div>


                <div className="grid md:grid-cols-2 lg:grid-cols-2 py-16 gap-8 align-middle items-center mx-40">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="text-center p-8 rounded-xl bg-gradient-to-bl from-white to-green-50 transition-all duration-300 bg-white border border-gray-100"
                        >
                            <div className="text-green-600 mb-6 flex justify-center">
                                {feature.icon}
                            </div>
                            <h3
                                className="text-4xl font-bold text-[#185602] mb-4"
                            >
                                {feature.title}
                            </h3>
                            <p
                                className="text-[#175002] w-80 m-auto text-center text-base leading-relaxed"

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
