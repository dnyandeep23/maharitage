'use client';
import React, { useState, useRef, useEffect } from 'react';
import '../fonts.css';
import PropTypes from 'prop-types';
import {
  Book,
  User,
  Languages,
  Menu,
  X,
  LogOut,
  Settings,
  House,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Header = ({
  currentPath = '/',
  variant = 'full',
  bgColor = 'bg-white',
  textColor = 'text-green-900',
  activeColor = 'bg-green-600 text-white',
  buttonColor = 'bg-green-600 text-white',
  buttonHover = 'hover:bg-green-700',
  navActive = variant === 'minimal'
    ? 'bg-green-200/40 text-green-100 text-xs font-inter'
    : 'bg-green-100/50 text-green-700 text-xs font-inter',
  navInactive = variant === 'minimal'
    ? 'text-green-200 text-xs hover:bg-green-200/30'
    : 'text-green-900 text-xs hover:bg-green-100',
  logoColor = variant !== 'minimal' ? 'text-green-700' : 'text-green-200',
  borderColor = 'border-green-200'
}) => {
  const { user, logout } = useAuth();
  const [hoveredNav, setHoveredNav] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // 🌗 Theme setup variables
  const lightTheme = {
    bg: 'bg-white',
    text: 'text-green-900',
    accent: 'bg-green-600 text-white'
  };

  const darkTheme = {
    bg: 'bg-gray-900',
    text: 'text-green-100',
    accent: 'bg-green-500 text-gray-900'
  };

  const theme = lightTheme; // 🌓 You can switch to darkTheme dynamically later.

  const handleNavigation = (path) => {
    if (window.location.pathname !== path) {
      window.location.href = path;
    }
  };

  // Handle clicking outside of profile menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      handleNavigation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 🧭 Define nav items (conditionally includes Dashboard if logged in)
  const navItems = [
    { path: '/', label: 'Home', icon: <House className="w-5 h-5" /> },
    { path: '/about', label: 'About Us', icon: <Book className="w-5 h-5" /> },
    { path: '/contact', label: 'Contact Us', icon: <User className="w-5 h-5" /> },
    { path: 'language', label: 'Language', icon: <Languages className="w-5 h-5" />, isModal: true },
  ];

  if (user) {
    navItems.splice(1, 0, {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    });
  }

  // 🔘 Reusable nav button
  const renderNavButton = (item) => {
    const isActive = currentPath === item.path;
    const isHovered = hoveredNav === item.path;
    const buttonClasses = isHovered
      ? `${navActive}`
      : isActive && !hoveredNav
        ? `${navActive}`
        : `${navInactive}`;

    return (
      <button
        key={item.path}
        onClick={() =>
          item.isModal
            ? window.dispatchEvent(new CustomEvent('open-language-modal'))
            : handleNavigation(item.path)
        }
        onMouseEnter={() => setHoveredNav(item.path)}
        onMouseLeave={() => setHoveredNav(null)}
        className={`px-4 py-1 cursor-pointer rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-md group ${buttonClasses}`}
        style={{ fontFamily: 'Inter' }}
      >
        {item.icon}
        <span
          className="hidden max-w-0 group-hover:max-w-xs group-hover:block transition-all duration-300 whitespace-nowrap"
          style={{ fontFamily: 'Inter' }}
        >
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <header
      className={`fixed top-1 sm:top-3 left-2 sm:left-3 right-2 sm:right-3 z-50 ${theme.bg}/30 backdrop-blur-md text-sm shadow-sm border-b rounded-full ${borderColor}`}
    >
      <div className="px-2 sm:px-3 py-0.5 sm:py-2 flex items-center justify-between relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 sm:space-x-4"
        >
          <span
            className={`font-cinzel-decorative text-sm sm:text-xl cursor-pointer pl-1 sm:pl-6 font-bold tracking-wider ${logoColor}`}
            onClick={() => handleNavigation('/')}
          >
            MAHARITAGE
          </span>
        </motion.div>

        {variant === 'full' && (
          <>
            {/* 🧭 Centered Navigation */}
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

            {/* 👤 Auth/Profile Section */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`w-8 h-8 rounded-full font-medium ${buttonColor} flex items-center justify-center text-sm uppercase shadow transition-all duration-300`}
                  >
                    {user?.name?.[0] || user?.email?.[0] || 'U'}
                  </motion.button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5"
                        ref={profileMenuRef}
                      >
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>

                        <div className="py-1">
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              handleNavigation('/dashboard/settings');
                            }}
                            className="flex items-center px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 w-full"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </button>

                          <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-1 text-sm text-red-600 hover:bg-red-50 w-full"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleNavigation('/login')}
                    className={`px-4 py-1.5 rounded-full font-medium ${textColor} transition-all duration-300`}
                    style={{ fontFamily: 'Inter' }}
                  >
                    Login
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigation('/register')}
                    className={`px-6 py-1.5 rounded-full font-medium ${buttonColor} ${buttonHover} shadow transition-all duration-300`}
                    style={{ fontFamily: 'Inter' }}
                  >
                    Register
                  </motion.button>
                </>
              )}
            </div>

            {/* 📱 Mobile Menu Button */}
            <div className="md:hidden">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 ${textColor} hover:text-amber-700 transition-colors duration-200`}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </>
        )}

        {/* Minimal header variant */}
        {variant === 'minimal' && (
          <nav className="flex items-center pr-4 space-x-4">
            {renderNavButton(navItems[0])}
            {renderNavButton(navItems[3])}
          </nav>
        )}
      </div>

      {/* 📱 Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && variant === 'full' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 md:hidden bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden"
          >
            <div className="flex flex-col space-y-2 p-4">
              {navItems.map((item) => (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    if (item.isModal) {
                      window.dispatchEvent(new CustomEvent('open-language-modal'));
                    } else {
                      handleNavigation(item.path);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-full font-light ${currentPath === item.path ? navActive : navInactive
                    } transition-all duration-200`}
                  style={{ fontFamily: 'Inter' }}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </motion.button>
              ))}
              <div className="flex flex-col space-y-2 pt-2 border-t border-amber-100">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        handleNavigation('/dashboard/settings');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
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
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
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
                        handleNavigation('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-4 cursor-pointer text-white hover:text-black font-bold py-2 rounded-full ${textColor} hover:bg-amber-50 transition-all duration-200`}
                    >
                      Login
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        handleNavigation('/register');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`px-4 cursor-pointer py-2 text-lg max-h-full rounded-full font-medium ${buttonColor} ${buttonHover} shadow`}
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
  handleNavigation: PropTypes.func.isRequired,
  currentPath: PropTypes.string,
  variant: PropTypes.oneOf(['full', 'minimal']),
  bgColor: PropTypes.string,
  textColor: PropTypes.string,
  activeColor: PropTypes.string,
  buttonColor: PropTypes.string,
  buttonHover: PropTypes.string,
  navActive: PropTypes.string,
  navInactive: PropTypes.string,
  logoColor: PropTypes.string,
  borderColor: PropTypes.string
};

export default Header;
