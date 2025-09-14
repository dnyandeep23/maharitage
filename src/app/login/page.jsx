"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePathname } from 'next/navigation';
import Header from "../component/Header";
import Footer from "../component/Footer";
import Modal from "../component/Modal";
import login_bg from "../../assets/images/login_bg.png";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { ROLES, ROLE_CONFIG, getDashboardPath } from "../../lib/roles";
import { useApi } from "../../contexts/ApiContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(ROLES.PUBLIC_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  const tabRefs = useRef({});

  const toggleRole = (newRole) => {
    if (newRole !== role) {
      setRole(newRole);
    }
  };

  const handleNavigation = (path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const showModal = (type, title, message) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: "", title: "", message: "" });
  };

  const { login } = useApi();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showModal("warning", "Missing Information", "Please enter both email and password.");
      return;
    }
    
    if (password.length < 6) {
      showModal("error", "Invalid Password", "Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password, role);

      if (result.success) {
        showModal("success", "Login Successful", result.message);
        
        // Get role-specific dashboard path and redirect
        const dashboardPath = getDashboardPath(result.user.role);
        setTimeout(() => {
          window.location.href = dashboardPath;
        }, 1500);
      } else {
        showModal("error", "Login Failed", result.error);
      }
    } catch (error) {
      showModal("error", "Login Failed", "An error occurred while trying to log in. Please try again.");
      setIsLoading(false);
    }
  };

  // Role display names mapping
  const roleDisplay = {
    "public-user": "Public User",
    "research-expert": "Research Expert",
    "admin": "Admin"
  };
  const roles = ["public-user", "research-expert", "admin"];

  // Update highlight position and size based on active tab
  useEffect(() => {
    const activeTab = tabRefs.current[role];
    if (activeTab) {
      const { offsetLeft, offsetWidth } = activeTab;
      setHighlightStyle({
        left: offsetLeft,
        width: offsetWidth,
      });
    }
  }, [role]);

  return (
    <div className="min-h-screen flex flex-col relative font-inter">
      {/* Background */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image
          src={login_bg}
          alt="Login Background"
          fill
          priority
          className="object-cover w-full h-full"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 -z-10" />

      {/* Header */}
      <Header
        handleNavigation={handleNavigation}
        currentPath={usePathname()}
        variant="minimal"
      />

      {/* Main Section */}
      <div className="w-full flex flex-col items-center justify-center h-screen">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-28">
          {/* Left Section */}
          <div className="flex-1 flex flex-col justify-center items-start text-white">
            <h2 className="text-8xl md:text-6xl font-bold mb-6">
              Welcome back to Maharitage
            </h2>
            <p className="text-lg text-gray-200">
              Access your account to explore heritage data, manage research, or
              continue your journey into Maharashtra's caves.
            </p>
            <div className="mt-24 text-lg">
              <p>
                Don't have an account?{" "}
                <span
                  className="text-green-400 font-bold cursor-pointer hover:underline"
                  onClick={() => handleNavigation("/register")}
                >
                  Sign Up
                </span>
              </p>
            </div>
          </div>

          {/* Right Section - Login Card */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="relative w-full max-w-lg bg-white/15 rounded-[8rem] rounded-br-[10rem] rounded-bl-[15rem] p-16 shadow-xl border border-white/30">
              
              {/* Role Tabs with Animation */}
              <div className="relative flex justify-center items-center bg-white/10 rounded-full p-1 mb-10 border border-white/20 w-full">
                {/* Sliding Highlight */}
                <motion.div
                  className="absolute top-1 bottom-1 rounded-full bg-green-900/90 backdrop-blur-sm shadow-lg"
                  style={highlightStyle}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
                
                {Object.entries(ROLE_CONFIG).map(([roleKey, roleData]) => (
                  <button
                    key={roleKey}
                    ref={(el) => (tabRefs.current[roleKey] = el)}
                    onClick={() => toggleRole(roleKey)}
                    className={`relative z-10 px-6 py-3 text-sm font-medium transition-colors duration-300 rounded-full whitespace-nowrap flex-1 text-center ${
                      role === roleKey
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {roleData.display}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-5 top-4 text-green-900 w-5 h-5" />
                  <input
                    type="email"
                    className="w-full pl-14 pr-5 py-3.5 bg-white/70 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="someone@example.com"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-5 top-4 text-green-900 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-14 pr-12 py-3.5 bg-white/70 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-4 text-green-900"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="text-right text-sm">
                  <button
                    type="button"
                    className="text-green-400 hover:underline"
                    onClick={() => handleNavigation("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`self-end w-32 bg-white/70 hover:bg-white text-green-900 py-3.5 rounded-full font-semibold transition-all duration-200 shadow-md text-base flex items-center justify-center ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer
        quickLinks={[]}
        contactInfo={{}}
        handleNavigation={handleNavigation}
      />

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default Login;