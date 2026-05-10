"use client";
import React, { useState, useRef, useEffect } from "react";
import "../fonts.css";
import PropTypes from "prop-types";
import {
  Book,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  House,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext.jsx";

const THEME_CONFIG = {
  hero: {
    headerBg:
      "bg-[#101b15]/28 text-white shadow-[0_20px_70px_rgba(12,10,9,0.28)] backdrop-blur-2xl border-white/18 ring-1 ring-white/12",
    headerBgScrolled:
      "bg-[#f7f0e4]/90 text-stone-950 shadow-[0_18px_50px_rgba(41,37,36,0.12)] backdrop-blur-2xl border-[#cdbb9c]/70 ring-1 ring-white/70",
    text: "text-white",
    accent: "bg-[#d2ba7d] text-[#101b15]",
    hoverAccent: "hover:bg-[#e4cd92]",
    navActiveFull: "bg-white/18 text-white text-xs font-inter shadow-inner ring-1 ring-white/15",
    navInactiveFull: "text-white/88 text-xs hover:bg-white/14 hover:text-white",
    navActiveMinimal: "bg-white/16 text-white text-xs font-inter",
    navInactiveMinimal: "text-white/84 text-xs hover:bg-white/14 hover:text-white",
    logo: "text-white",
    border: "border-white/18",
    profileBg: "bg-white/95 backdrop-blur-xl",
    menuBg: "bg-[#101b15]/94 text-white border border-white/10",
  },
  light: {
    headerBg: "bg-[#f7f0e4]/72 text-[#263a2d] hover:bg-[#f7f0e4]/88",
    headerBgScrolled: "bg-[#f7f0e4]/90 text-[#263a2d] shadow-[0_18px_50px_rgba(41,37,36,0.12)] backdrop-blur-xl border-[#cdbb9c]/60",
    text: "text-[#263a2d]",
    accent: "bg-[#263a2d] text-[#f7f0e4]",
    hoverAccent: "hover:bg-[#101b15]",
    navActiveFull: "bg-[#263a2d]/10 text-[#263a2d] text-xs font-inter ring-1 ring-[#263a2d]/10",
    navInactiveFull: "text-[#263a2d]/82 text-xs hover:bg-[#263a2d]/8 hover:text-[#263a2d]",
    navActiveMinimal: "bg-[#263a2d]/10 text-[#263a2d] text-xs font-inter",
    navInactiveMinimal: "text-[#263a2d]/82 text-xs hover:bg-[#263a2d]/8",
    logo: "text-[#263a2d]",
    border: "border-[#cdbb9c]/50",
    profileBg: "bg-[#fffaf0]",
    menuBg: "bg-[#fffaf0]/96",
  },
  dark: {
    headerBg: "bg-[#101b15]/24 text-[#f7f0e4] hover:bg-[#101b15]/34",
    headerBgScrolled: "bg-[#101b15]/94 text-[#f7f0e4] shadow-md backdrop-blur-xl border-[#d2ba7d]/24",
    text: "text-[#f7f0e4]",
    accent: "bg-[#d2ba7d] text-[#101b15]",
    hoverAccent: "hover:bg-[#e4cd92]",
    navActiveFull: "bg-[#d2ba7d]/18 text-[#f7f0e4] text-xs font-inter ring-1 ring-[#d2ba7d]/20",
    navInactiveFull: "text-[#f7f0e4]/84 text-xs hover:bg-white/10 hover:text-white",
    navActiveMinimal: "bg-[#d2ba7d]/18 text-[#f7f0e4] text-xs font-inter",
    navInactiveMinimal: "text-[#f7f0e4]/82 text-xs hover:bg-white/10",
    logo: "text-[#f7f0e4]",
    border: "border-[#d2ba7d]/22",
    profileBg: "bg-[#263a2d]",
    menuBg: "bg-[#101b15]/95",
  },
};

const Header = ({ currentPath = "", variant = "full", theme = "light" }) => {
  const { user, logout } = useAuth();
  const [hoveredNav, setHoveredNav] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const profileMenuRef = useRef(null);

  // Switch to a readable solid theme when scrolled, otherwise use the provided theme prop.
  const effectiveTheme = isScrolled && theme !== "dark" ? "light" : theme;
  const colors = THEME_CONFIG[effectiveTheme] || THEME_CONFIG.light;

  const handleNavigation = (path) => {
    if (window.location.pathname !== path) {
      window.location.href = path;
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      handleNavigation("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { path: "/", label: "Home", icon: <House className="w-5 h-5" /> },
    { path: "/search", label: "Search", icon: <Search className="w-5 h-5" /> },
    { path: "/docs", label: "Docs", icon: <Book className="w-5 h-5" /> },
    { path: "/about", label: "About Us", icon: <User className="w-5 h-5" /> },
  ];

  if (user) {
    navItems.splice(1, 0, {
      path: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    });
  }

  const renderNavButton = (item) => {
    const isActive = currentPath === item.path;
    const isHovered = hoveredNav === item.path;

    let buttonClasses = "";

    if (isActive) {
      // ACTIVE ALWAYS WINS
      buttonClasses =
        variant === "minimal" ? colors.navActiveMinimal : colors.navActiveFull;
    } else if (isHovered) {
      // Hover only if not active
      buttonClasses =
        variant === "minimal" ? colors.navActiveMinimal : colors.navActiveFull;
    } else {
      // Default inactive state
      buttonClasses =
        variant === "minimal"
          ? colors.navInactiveMinimal
          : colors.navInactiveFull;
    }

    return (
      <button
        key={item.path}
        onClick={() =>
          item.isModal
            ? window.dispatchEvent(new CustomEvent("open-language-modal"))
            : handleNavigation(item.path)
        }
        onMouseEnter={() => setHoveredNav(item.path)}
        onMouseLeave={() => setHoveredNav(null)}
        className={`px-3.5 py-2 cursor-pointer rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-[0_10px_30px_rgba(12,10,9,0.12)] group ${buttonClasses}`}
        style={{ fontFamily: "Inter" }}
      >
        {React.cloneElement(item.icon, {
          className: "w-4 h-4 shrink-0",
          strokeWidth: 2,
        })}
        <span
          className="hidden max-w-0 group-hover:max-w-xs group-hover:block transition-all duration-300 whitespace-nowrap"
          style={{ fontFamily: "Inter" }}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
    <header
      className={`fixed top-3 left-3 right-3 z-50 mx-auto max-w-7xl ${isScrolled ? colors.headerBgScrolled : colors.headerBg} text-sm border rounded-full transition-all duration-300 ${colors.border}`}
    >
      <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span
            className={`font-cinzel-decorative text-sm sm:text-xl cursor-pointer pl-1 sm:pl-4 font-bold tracking-wider ${colors.logo}`}
            onClick={() => handleNavigation("/")}
          >
            MAHARITAGE
          </span>
        </motion.div>

        {/* FULL VARIANT NAV */}
        {variant === "full" && (
          <>
            <nav className="hidden md:flex items-center justify-center flex-1 gap-1.5 absolute left-1/2 -translate-x-1/2 rounded-full border border-white/12 bg-white/8 px-2 py-1 backdrop-blur-xl">
              <AnimatePresence>
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {renderNavButton(item)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </nav>

            {/* AUTH BUTTONS / PROFILE */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`w-8 h-8 rounded-full font-medium ${colors.accent} flex items-center justify-center text-sm uppercase shadow transition-all duration-300`}
                  >
                    {user?.name?.[0] || user?.email?.[0] || "U"}
                  </motion.button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        ref={profileMenuRef}
                        className={`absolute right-0 mt-3 w-56 rounded-2xl shadow-[0_24px_70px_rgba(12,10,9,0.18)] py-2 ${colors.profileBg} ring-1 ring-black/10`}
                      >
                        <div className="px-4 py-2 border-b border-gray-200/30">
                          <p className="text-sm font-medium truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-xs opacity-70 truncate">
                            {user?.email}
                          </p>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="flex items-center px-4 py-1 text-sm text-red-600 hover:bg-red-50/10 w-full"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleNavigation("/login")}
                    className={`px-4 py-2 rounded-full font-medium ${colors.text} transition-all duration-300 hover:bg-white/12`}
                  >
                    Login
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleNavigation("/register")}
                    className={`px-6 py-2 rounded-full font-medium ${colors.accent} ${colors.hoverAccent} shadow transition-all duration-300`}
                  >
                    Register
                  </motion.button>
                </>
              )}
            </div>

            {/* MOBILE TOGGLE */}
            <div className="md:hidden">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-full ${colors.text} hover:bg-white/12`}
                aria-label="Open menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </>
        )}

        {/* MINIMAL VARIANT */}
        {variant === "minimal" && (
          <nav className="flex items-center pr-2 sm:pr-4 space-x-1 sm:space-x-4">
            {renderNavButton(navItems[0])}
            {renderNavButton(navItems[3] || navItems[2])}
          </nav>
        )}
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && variant === "full" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-full left-0 right-0 mt-2 md:hidden ${colors.menuBg} backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden`}
          >
            <div className="flex flex-col space-y-2 p-4">
              {navItems.map((item) => (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    handleNavigation(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-full font-light ${
                    currentPath === item.path
                      ? variant === "minimal"
                        ? colors.navActiveMinimal
                        : colors.navActiveFull
                      : variant === "minimal"
                      ? colors.navInactiveMinimal
                      : colors.navInactiveFull
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </motion.button>
              ))}

              {/* AUTH mobile */}
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200/30">
                {user ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        handleNavigation("/dashboard/settings");
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-100/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50/10"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        handleNavigation("/login");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-4 py-2 rounded-full font-medium ${colors.text}`}
                    >
                      Login
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        handleNavigation("/register");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-4 py-2 rounded-full font-medium ${colors.accent} ${colors.hoverAccent} shadow`}
                    >
                      Register
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    {variant === "full" && (
      <nav className="mobile-bottom-nav fixed inset-x-3 bottom-3 z-50 md:hidden">
        <div className="grid grid-cols-4 gap-1 rounded-full border border-[#cdbb9c]/50 bg-[#fffaf0]/92 p-1.5 shadow-[0_18px_50px_rgba(25,22,17,0.18)] backdrop-blur-xl">
          {navItems.slice(0, 4).map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigation(item.path)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-full px-2 text-[0.65rem] font-bold transition ${
                  isActive
                    ? "bg-[#263a2d] text-[#f7f0e4]"
                    : "text-[#263a2d]/70 hover:bg-[#263a2d]/8"
                }`}
              >
                {React.cloneElement(item.icon, { className: "h-4 w-4", strokeWidth: 2 })}
                <span className="mt-0.5 leading-none">{item.label.replace(" Us", "")}</span>
              </button>
            );
          })}
        </div>
      </nav>
    )}
    </>
  );
};

Header.propTypes = {
  currentPath: PropTypes.string,
  variant: PropTypes.oneOf(["full", "minimal"]),
  theme: PropTypes.oneOf(["light", "dark", "hero"]),
};

export default Header;
