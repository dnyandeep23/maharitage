"use client";
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Code, Users, Camera, FileText, Phone, Mail, MapPin as LocationIcon, ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import bg_img from '../../assets/images/bg_image.png';
import Image from 'next/image';
import Header from './Header';
import Footer from './Footer';

const HomeComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
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
      name: "ELEPHANTA",
      location: "Gharapuri, Maharashtra",
      image: "/images/elephanta-caves.jpg",
      description: "Ancient rock-cut caves dedicated to Lord Shiva with intricate sculptures"
    },
    {
      id: 2,
      name: "AJANTA",
      location: "Aurangabad, Maharashtra", 
      image: "/images/ajanta-caves.jpg",
      description: "Buddhist cave monuments with exquisite paintings and frescoes"
    },
    {
      id: 3,
      name: "ELLORA",
      location: "Aurangabad, Maharashtra",
      image: "/images/ellora-caves.jpg", 
      description: "Multi-religious cave complex showcasing architectural unity"
    }
  ];

  const features = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "Digital Archive",
      description: "Access a curated collection of historical data, cave documentation, and digital resources preserved for future generations."
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Discover Historic Places", 
      description: "Discover Maharashtra's ancient caves, monuments, and historic cultural treasures with guided maps and detailed information."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Cultural Exchange",
      description: "Join our vibrant heritage community, contributions, and cultural data that preserve heritage for future generations."
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Verified Visuals",
      description: "All images are sourced responsibly, hand with permission, and backed by comprehensive documentation for authenticity."
    }
  ];

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.search-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Auto-rotate featured sites
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredSites.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredSites.length]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsLoading(true);
      try {
        // Implement search functionality
        console.log('Searching for:', searchQuery);
        // Navigate to search results
        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const navigateToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredSites.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredSites.length) % featuredSites.length);
  };

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
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

      {/* Hero Section */}
      <section 
        className="relative h-screen bg-cover bg-center bg-no-repeat overflow-hidden pt-20"
      >
        <Image src={bg_img} alt="Hero Background" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-6xl mx-auto px-4">
            <h1 
              className="text-6xl md:text-8xl font-bold mb-3 tracking-wider leading-none font-cinzel-decorative drop-shadow-xl"
              style={{ 
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '0.1em'
              }}
            >
              Maha<span className='text-[#083D03]'>rastra</span>
            </h1>
            <h2 
              className="text-2xl flex justify-end font-cinzel-decorative md:text-4xl font-light mb-10 tracking-widest opacity-95"
              style={{ 
                textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
                letterSpacing: '0.2em'
              }}
            >
              {heroData.subtitle}
            </h2>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-8">
              <div className="flex items-center bg-white w-full rounded-full overflow-hidden shadow-2xl">
                <div className="relative flex items-center search-dropdown">
                  <div 
                    className="flex items-center gap-2 z-50 px-4 cursor-pointer hover:bg-gray-50 transition-colors py-2"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    {activeIcon === 'search' ? (
                      <Search className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Bot className="w-5 h-5 text-green-600" />
                    )}
                    <ChevronRight 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-[270deg]' : 'rotate-90'
                      }`}
                    />
                  </div>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 transition-all duration-200">
                      {searchOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            activeIcon === option.id ? 'text-green-600 bg-gray-50' : 'text-gray-600'
                          }`}
                          onClick={() => {
                            setActiveIcon(option.id);
                            setIsDropdownOpen(false);
                          }}
                        >
                          <div className={activeIcon === option.id ? 'text-green-600' : 'text-gray-400'}>
                            {option.icon}
                          </div>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeIcon === 'search' ? "Search heritage sites..." : "Ask AI about heritage sites..."}
                  className="flex-1 px-4 py-4 text-gray-800 placeholder-gray-500 focus:outline-none"
                  style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 rounded-full hover:bg-green-700 text-white px-8 py-4 transition-colors duration-200 disabled:opacity-50 font-medium"
                  style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Explore Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 
              className="text-5xl font-bold text-gray-800 mb-6"
              style={{ 
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                letterSpacing: '0.02em'
              }}
            >
              {heroData.tagline}
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto mb-6"></div>
            <p 
              className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              {heroData.description}
            </p>
          </div>

          {/* Featured Sites Carousel */}
          <div className="relative max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredSites.map((site) => (
                  <div key={site.id} className="w-full flex-shrink-0">
                    <div className="relative h-80 lg:h-[400px] bg-cover bg-center" style={{ backgroundImage: `url('${site.image}')` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end">
                        <div className="text-white p-8 lg:p-12 w-full">
                          <h3 
                            className="text-4xl lg:text-5xl font-bold mb-3"
                            style={{ 
                              fontFamily: "'Playfair Display', 'Times New Roman', serif",
                              letterSpacing: '0.05em'
                            }}
                          >
                            {site.name}
                          </h3>
                          <p 
                            className="text-sm mb-3 flex items-center opacity-90"
                            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                          >
                            <LocationIcon className="w-4 h-4 mr-2" />
                            {site.location}
                          </p>
                          <p 
                            className="text-sm opacity-90 mb-6 max-w-lg leading-relaxed"
                            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                          >
                            {site.description}
                          </p>
                          <button
                            onClick={() => handleNavigation(`/caves/${site.name.toLowerCase()}`)}
                            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-colors duration-200 font-medium"
                            style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                          >
                            Learn More
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Controls */}
            <button
              onClick={prevSlide}
              className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carousel Indicators */}
            <div className="flex justify-center mt-8 space-x-3">
              {featuredSites.map((_, index) => (
                <button
                  key={index}
                  onClick={() => navigateToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentSlide 
                      ? 'bg-green-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 
              className="text-5xl font-bold text-gray-800 mb-6"
              style={{ 
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                letterSpacing: '0.02em'
              }}
            >
              Features
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto mb-6"></div>
            <p 
              className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed"
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              Immerse yourself in Maharashtra's heritage through our carefully 
              curated collection of historic sites and cultural stories.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center p-8 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 bg-white border border-gray-100"
              >
                <div className="text-green-600 mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <h3 
                  className="text-xl font-bold text-gray-800 mb-4"
                  style={{ 
                    fontFamily: "'Playfair Display', 'Times New Roman', serif"
                  }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-gray-600 text-sm leading-relaxed"
                  style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Documentation Section */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="text-green-600 mb-6 flex justify-center">
              <FileText className="w-16 h-16" />
            </div>
            <h2 
              className="text-4xl font-bold text-gray-800 mb-6"
              style={{ 
                fontFamily: "'Playfair Display', 'Times New Roman', serif",
                letterSpacing: '0.02em'
              }}
            >
              Access API Documentation
            </h2>
            <p 
              className="text-gray-600 mb-10 text-lg leading-relaxed"
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              Integrate Maharashtra's heritage data into your applications with our comprehensive API.
            </p>
            <button 
              onClick={() => handleNavigation('/api-docs')}
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-lg transition-colors duration-200 inline-flex items-center text-lg font-medium shadow-lg hover:shadow-xl"
              style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
            >
              Visit Docs
              <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer handleNavigation={handleNavigation} />
    </div>
  );
};

export default HomeComponent;