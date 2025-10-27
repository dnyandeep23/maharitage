'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image';
import img from '../../../assets/images/elephanta_slide.png'
import Header from '../../component/Header';
import Footer from '../../component/Footer';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageModal from '../../component/ImageModal';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import AIFloatingButton from '../../component/AIFloatingButton';

function cave() {
    const { user } = useAuth();
    const [current, setCurrent] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleImageClick = (img) => {
        setSelectedImage(img);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedImage(null);
    };

    const handleNextImage = () => {
        const currentIndex = images.findIndex(img => img === selectedImage);
        const nextIndex = (currentIndex + 1) % images.length;
        setSelectedImage(images[nextIndex]);
    };

    const handlePrevImage = () => {
        const currentIndex = images.findIndex(img => img === selectedImage);
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setSelectedImage(images[prevIndex]);
    };

    const nextSlide = () => {
        if (current < images.length - 2) setCurrent(current + 1);
    };

    const prevSlide = () => {
        if (current > 0) setCurrent(current - 1);
    };

    const images = [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=600&h=400&fit=crop"
    ];
    return (
        <div className=' w-full h-full text-black bg-green-50'>
            <div className=''>
                <Header />
            </div>
            <div className='relative w-screen h-[85vh]'>
                <Image src={img} alt="elephanta" className='object-fill w-full h-full rounded-b-[155px] ' />
                <div className='w-full h-full z-10 absolute top-0 right-0 bg-black/40 rounded-b-[155px]'></div>
                <div className='w-full h-full z-20 absolute top-0 right-0 flex justify-center items-center'>
                    <h1 className='text-9xl font-extrabold text-stroke  uppercase' style={{ fontfamily: "Inter" }}>Elephanta</h1>
                </div>

            </div>
            <div className='mt-20 mx-10 md:mx-28'>
                <div>
                    <p className='text-3xl mx-6 font-bold'>Explore Elephanta Gallery</p>
                    <div className="mt-4">
                        {/* Slider container */}
                        {isClient && <div className="overflow-hidden">
                            <div
                                className="flex transition-transform duration-700 ease-in-out"
                                style={{ transform: `translateX(-${current * 50}%)` }}
                            >
                                {images.map((img, index) => (
                                    <div
                                        className="w-1/3 h-80 flex-shrink-0 mx-4 relative group cursor-pointer"
                                        onClick={() => handleImageClick(img)}
                                        key={index}
                                    >
                                        {/* Image */}
                                        <img
                                            src={img}
                                            alt={`Gallery ${index}`}
                                            className="w-full h-full object-cover rounded-2xl bg-gray-300"
                                        />

                                        {/* Sliding hover overlay */}
                                        <div className="absolute bottom-0  left-0 w-full h-full rounded-2xl bg-black/30 flex items-end justify-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                            <span className="text-white  p-4 text-xl font-semibold">Expand</span>
                                        </div>
                                    </div>


                                ))}
                            </div>
                        </div>}

                        {/* Bottom right buttons */}
                        <div className="flex justify-end mt-2 gap-2">
                            <button
                                onClick={prevSlide}
                                className="bg-transparent border px-6 cursor-pointer hover:border-lime-200 transition-all ease-in-out duration-700 hover:bg-lime-200 p-2 rounded-full shadow-md"
                            >
                                <ChevronLeft />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="bg-transparent border px-6 cursor-pointer hover:border-lime-200 transition-all ease-in-out duration-700 hover:bg-lime-200 p-2 rounded-full shadow-md"
                            >
                                <ChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
                <div className='mt-10 mx-6'>
                    <p className='text-3xl font-bold'>Info.</p>
                    <div className='mt-6 text-lg flex flex-col gap-8'>

                        <p>
                            The <b>Elephanta Caves</b>, located on <b>Elephanta Island</b> in Mumbai Harbour, are among the most remarkable examples of India’s ancient rock-cut architecture. Carved between the <b>5th and 8th centuries CE</b>, these caves primarily honor <b>Lord Shiva</b> and showcase the exceptional craftsmanship of early Indian artisans. Originally known as <i>Gharapuri</i>, meaning “city of caves,” the island was later renamed by Portuguese explorers who discovered a large stone elephant sculpture near its shores. The caves consist of multiple rock-cut chambers adorned with intricate carvings, detailed pillars, and sculptural panels depicting mythological stories and divine forms.
                        </p>

                        <p>
                            The centerpiece of the caves is the magnificent <b>Trimurti Sadashiva</b> — a three-headed figure symbolizing Shiva in his roles as the Creator, Preserver, and Destroyer. This monumental sculpture, carved from a single rock, embodies the profound spiritual and philosophical depth of Hindu belief. Each chamber of the cave tells a story through its reliefs — from Shiva’s cosmic dance as <i>Nataraja</i> to his union with <i>Parvati</i> in <i>Ardhanarishvara</i>. These depictions reveal not only the religious devotion of their creators but also their deep understanding of balance, divinity, and artistry.
                        </p>

                        <p>
                            Over centuries, the <b>Elephanta Caves</b> have endured natural decay and foreign invasions, yet their essence remains untouched. In 1987, the site was declared a <b>UNESCO World Heritage Site</b>, recognizing its cultural and architectural significance. Today, visitors reach the island via a scenic ferry ride from the <b>Gateway of India</b> in Mumbai. As one walks through the cool, shadowed corridors, the rhythmic sound of footsteps and the faint aroma of stone evoke a sense of timelessness and reverence, transporting every visitor to an era of spiritual grandeur.
                        </p>

                        <p>
                            Beyond their spiritual and artistic beauty, the caves stand as a living connection between India’s past and present. They remind us of an age when devotion and creativity coexisted harmoniously. Surrounded by lush greenery and the sound of waves, the island offers not just a glimpse into history but also a place for introspection and peace. The <b>Elephanta Caves</b> continue to inspire artists, historians, and travelers alike, symbolizing India’s enduring legacy of faith, art, and cultural pride.
                        </p>

                    </div>
                </div>
                <div className='mt-20 relative '>
                    <div>
                        <p className='text-3xl mx-6 font-bold'>Inscriptions at Elephanta </p>
                        <div className="mt-4">
                            {/* Slider container */}
                            {isClient && <div className="overflow-hidden">
                                <div
                                    className="flex transition-transform duration-700 ease-in-out"
                                    style={{ transform: `translateX(-${current * 50}%)` }}
                                >
                                    {images.map((img, index) => (
                                        <div key={index} className="w-1/3 flex-shrink-0 p-2">
                                            <img
                                                src={img}
                                                alt={`Gallery ${index}`}
                                                className="w-full h-80 object-cover rounded-2xl bg-gray-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>}

                            {/* Bottom right buttons */}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={prevSlide}
                                    className="bg-transparent border px-6 cursor-pointer hover:border-lime-200 transition-all ease-in-out duration-700 hover:bg-lime-200 p-2 rounded-full shadow-md"
                                >
                                    <ChevronLeft />
                                </button>
                                <button
                                    onClick={nextSlide}
                                    className="bg-transparent border px-6 cursor-pointer hover:border-lime-200 transition-all ease-in-out duration-700 hover:bg-lime-200 p-2 rounded-full shadow-md"
                                >
                                    <ChevronRight />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className='mt-10'>
                        <p className='text-3xl mx-6 font-bold'>Source</p>
                        <div className='mt-4 mx-6 text-lg'>
                            <p>Archaeological Survey of India – Elephanta Caves</p>
                        </div>
                    </div>
                    {!user && (<div className='w-full h-full absolute top-1/6 flex rounded-t-[10%] justify-center items-start right-0 bg-gradient-to-b from-green-50/70 via-green-50/100 to-green-50/100'>
                        <div className='group relative'>

                            <button className='-mt-6 text-2xl font-bold border-green-600 hover:border-t-4 hover:border-b-0 cursor-pointer transition-all ease-in-out duration-500  bg-[#a5fc72] px-20 rounded-full border-b-6 py-4' onClick={() => router.push("/login")}>Read More</button>

                            <span
                                className="absolute top-[125%] left-1/2 -translate-x-1/2 min-w-72 bg-green-900 text-white text-center 
               rounded-lg py-2 opacity-0 group-hover:opacity-100 group-hover:visible invisible 
               transition-opacity duration-700 z-10 
               after:content-[''] after:absolute after:top-[-10px] after:left-1/2 after:-translate-x-1/2 
               after:border-[6px] after:border-solid 
               after:border-t-transparent after:border-x-transparent border-b-6  border-b-green-600 after:border-b-green-900"
                            >

                                Please log in to continue.<br /> Click to go to the login page.
                            </span>
                        </div>
                    </div>)}
                </div>
            </div>
            <div className='h-96 w-screen'></div>
            <div>
                <Footer
                    quickLinks={[]}
                    contactInfo={{}}
                    handleNavigation={() => { }}
                />

            </div>
            {isModalOpen && (
                <ImageModal
                    images={images}
                    selectedImage={selectedImage}
                    onClose={handleCloseModal}
                    onNext={handleNextImage}
                    onPrev={handlePrevImage}
                />
            )}
            <AIFloatingButton />
        </div>
    )
}

export default cave