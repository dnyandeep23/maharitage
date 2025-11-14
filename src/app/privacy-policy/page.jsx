"use client";

import React from "react";
import Header from "../component/Header";
import Footer from "../component/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-green-50 text-gray-800">
      <Header theme="light" />

      <main className="grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-6 sm:mb-8 text-center">
            Privacy Policy
          </h1>

          <p className="mb-4 text-sm sm:text-base">
            Last updated: October 26, 2023
          </p>

          <p className="mb-6 text-sm sm:text-base">
            Welcome to Maharitage! This Privacy Policy describes how Maharitage
            ("we," "us," or "our") collects, uses, and discloses your
            information when you use our website and services (the "Service").
            By accessing or using the Service, you agree to the collection and
            use of information in accordance with this policy.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            1. Information We Collect
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            We collect several types of information for various purposes to
            provide and improve our Service to you.
          </p>
          <h3 className="text-xl sm:text-2xl font-medium text-green-600 mb-3 mt-6">
            Personal Data
          </h3>
          <p className="mb-4 text-sm sm:text-base">
            While using our Service, we may ask you to provide us with certain
            personally identifiable information that can be used to contact or
            identify you ("Personal Data"). Personally identifiable information
            may include, but is not limited to:
          </p>
          <ul className="list-disc list-inside ml-4 mb-4 text-sm sm:text-base">
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Usage Data</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-medium text-green-600 mb-3 mt-6">
            Usage Data
          </h3>
          <p className="mb-4 text-sm sm:text-base">
            We may also collect information on how the Service is accessed and
            used ("Usage Data"). This Usage Data may include information such as
            your computer's Internet Protocol address (e.g., IP address),
            browser type, browser version, the pages of our Service that you
            visit, the time and date of your visit, the time spent on those
            pages, unique device identifiers, and other diagnostic data.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            2. How We Use Your Information
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            Maharitage uses the collected data for various purposes:
          </p>
          <ul className="list-disc list-inside ml-4 mb-4 text-sm sm:text-base">
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>
              To allow you to participate in interactive features of our Service
              when you choose to do so
            </li>
            <li>To provide customer support</li>
            <li>
              To gather analysis or valuable information so that we can improve
              our Service
            </li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent, and address technical issues</li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            3. Disclosure Of Data
          </h2>
          <h3 className="text-xl sm:text-2xl font-medium text-green-600 mb-3 mt-6">
            Legal Requirements
          </h3>
          <p className="mb-4 text-sm sm:text-base">
            Maharitage may disclose your Personal Data in the good faith belief
            that such action is necessary to:
          </p>
          <ul className="list-disc list-inside ml-4 mb-4 text-sm sm:text-base">
            <li>To comply with a legal obligation</li>
            <li>To protect and defend the rights or property of Maharitage</li>
            <li>
              To prevent or investigate possible wrongdoing in connection with
              the Service
            </li>
            <li>
              To protect the personal safety of users of the Service or the
              public
            </li>
            <li>To protect against legal liability</li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            4. Security Of Data
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            The security of your data is important to us, but remember that no
            method of transmission over the Internet or method of electronic
            storage is 100% secure. While we strive to use commercially
            acceptable means to protect your Personal Data, we cannot guarantee
            its absolute security.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            5. Changes To This Privacy Policy
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
            You are advised to review this Privacy Policy periodically for any
            changes. Changes to this Privacy Policy are effective when they are
            posted on this page.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            6. Contact Us
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            If you have any questions about this Privacy Policy, please contact
            us at: support@maharitage.com
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
