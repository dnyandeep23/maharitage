'use client';
import React, { useState } from 'react';
import { Search, Bot, Code, Users, Camera, MapPin } from 'lucide-react';
import bg_img from '../../assets/images/bg_image.png';
import Header from './Header';
import Footer from './Footer';
import Hero from './home/Hero';
import Explore from './home/Explore';
import Features from './home/Features';
import ApiDocs from './home/ApiDocs';
import slide1 from '../../assets/images/elephanta_slide.png';
import slide2 from '../../assets/images/agenta_slide.png';
import AIFloatingButton from './AIFloatingButton';
const HomeComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeIcon, setActiveIcon] = useState('search'); // 'search' or 'ai'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchOptions = [
    { id: 'search', icon: <Search className="w-5 h-5" />, label: 'Search Sites' },
    { id: 'ai', icon: <Bot className="w-5 h-5" />, label: 'Ask AI' }
  ];

  // Dynamic data - can be fetched from API
  const heroData = {
    title: "MAHARASHTRA",
    subtitle: "HERITAGE",
    tagline: "Explore the Wonder",
    description: "Faith, artistry, and architectural brilliance",
    backgroundImage: bg_img
  };

  const featuredSites = [
    {
      id: 1,
      name: "AJANTA",
      location: "Chatrapati Sambhaji Maharaj Nagar, Maharashtra",
      image: slide2,
      description: "Buddhist cave monuments with exquisite paintings and frescoes"
    },
    {
      id: 2,
      name: "ELEPHANTA",
      location: "Gharapuri, Maharashtra",
      image: slide1,
      description: "Ancient rock-cut caves dedicated to Lord Shiva with intricate sculptures"
    },
    {
      id: 3,
      name: "AJANTA",
      location: "Chatrapati Sambhaji Maharaj Nagar, Maharashtra",
      image: slide2,
      description: "Buddhist cave monuments with exquisite paintings and frescoes"
    },
    // {
    //   id: 3,
    //   name: "ELLORA",
    //   location: "Sambhaji Nagar, Maharashtra",
    //   image: "/images/ellora-caves.jpg",
    //   description: "Multi-religious cave complex showcasing architectural unity"
    // }
  ];


  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsLoading(true);
      try {
        if (activeIcon === 'search') {
          window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
        } else {
          window.location.href = `/ai?q=${encodeURIComponent(searchQuery.trim())}`;
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-white font-sans relative">
      <AIFloatingButton />
      <Header
        variant='full'
        handleNavigation={handleNavigation}
        bgColor="bg-white"
        textColor="text-black"
        buttonColor="bg-green-600 text-white"
        buttonHover="hover:bg-green-700"
        navActive="bg-green-100 text-green-700"
        navInactive="text-black hover:bg-green-100"
        logoColor="text-black"
        borderColor="border-gray-200"
      />

      <Hero

        heroData={heroData}
        handleSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isLoading={isLoading}
        activeIcon={activeIcon}
        setActiveIcon={setActiveIcon}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        searchOptions={searchOptions}
      />

      <Explore featuredSites={featuredSites} heroData={heroData} handleNavigation={handleNavigation} />

      <Features />

      <ApiDocs handleNavigation={handleNavigation} />

      <Footer handleNavigation={handleNavigation} />

    </div>
  );
};

export default HomeComponent;