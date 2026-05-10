"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Search } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import Hero from "./home/Hero";
import Explore from "./home/Explore";
import Features from "./home/Features";
import ApiDocs from "./home/ApiDocs";
import AIFloatingButton from "./AIFloatingButton";
import bg_img from "../../assets/images/bg_image.png";

export default function HomeClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeIcon, setActiveIcon] = useState("search"); // 'search' or 'ai'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchOptions = [
    { id: "search", label: "Archive Search", icon: <Search className="h-4 w-4" /> },
    { id: "ai", label: "AI Guide", icon: <Bot className="h-4 w-4" /> },
  ];

  const heroData = {
    title: "MAHARASHTRA",
    subtitle: "HERITAGE",
    tagline: "Explore the Wonder",
    description: "Faith, artistry, and architectural brilliance",
    backgroundImage: bg_img,
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsLoading(true);
      if (activeIcon === "search") {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/ai?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <div className="relative min-h-screen bg-[#f5efe3] font-sans">
      <AIFloatingButton />
      <Header
        variant="full"
        handleNavigation={handleNavigation}
        currentPath="/"
        theme="hero"
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

      <Explore heroData={heroData} handleNavigation={handleNavigation} />

      <Features />

      <ApiDocs handleNavigation={handleNavigation} />

      <Footer handleNavigation={handleNavigation} />
    </div>
  );
}
