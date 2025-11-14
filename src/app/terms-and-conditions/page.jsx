"use client";

import React from "react";
import Header from "../component/Header";
import Footer from "../component/Footer";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen flex flex-col bg-green-50 text-gray-800">
      <Header theme="light" />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-6 sm:mb-8 text-center">
            Terms and Conditions
          </h1>

          <p className="mb-4 text-sm sm:text-base">
            Last updated: October 26, 2023
          </p>

          <p className="mb-6 text-sm sm:text-base">
            Please read these Terms and Conditions ("Terms", "Terms and
            Conditions") carefully before using the Maharitage website and
            services (the "Service") operated by Maharitage ("us", "we", or
            "our").
          </p>
          <p className="mb-6 text-sm sm:text-base">
            Your access to and use of the Service is conditioned on your
            acceptance of and compliance with these Terms. These Terms apply to
            all visitors, users, and others who access or use the Service.
          </p>
          <p className="mb-6 text-sm sm:text-base">
            By accessing or using the Service you agree to be bound by these
            Terms. If you disagree with any part of the terms then you may not
            access the Service.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            1. Accounts
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            When you create an account with us, you must provide us with
            information that is accurate, complete, and current at all times.
            Failure to do so constitutes a breach of the Terms, which may result
            in immediate termination of your account on our Service.
          </p>
          <p className="mb-4 text-sm sm:text-base">
            You are responsible for safeguarding the password that you use to
            access the Service and for any activities or actions under your
            password, whether your password is with our Service or a third-party
            service.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            2. Intellectual Property
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            The Service and its original content (excluding content provided by
            users), features, and functionality are and will remain the
            exclusive property of Maharitage and its licensors. The Service is
            protected by copyright, trademark, and other laws of both the India
            and foreign countries. Our trademarks and trade dress may not be
            used in connection with any product or service without the prior
            written consent of Maharitage.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            3. Links To Other Web Sites
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            Our Service may contain links to third-party web sites or services
            that are not owned or controlled by Maharitage.
          </p>
          <p className="mb-4 text-sm sm:text-base">
            Maharitage has no control over, and assumes no responsibility for,
            the content, privacy policies, or practices of any third party web
            sites or services. You further acknowledge and agree that Maharitage
            shall not be responsible or liable, directly or indirectly, for any
            damage or loss caused or alleged to be caused by or in connection
            with use of or reliance on any such content, goods or services
            available on or through any such web sites or services.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            4. Termination
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            We may terminate or suspend your account immediately, without prior
            notice or liability, for any reason whatsoever, including without
            limitation if you breach the Terms.
          </p>
          <p className="mb-4 text-sm sm:text-base">
            Upon termination, your right to use the Service will immediately
            cease. If you wish to terminate your account, you may simply
            discontinue using the Service.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            5. Disclaimer
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            Your use of the Service is at your sole risk. The Service is
            provided on an "AS IS" and "AS AVAILABLE" basis. The Service is
            provided without warranties of any kind, whether express or implied,
            including, but not limited to, implied warranties of
            merchantability, fitness for a particular purpose, non-infringement
            or course of performance.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            6. Governing Law
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            These Terms shall be governed and construed in accordance with the
            laws of India, without regard to its conflict of law provisions.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            7. Changes To These Terms And Conditions
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            We reserve the right, at our sole discretion, to modify or replace
            these Terms at any time. If a revision is material we will try to
            provide at least 30 days' notice prior to any new terms taking
            effect. What constitutes a material change will be determined at our
            sole discretion.
          </p>
          <p className="mb-4 text-sm sm:text-base">
            By continuing to access or use our Service after those revisions
            become effective, you agree to be bound by the revised terms. If you
            do not agree to the new terms, please stop using the Service.
          </p>

          <h2 className="text-2xl sm:text-3xl font-semibold text-green-700 mb-4 mt-8">
            8. Contact Us
          </h2>
          <p className="mb-4 text-sm sm:text-base">
            If you have any questions about these Terms, please contact us at:
            support@maharitage.com
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
