"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "../component/Header";
import Footer from "../component/Footer";
import Modal from "../component/Modal";
import login_bg from "../../assets/images/login_bg.png";
import { motion } from "framer-motion";
import { fetchWithInternalToken } from "../../lib/fetch";

const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    title: "",
    message: "",
  });

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus("failed");
        showModal(
          "error",
          "Verification Failed",
          "No verification token found."
        );
        return;
      }

      try {
        const response = await fetchWithInternalToken("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();
        // console.log("Data" + data);

        if (data.success) {
          setVerificationStatus("success");
          showModal("success", "Verification Successful", data.message);

          // Redirect to login page after a delay
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000); // 2-second delay before redirecting
        } else {
          setVerificationStatus("failed");
          showModal("error", "Verification Failed", data.error);
        }
      } catch (error) {
        setVerificationStatus("failed");
        showModal(
          "error",
          "Verification Failed",
          "An error occurred while verifying your email."
        );
      }
    };

    verifyEmail();
  }, [token]);

  const showModal = (type, title, message) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: "", title: "", message: "" });
  };

  const handleNavigation = (path) => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative font-inter">
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
        currentPath="/verify-email"
        variant="minimal"
      />

      <div className="w-full flex flex-col items-center justify-center h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg bg-white/15 rounded-lg p-8 shadow-xl border border-white/30 text-white text-center"
        >
          {verificationStatus === "verifying" && (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Verifying your email...
              </h2>
              <p>Please wait while we verify your email address.</p>
            </>
          )}
          {verificationStatus === "success" && (
            <>
              <h2 className="text-3xl font-bold mb-4 text-green-400">
                Email Verified!
              </h2>
              <p className="mb-6">
                Your email has been successfully verified. You will be
                redirected to the login page shortly.
              </p>
            </>
          )}
          {verificationStatus === "failed" && (
            <>
              <h2 className="text-3xl font-bold mb-4 text-red-500">
                Verification Failed
              </h2>
              <p className="mb-6">{modal.message}</p>
              <button
                onClick={() => handleNavigation("/register")}
                className="bg-green-700 hover:bg-green-800 cursor-pointer text-white font-bold py-2 px-4 rounded"
              >
                Go to Register
              </button>
            </>
          )}
        </motion.div>
      </div>

      <Footer
        quickLinks={[]}
        contactInfo={{}}
        handleNavigation={handleNavigation}
      />

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

const VerifyEmail = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <VerifyEmailContent />
  </Suspense>
);

export default VerifyEmail;
