"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "../component/Header";
import Footer from "../component/Footer";
import login_bg from "../../assets/images/login_bg.png";
import { motion } from "framer-motion";
import Modal from "../component/Modal";
import { fetchWithInternalToken } from "../../lib/fetch";

const EmailSentContent = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [resendStatus, setResendStatus] = useState("idle"); // idle, sending, sent, error

  useEffect(() => {
    if (!email) {
      // If no email, redirect to registration
      window.location.href = "/register";
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetchWithInternalToken(
          `/api/auth/verification-status?email=${email}`
        );
        const data = await response.json();
        if (data.success && data.isEmailVerified) {
          clearInterval(interval);
          window.location.href = "/login";
        }
      } catch (error) {
        // console.error('Error checking verification status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [email]);

  const handleResend = async () => {
    // console.log("handleResend")
    setResendStatus("sending");
    try {
      const response = await fetchWithInternalToken("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setResendStatus("sent");
      } else {
        // console.error('Error resending verification link:', data.message);
        // console.log(data)
        setResendStatus("error");
      }
    } catch (error) {
      setResendStatus("error");
    }
  };

  const handleNavigation = (path) => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  if (!email) {
    return null; // Render nothing while redirecting
  }

  return (
    <div className="min-h-screen flex flex-col relative font-inter">
      <div className="absolute inset-0 -z-20 w-full h-full">
        <Image
          src={login_bg}
          alt="Background"
          fill
          priority
          className="object-cover w-full h-full"
        />
      </div>

      <div className="absolute inset-0 bg-black/60 -z-10" />

      {/* <Header
                handleNavigation={handleNavigation}
                currentPath="/email-sent"
                variant="minimal"
            /> */}

      <div className="w-full flex flex-col items-center justify-center h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg bg-white/15 rounded-lg p-8 shadow-xl border border-white/30 text-white text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Check Your Email</h2>
          <p className="mb-6">
            We've sent a verification link to <strong>{email}</strong>. Please
            check your inbox and click the link to activate your account.
          </p>

          <div className="mb-6">
            <button
              onClick={handleResend}
              disabled={resendStatus === "sending"}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {resendStatus === "sending"
                ? "Sending..."
                : "Resend Verification Link"}
            </button>
            {resendStatus === "sent" && (
              <p className="text-green-400 mt-2">A new link has been sent.</p>
            )}
            {resendStatus === "error" && (
              <p className="text-red-500 mt-2">
                Failed to send a new link. Please try again.
              </p>
            )}
          </div>

          <p className="text-sm text-gray-300">
            This page will automatically redirect you after your email is
            verified.
          </p>
        </motion.div>
      </div>

      <Footer
        quickLinks={[]}
        contactInfo={{}}
        handleNavigation={handleNavigation}
      />
    </div>
  );
};

const EmailSentPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <EmailSentContent />
  </Suspense>
);

export default EmailSentPage;
