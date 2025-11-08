"use client";

import Image from "next/image";
import React, { useState } from "react";
import aboutImg from "../../assets/images/about.png";
import Footer from "../component/Footer";
import Header from "../component/Header";
import { ChevronDown, ChevronUp, Mail, Phone } from "lucide-react";
const faqs = [
  {
    question: "What is Maharitage?",
    answer:
      "Maharitage is a digital platform dedicated to celebrating and preserving the rich cultural, historical, and artistic legacy of Maharashtra. It serves as a bridge between tradition and technology — offering virtual access to forts, temples, festivals, and local art forms. Through Maharitage, we aim to bring Maharashtra’s diverse heritage closer to people of all ages, helping them learn, explore, and stay connected to their roots while also inspiring pride in our shared history.",
  },
  {
    question: "How can I explore different heritage sites on Maharitage?",
    answer:
      "You can explore Maharashtra’s heritage through our interactive ‘Explore’ section, which features detailed profiles of forts, caves, temples, museums, and traditional art hubs. Each listing includes immersive images, historical facts, location details, and cultural significance. We’ve designed the experience to be both educational and visually engaging — letting users take virtual tours, learn about key historical events, and even plan physical visits through integrated map links and travel tips.",
  },
  {
    question: "Is Maharitage free to use?",
    answer:
      "Yes, Maharitage is completely free to use for all visitors. We believe that culture and history should be accessible to everyone, regardless of where they are. While the core features such as site browsing, reading articles, and viewing galleries are free, some upcoming features like virtual guided tours or heritage workshops might include premium options to support our community-driven maintenance and content creation efforts.",
  },
  {
    question: "Can I contribute information, photos, or stories to Maharitage?",
    answer:
      "Definitely! Maharitage is a community-driven platform that thrives on user contributions. Whether you’re a historian, traveler, photographer, or simply someone with a story about your hometown, you can share verified information, images, or experiences through our ‘Contribute’ section. Every submission undergoes a review process to ensure authenticity and quality before being featured on the website, giving proper credit to contributors for their efforts in preserving Maharashtra’s heritage.",
  },
  {
    question:
      "What kind of festivals and traditions are featured on Maharitage?",
    answer:
      "We cover a wide range of festivals and traditions that highlight Maharashtra’s cultural spirit — from grand celebrations like Ganesh Chaturthi, Gudi Padwa, and Diwali to folk traditions such as Lavani performances, Powada songs, and Wari pilgrimages. Each festival page includes its historical background, symbolic meaning, rituals, and how it’s celebrated across different regions. Maharitage aims to create a space where users can not only learn about these traditions but also feel the emotional and communal essence behind them.",
  },
  {
    question:
      "Does Maharitage provide historical information about forts and monuments?",
    answer:
      "Yes! One of Maharitage’s core focuses is on Maharashtra’s monumental architecture and the stories they hold. From the mighty forts of Chhatrapati Shivaji Maharaj like Raigad, Pratapgad, and Sinhagad to the ancient caves of Ajanta and Ellora, each monument page features its architectural details, construction era, key events, and cultural impact. We also highlight restoration efforts and visitor guidelines to promote responsible tourism and preservation of these landmarks.",
  },
  {
    question:
      "How does Maharitage help in preserving Maharashtra’s culture digitally?",
    answer:
      "Maharitage digitizes heritage through high-quality visuals, articles, and curated storytelling. By making information accessible online, we’re ensuring that future generations can learn about Maharashtra’s legacy even as times change. We also collaborate with cultural organizations, historians, and volunteers to collect authentic data, digitize manuscripts, and document traditional art forms that might otherwise fade with time. Our long-term vision is to build an open digital archive for researchers, students, and culture enthusiasts.",
  },
  {
    question: "Can schools or institutions collaborate with Maharitage?",
    answer:
      "Yes, educational institutions are encouraged to collaborate with Maharitage for heritage awareness programs, student projects, or cultural exchange activities. We support schools and colleges in organizing heritage walks, art exhibitions, and workshops. Institutions can also request special digital resources or guided virtual sessions for their students to help them understand the historical and cultural significance of Maharashtra in an interactive way.",
  },
];

function About() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  return (
    <div className="w-screen bg-[#EAFFE1]">
      <Header theme="light" currentPath="/about" />
      <div className="w-full h-64 sm:h-96 relative overflow-hidden">
        <Image
          src={aboutImg}
          alt="About"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex justify-center items-center font-bold text-white/65 bg-black/40">
          <p className="text-4xl sm:text-7xl mt-10 sm:mt-20">About Us</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#EAFFE1] rounded-t-[100%] transform translate-y-1/2"></div>
      </div>
      <div className="relative z-10 bg-[#EAFFE1] pt-10 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-black mb-6">
            Maharitage
          </p>
          <p className="text-base sm:text-lg text-gray-800 leading-relaxed">
            Welcome to Maharitage — your digital gateway to the timeless beauty,
            culture, and heritage of Maharashtra.
            <br />
            <br />
            Our mission is simple yet powerful: to preserve, promote, and
            celebrate the rich legacy of Maharashtra by showcasing its
            magnificent forts, ancient caves, folk traditions, festivals, and
            living art forms that define the spirit of this vibrant land.
            <br />
            <br />
            Through Maharitage, we aim to bridge the past and the present,
            giving people a chance to explore and appreciate Maharashtra’s
            history in a modern, interactive way. From breathtaking landscapes
            and architectural marvels to local stories passed down through
            generations — every element is a window into the soul of this land.
            <br />
            <br />
            We believe heritage is not just about monuments or artifacts — it’s
            about the people, their values, and their connection to the land.
            Whether it’s the powerful tales of the Maratha warriors, the divine
            energy of ancient temples, or the colorful rhythm of folk dances
            like Lavani and Tamasha — every corner of Maharashtra tells a story
            worth sharing.
            <br />
            <br />
            Our platform brings together travelers, historians, artists, and
            cultural enthusiasts, encouraging everyone to discover, learn, and
            contribute to the collective memory of our state.
            <br />
            <br />
            Join us as we celebrate Maharashtra’s timeless legacy — where every
            fort whispers bravery, every festival radiates unity, and every
            tradition reminds us of who we are.
          </p>
        </div>
      </div>
      <div className="relative mt-14 py-32 flex flex-col items-center overflow-hidden">
        {/* Curved Background Layer */}
        <div className="absolute -left-[10vw] -right-[10vw] top-0 h-full bg-[#CDFFBE] rounded-[60%] z-0"></div>

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <p className="text-3xl md:text-4xl font-black text-black mb-10">
            FAQ
          </p>

          <div className="w-full max-w-3xl flex flex-col gap-4 px-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="bg-[#DFFFCB] rounded-2xl shadow-md transition-all duration-500 ease-in-out overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex justify-between items-center text-left px-6 py-4 font-semibold text-black"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>

                  <div
                    className={`transition-all duration-500 ease-in-out ${
                      isOpen
                        ? "max-h-[500px] opacity-100 py-4"
                        : "max-h-0 opacity-0 py-0"
                    } overflow-hidden px-6 text-gray-800 leading-relaxed text-sm`}
                  >
                    {faq.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <section className="bg-[#f3fee7] rounded-t-3xl sm:rounded-t-[40%] mt-16 pt-36 text-black pb-16 px-4 sm:px-6 md:px-20 font-inter">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          – Get in touch –
        </h2>

        <div className="flex flex-col px-4 sm:px-6 md:flex-row justify-center items-start gap-12">
          {/* Left Side */}
          <div className="flex flex-col gap-6 w-full md:w-[40%]">
            <p className="text-sm text-gray-700">
              Check out the map below to know where we’re located and how to
              reach us.
            </p>
            <iframe
              title="Maharitage Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d884.8877093301818!2d72.83527814210072!3d19.1235554232819!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9d90e067ba9%3A0x16268e5d6bca2e6a!2sBharatiya%20Vidya%20Bhavan&#39;s%20Sardar%20Patel%20Institute%20of%20Technology%20(SPIT)!5e0!3m2!1sen!2sin!4v1762007529062!5m2!1sen!2sin"
              width="100%"
              height="300"
              style={{ border: 0, borderRadius: "16px" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className=""
            ></iframe>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 bg-[#e3f7cf] rounded-full px-4 py-3 w-fit md:w-full">
                <Phone className="text-gray-700" size={22} />
                <div>
                  <p className="font-semibold text-gray-900">+91 98765 43210</p>
                  <p className="text-xs text-gray-600">From 10 am to 7 pm</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-[#e3f7cf] rounded-full px-4 py-3 w-fit md:w-full">
                <Mail className="text-gray-700" size={22} />
                <div>
                  <p className="font-semibold text-gray-900">
                    info@maharitage.com
                  </p>
                  <p className="text-xs text-gray-600">24×7 Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side (Form) */}
          <div className="bg-[#f3fee7] border border-[#e1f3c4] rounded-2xl p-6 w-full md:w-1/2 shadow-sm">
            <p className="text-gray-700 text-sm mb-1">Have a Question?</p>
            <h3 className="text-lg md:text-xl font-semibold mb-6">
              Drop me a message below !!
            </h3>

            <form className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full border-b border-gray-300 focus:border-gray-700 outline-none py-2 bg-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border-b border-gray-300 focus:border-gray-700 outline-none py-2 bg-transparent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  placeholder="Write your message..."
                  maxLength={400}
                  rows={4}
                  className="w-full border-b border-gray-300 focus:border-gray-700 outline-none py-2 bg-transparent resize-none"
                ></textarea>
                <p className="text-right text-xs text-gray-500">0/400</p>
              </div>

              <button
                type="submit"
                className="bg-[#c9ea94] text-black font-semibold py-3 rounded-full hover:bg-[#b8e176] transition-all"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default About;
