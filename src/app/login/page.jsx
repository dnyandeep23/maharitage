"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "../component/Header";
import Footer from "../component/Footer";
import login_bg from "../../assets/images/login_bg.png";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { ROLES, ROLE_CONFIG } from "../../lib/roles";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useRouter } from "next/navigation";
import Toast from "../component/Toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(ROLES.PUBLIC_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const tabRefs = useRef({});
  const router = useRouter();
  const { login } = useAuth();

  const toggleRole = (newRole) => {
    if (newRole !== role) {
      setRole(newRole);
    }
  };

  const handleNavigation = (path) => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setToast({
        show: true,
        message: "Please enter both email and password.",
        type: "error",
      });
      return;
    }

    if (password.length < 6) {
      setToast({
        show: true,
        message: "Password must be at least 6 characters long.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, role);
      handleNavigation("/");
    } catch (error) {
      setToast({
        show: true,
        message: error.message || "An error occurred during login.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast({ show: false, message: "", type: "" })}
        />
      )}

      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image
          src={login_bg}
          alt="Login Background"
          fill
          priority
          className="object-cover w-full h-full"
        />
      </div>

      <div className="absolute inset-0 bg-black/60 -z-10" />

      <Header
        handleNavigation={handleNavigation}
        currentPath={usePathname()}
        variant="minimal"
        theme="dark"
      />

      <div className="w-full flex flex-col items-center justify-center h-[150vh] xl:h-screen">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-10 md:gap-28 px-4 md:px-0">
          <div className="flex-1 flex flex-col sm:mt14 justify-center items-start text-white">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Welcome back to Maharitage
            </h2>
            <p className="text-base md:text-lg text-gray-200">
              Access your account to explore heritage data, manage research, or
              continue your journey into Maharashtra's caves.
            </p>
            <div className="mt-12 md:mt-24 text-base md:text-lg">
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

          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="relative w-full max-w-lg bg-white/15 rounded-[8rem] pt-12 md:pt-0 pb-20 md:pb-0    rounded-br-[10rem] rounded-bl-[15rem] p-4 xl:p-14 shadow-xl border border-white/30">
              <div className="relative flex justify-center items-center rounded-full p-1 mb-10 w-full">
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
                    className={`relative z-10 px-4 md:px-6 py-3  text-sm font-medium transition-colors duration-300 rounded-full whitespace-nowrap flex-1 text-center ${
                      role === roleKey
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {roleData.display}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="text-right text-sm">
                  <button
                    type="button"
                    className="text-green-400 hover:underline"
                    onClick={() => handleNavigation("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`self-end w-32 bg-white/70 hover:bg-white text-green-900 py-3.5 rounded-full font-semibold transition-all duration-200 shadow-md text-base flex items-center justify-center ${
                      isLoading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-900"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer
        quickLinks={[]}
        contactInfo={{}}
        handleNavigation={handleNavigation}
      />
    </div>
  );
};

export default Login;
