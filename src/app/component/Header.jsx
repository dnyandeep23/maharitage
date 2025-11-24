"use client";
import React, { useState, useRef, useEffect } from "react";
import "../fonts.css";
import PropTypes from "prop-types";
import {
  Book,
  User,
  Languages,
  Menu,
  X,
  LogOut,
  Settings,
  House,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext.jsx";

// 🧩 Unified Theme Configuration
const THEME_CONFIG = {
  light: {
    headerBg: "bg-white/5 text-green-900 hover:bg-white/40",
    text: "text-green-900",
    accent: "bg-green-600 text-white",
    hoverAccent: "hover:bg-green-700",
    navActiveFull: "bg-green-100/50 text-green-700 text-xs font-inter",
    navInactiveFull: "text-green-900 text-xs hover:bg-green-100",
    navActiveMinimal: "bg-green-200/40 text-green-100 text-xs font-inter",
    navInactiveMinimal: "text-green-200 text-xs hover:bg-green-200/30",
    logo: "text-green-700",
    border: "border-green-200",
    profileBg: "bg-white",
    menuBg: "bg-white/95",
  },
  dark: {
    headerBg: "bg-gray-900/5 text-green-100 hover:bg-gray-900/40",
    text: "text-green-100",
    accent: "bg-green-500 text-gray-900",
    hoverAccent: "hover:bg-green-400",
    navActiveFull: "bg-green-500/30 text-green-200 text-xs font-inter",
    navInactiveFull: "text-green-100 text-xs hover:bg-green-500/20",
    navActiveMinimal: "bg-green-700/30 text-green-200 text-xs font-inter",
    navInactiveMinimal: "text-green-200 text-xs hover:bg-green-700/20",
    logo: "text-green-200",
    border: "border-green-700",
    profileBg: "bg-gray-800",
    menuBg: "bg-gray-900/95",
  },
};

const Header = ({ currentPath = "", variant = "full", theme = "light" }) => {
  const { user, logout } = useAuth();
  const [hoveredNav, setHoveredNav] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const colors = THEME_CONFIG[theme] || THEME_CONFIG.light;

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  // 🔘 FIXED: Proper hover + active state priority
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
        className={`px-4 py-1 cursor-pointer rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md group ${buttonClasses}`}
        style={{ fontFamily: "Inter" }}
      >
        {item.icon}
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
    <header
      className={`fixed top-1 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-50 ${colors.headerBg} backdrop-blur-md text-sm shadow-sm border-b rounded-full ${colors.border}`}
    >
      <div className="px-2 sm:px-3 py-0.5 sm:py-2 flex items-center justify-between relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span
            className={`font-cinzel-decorative text-sm sm:text-xl cursor-pointer pl-1 sm:pl-6 font-bold tracking-wider ${colors.logo}`}
            onClick={() => handleNavigation("/")}
          >
            MAHARITAGE
          </span>
        </motion.div>

        {/* FULL VARIANT NAV */}
        {variant === "full" && (
          <>
            <nav className="hidden md:flex items-center justify-center flex-1 space-x-4 absolute left-1/2 -translate-x-1/2">
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
            <div className="hidden md:flex items-center space-x-4">
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
                        className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 ${colors.profileBg} ring-1 ring-black/10`}
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
                    className={`px-4 py-1.5 rounded-full font-medium ${colors.text} transition-all duration-300`}
                  >
                    Login
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleNavigation("/register")}
                    className={`px-6 py-1.5 rounded-full font-medium ${colors.accent} ${colors.hoverAccent} shadow transition-all duration-300`}
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
                className={`p-2 ${colors.text}`}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </>
        )}

        {/* MINIMAL VARIANT */}
        {variant === "minimal" && (
          <nav className="flex items-center pr-4 space-x-4">
            {renderNavButton(navItems[0])}
            {renderNavButton(navItems[2])}
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
            className={`absolute top-full left-0 right-0 mt-2 md:hidden ${colors.menuBg} backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden`}
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
  );
};

Header.propTypes = {
  currentPath: PropTypes.string,
  variant: PropTypes.oneOf(["full", "minimal"]),
  theme: PropTypes.oneOf(["light", "dark"]),
};

export default Header;
