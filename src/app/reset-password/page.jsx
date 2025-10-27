'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Header from '../component/Header';
import Footer from '../component/Footer';
import login_bg from '../../assets/images/login_bg.png';
import Image from 'next/image';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import Toast from '../component/Toast';

const ResetPasswordContent = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCNFPassword, setShowCNFPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleNavigation = (path) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setToast({ show: true, message: 'Please enter and confirm your new password.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ show: true, message: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ show: true, message: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      // console.log(data);

      if (data.success) {
        setToast({ show: true, message: 'Password reset successful. You can now log in with your new password.', type: 'success' });
        setTimeout(() => handleNavigation('/login'), 3000);
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
    <div className="min-h-screen flex flex-col relative font-inter">
      {toast.show && <Toast message={toast.message} type={toast.type} onDone={() => setToast({ show: false, message: '', type: '' })} />}
      {/* Background */}
      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image
          src={login_bg}
          alt="Reset Password Background"
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
              Reset Your Password
            </h2>
            <p className="text-lg text-gray-200">
              Choose a new password for your account.
            </p>
          </div>

          {/* Right Section - Reset Password Card */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="relative w-full max-w-lg bg-white/15 rounded-[8rem] rounded-br-[10rem] rounded-bl-[15rem] p-16 shadow-xl border border-white/30">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-5 top-4 text-green-900 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-14 pr-12 py-3.5 bg-white/70 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 text-base"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
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
                    type={showCNFPassword ? "text" : "password"}
                    className="w-full pl-14 pr-12 py-3.5 bg-white/70 placeholder-gray-500 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 text-base"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-4 text-green-900"
                    onClick={() => setShowCNFPassword(!showCNFPassword)}
                  >
                    {showCNFPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`self-end w-48 bg-white/70 hover:bg-white text-green-900 py-3.5 rounded-full font-semibold transition-all duration-200 shadow-md text-base flex items-center justify-center ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
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
}

const ResetPassword = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ResetPasswordContent />
  </Suspense>
);

export default ResetPassword;
