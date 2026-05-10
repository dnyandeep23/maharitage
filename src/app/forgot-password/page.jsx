'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '../component/Header';
import Footer from '../component/Footer';
import login_bg from '../../assets/images/login_bg.png';
import Image from 'next/image';
import { Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import Toast from '../component/Toast';
import { fetchWithInternalToken } from '../../lib/fetch';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const handleNavigation = (path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setToast({ show: true, message: 'Please enter your email address.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchWithInternalToken('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({ show: true, message: 'If an account exists with this email, a password reset link will be sent.', type: 'success' });
      } else {
        setToast({ show: true, message: data.message || 'An error occurred.', type: 'error' });
      }
    } catch (error) {
      setToast({ show: true, message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell flex flex-col font-inter">
      {toast.show && <Toast message={toast.message} type={toast.type} onDone={() => setToast({ show: false, message: '', type: '' })} />}
      {/* Background */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image
          src={login_bg}
          alt="Forgot Password Background"
          fill
          priority
          className="object-cover w-full h-full"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#071b15]/70 -z-10" />

      {/* Header */}
      <Header
        handleNavigation={handleNavigation}
        currentPath={usePathname()}
        variant="minimal"
      />

      {/* Main Section */}
      <div className="w-full flex flex-col items-center justify-center min-h-screen py-28">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-10 md:gap-28 px-5 sm:px-8 lg:px-14">
          {/* Left Section */}
          <div className="flex-1 flex flex-col justify-center items-start text-white">
            <p className="archive-kicker text-[#d9c18a]">Account recovery</p>
            <h2 className="mt-4 font-cinzel-decorative text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Forgot Your Password?
            </h2>
            <p className="text-base md:text-lg text-white/72 leading-8 max-w-xl">
              Enter your email address below and we'll send you a link to reset your password.
            </p>
            <div className="mt-12 md:mt-24 text-base md:text-lg">
              <p>
                Remember your password?{" "}
                <span
                  className="text-[#d9c18a] font-bold cursor-pointer hover:underline"
                  onClick={() => handleNavigation("/login")}
                >
                  Sign In
                </span>
              </p>
            </div>
          </div>

          {/* Right Section - Forgot Password Card */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="auth-panel relative w-full max-w-lg p-5 sm:p-8 xl:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-5 top-4 text-[#123327] w-5 h-5" />
                  <input
                    type="email"
                    className="w-full pl-14 pr-5 py-3.5 bg-[#fffdf7]/88 placeholder-stone-500 border border-[#d8c7a8] rounded-full focus:outline-none focus:ring-2 focus:ring-[#d9c18a] text-stone-800 text-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="someone@example.com"
                    required
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`self-end w-48 bg-[#d9c18a] hover:bg-[#ead8a5] text-[#071b15] py-3.5 rounded-full font-bold transition-all duration-200 shadow-md text-base flex items-center justify-center ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
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
    </div>
  );
};

export default ForgotPassword;
