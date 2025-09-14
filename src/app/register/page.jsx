"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePathname } from 'next/navigation';
import Header from "../component/Header";
import Footer from "../component/Footer";
import Modal from "../component/Modal";
import login_bg from "../../assets/images/login_bg.png";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { motion } from "framer-motion";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("public-user");
  const [isLoading, setIsLoading] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  const tabRefs = useRef({});
  
  // Role display names mapping
  const roleDisplay = {
    "public-user": "Public User",
    "research-expert": "Research Expert",
    "admin": "Admin"
  };

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  const showModal = (type, title, message) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: "", title: "", message: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;

    if (!username || !email || !password || !confirmPassword) {
      showModal("warning", "Missing Information", "Please fill in all required fields.");
      return false;
    }

    if (username.length < 3) {
      showModal("error", "Invalid Username", "Username must be at least 3 characters long.");
      return false;
    }

    if (password.length < 6) {
      showModal("error", "Weak Password", "Password must be at least 6 characters long.");
      return false;
    }

    if (password !== confirmPassword) {
      showModal("error", "Password Mismatch", "Passwords do not match. Please try again.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal("error", "Invalid Email", "Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: role
        }),
      });

      const data = await response.json();

      if (!data.success) {
        showModal("error", "Registration Failed", data.message || data.error || "Could not complete registration");
        setIsLoading(false);
        return;
      }

      showModal("success", "Registration Successful", `Welcome to Maharitage! Your account has been created successfully as a ${roleDisplay[role]}. You can now log in with your credentials.`);
      
      // Reset form after successful registration
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      // Redirect to login after short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      showModal("error", "Registration Failed", "An error occurred while trying to register. Please try again.");
      setIsLoading(false);
    }
  };

  const roles = ["public-user", "research-expert"];

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
          alt="Register Background"
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
      <div className="w-full flex flex-col items-center justify-center min-h-screen py-20">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-28">
          {/* Left Section */}
          <div className="flex-1 flex flex-col justify-center items-start text-white">
            <h2 className="text-8xl md:text-6xl font-bold mb-6">
              Join Maharitage Community
            </h2>
            <p className="text-lg text-gray-200">
              Create your account to explore Maharashtra's rich heritage, contribute to research, and connect with fellow enthusiasts.
            </p>
            <div className="mt-24 text-lg">
              <p>
                Already have an account?{" "}
                <span
                  className="text-green-400 font-bold cursor-pointer hover:underline"
                  onClick={() => handleNavigation("/login")}
                >
                  Sign In
                </span>
              </p>
            </div>
          </div>

          {/* Right Section - Register Card */}
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
                
                {roles.map((r, index) => (
                  <button
                    key={r}
                    ref={(el) => (tabRefs.current[r] = el)}
                    onClick={() => setRole(r)}
                    className={`relative z-10 px-6 py-3 text-sm font-medium transition-colors duration-300 rounded-full whitespace-nowrap flex-1 text-center ${
                      role === r
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {roleDisplay[r]}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div className="relative">
                  <User className="absolute left-5 top-4 text-green-900 w-5 h-5" />
                  <input
                    type="text"
                    name="username"
                    className="w-full pl-14 pr-5 py-3.5 bg-white/70 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 text-base"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username"
                    required
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-5 top-4 text-green-900 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    className="w-full pl-14 pr-5 py-3.5 bg-white/70 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 text-base"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="someone@example.com"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-5 top-4 text-green-900 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className="w-full pl-14 pr-12 py-3.5 bg-white/70 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 text-base"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password (min 6 characters)"
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

                {/* Confirm Password */}
                <div className="relative">
                  <Lock className="absolute left-5 top-4 text-green-900 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className="w-full pl-14 pr-12 py-3.5 bg-white/70 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 text-base"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm Password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-4 text-green-900"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Terms & Conditions */}
                <div className="text-xs text-center text-white/80 px-4">
                  By registering, you agree to our{" "}
                  <span className="text-green-400 hover:underline cursor-pointer">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-green-400 hover:underline cursor-pointer">
                    Privacy Policy
                  </span>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`self-end w-36 bg-white/70 hover:bg-white text-green-900 py-3.5 rounded-full font-semibold transition-all duration-200 shadow-md text-base flex items-center justify-center ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registering...
                      </>
                    ) : (
                      'Register'
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

export default Register;