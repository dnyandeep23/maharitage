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
import { isValidEmail } from "../../lib/validation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(ROLES.PUBLIC_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [fieldErrors, setFieldErrors] = useState({});
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
    const errors = {};

    if (!email || !password) {
      setToast({ show: true, message: "Please enter both email and password.", type: "error" });
      return;
    }

    if (!isValidEmail(email)) {
      errors.email = "Invalid email format";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
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
    <div className="auth-shell flex flex-col font-inter">
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

      <div className="absolute inset-0 bg-[#071b15]/70 -z-10" />

      <Header
        handleNavigation={handleNavigation}
        currentPath={usePathname()}
        variant="minimal"
        theme="dark"
      />

      <div className="w-full flex flex-col items-center justify-center min-h-screen py-28">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-10 md:gap-28 px-5 sm:px-8 lg:px-14">
          <div className="flex-1 flex flex-col sm:mt14 justify-center items-start text-white">
            <p className="archive-kicker text-[#d9c18a]">Archive access</p>
            <h2 className="mt-4 font-cinzel-decorative text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Welcome back to MahaRitage
            </h2>
            <p className="text-base md:text-lg text-white/72 leading-8 max-w-xl">
              Access your account to explore heritage data, manage research, or
              continue your journey through Maharashtra's archive.
            </p>
            <div className="mt-12 md:mt-24 text-base md:text-lg">
              <p>
                Don't have an account?{" "}
                <span
                  className="text-[#d9c18a] font-bold cursor-pointer hover:underline"
                  onClick={() => handleNavigation("/register")}
                >
                  Sign Up
                </span>
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="auth-panel relative w-full max-w-lg p-5 sm:p-8 xl:p-10">
              <div className="relative flex justify-center items-center rounded-full p-1 mb-10 w-full">
                <motion.div
                  className="absolute top-1 bottom-1 rounded-full bg-[#123327]/95 backdrop-blur-sm shadow-lg"
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
                  <Mail className="absolute left-5 top-4 text-[#123327] w-5 h-5" />
                  <input
                    type="email"
                    className={`w-full pl-14 pr-5 py-3.5 bg-[#fffdf7]/88 placeholder-stone-500 border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-[#d8c7a8] focus:ring-[#d9c18a]'} rounded-full focus:outline-none focus:ring-2 text-stone-800 text-base`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="someone@example.com"
                    required
                  />
                  {fieldErrors.email && <p className="text-red-400 text-sm mt-1 px-4">{fieldErrors.email}</p>}
                </div>

                <div className="relative">
                  <Lock className="absolute left-5 top-4 text-[#123327] w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full pl-14 pr-12 py-3.5 bg-[#fffdf7]/88 placeholder-stone-500 border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-[#d8c7a8] focus:ring-[#d9c18a]'} rounded-full focus:outline-none focus:ring-2 text-stone-800 text-base`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-4 text-[#123327]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {fieldErrors.password && <p className="text-red-400 text-sm mt-1 px-4">{fieldErrors.password}</p>}
                </div>

                <div className="text-right text-sm">
                  <button
                    type="button"
                    className="text-[#d9c18a] hover:underline"
                    onClick={() => handleNavigation("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`self-end w-32 bg-[#d9c18a] hover:bg-[#ead8a5] text-[#071b15] py-3.5 rounded-full font-bold transition-all duration-200 shadow-md text-base flex items-center justify-center ${
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
