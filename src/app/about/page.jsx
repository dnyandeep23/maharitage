"use client";

import Image from "next/image";
import React, { useState } from "react";
import aboutImg from "../../assets/images/about.png";
import Footer from "../component/Footer";
import Header from "../component/Header";
import { ChevronDown, ChevronUp, Mail, MapPin, Phone } from "lucide-react";
import Toast from "../component/Toast";
import { fetchWithInternalToken } from "../../lib/fetch";

const faqs = [
  {
    question: "What is Maharitage?",
    answer:
      "Maharitage is a digital platform dedicated to celebrating and preserving the rich cultural, historical, and artistic legacy of Maharashtra through verified site records, visual archives, and educational tools.",
  },
  {
    question: "How can I explore different heritage sites?",
    answer:
      "Use the homepage archive carousel, search page, or AI guide to discover forts, caves, temples, inscriptions, periods, districts, and curated site records.",
  },
  {
    question: "Is Maharitage free to use?",
    answer:
      "Yes. Public browsing, search, gallery viewing, and core archive access are free. Some institutional workflows are available to authenticated contributors and administrators.",
  },
  {
    question: "Can I contribute information, photos, or stories?",
    answer:
      "Yes. Researchers and contributors can submit records through dashboard workflows. Submissions are reviewed so the archive remains credible and useful.",
  },
  {
    question: "Does Maharitage include forts and monuments?",
    answer:
      "Yes. Forts, caves, monuments, inscriptions, architectural sections, historical context, and preservation metadata are part of the archive model.",
  },
  {
    question: "How does Maharitage support digital preservation?",
    answer:
      "The platform structures photographs, references, geography, metadata, and cultural descriptions into reusable digital records for future research and learning.",
  },
];

function About() {
  const [openIndex, setOpenIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetchWithInternalToken("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setToast({
          show: true,
          message: "Message sent successfully!",
          type: "success",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        throw new Error("Failed to send message.");
      }
    } catch (error) {
      setToast({
        show: true,
        message: "An error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="heritage-surface heritage-texture min-h-screen text-stone-900">
      <Header theme="light" currentPath="/about" />
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "" })}
        />
      )}

      <section className="relative min-h-[78vh] overflow-hidden bg-[#071b15] text-white">
        <Image
          src={aboutImg}
          alt="Maharitage archive"
          fill
          className="object-cover object-center opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-br from-[#071b15]/86 via-[#071b15]/38 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-[#f7f3ea] via-[#f7f3ea]/55 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-end px-5 pb-24 pt-32 sm:px-8 lg:px-14">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d9c18a]">
            About MahaRitage
          </p>
          <h1 className="mt-4 max-w-4xl font-cinzel-decorative text-5xl font-bold leading-[0.95] md:text-7xl">
            A cinematic archive for Maharashtra’s memory
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/82">
            MahaRitage brings forts, caves, inscriptions, photographs, references, and cultural context into a unified digital heritage platform.
          </p>
        </div>
      </section>

      <main className="relative px-5 pb-20 sm:px-8 lg:px-14">
        <section className="mx-auto grid max-w-7xl gap-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="museum-card-premium p-6 sm:p-8">
            <p className="relative z-10 text-xs font-bold uppercase tracking-[0.24em] text-[#8a6a31]">
              Mission
            </p>
            <h2 className="relative z-10 mt-3 font-cinzel-decorative text-3xl font-bold text-[#123327]">
              Preservation with depth, access, and dignity
            </h2>
            <div className="relative z-10 mt-5 space-y-5 text-base leading-8 text-stone-700">
              <p>
                Our mission is to preserve, promote, and celebrate Maharashtra’s legacy through carefully structured digital records. Each site becomes more than a page: it becomes a place where geography, history, images, architecture, inscriptions, and references can live together.
              </p>
              <p>
                We believe heritage is not only monuments or artifacts. It is the relationship between people, place, memory, and responsibility. MahaRitage is built to help students, researchers, travelers, and institutions explore that relationship with clarity.
              </p>
            </div>
          </article>

          <aside className="grid gap-4">
            {[
              ["Verified records", "Structured metadata, references, and gallery evidence."],
              ["Field-first visuals", "Immersive image presentation for inspection and storytelling."],
              ["Institutional workflows", "Dashboards for site, inscription, and preservation management."],
            ].map(([title, copy]) => (
              <div key={title} className="museum-card-premium p-5">
                <h3 className="relative z-10 font-cinzel-decorative text-xl font-bold text-[#123327]">
                  {title}
                </h3>
                <p className="relative z-10 mt-2 text-sm leading-6 text-stone-600">{copy}</p>
              </div>
            ))}
          </aside>
        </section>

        <section className="mx-auto max-w-5xl py-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.28em] text-[#8a6a31]">
            FAQ
          </p>
          <h2 className="mt-3 text-center font-cinzel-decorative text-3xl font-bold text-[#123327] md:text-4xl">
            Common questions
          </h2>

          <div className="mt-8 flex flex-col gap-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.question}
                  className="museum-card-premium overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-[#123327]"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <div
                    className={`overflow-hidden px-5 text-sm leading-7 text-stone-700 transition-all duration-300 ${
                      isOpen ? "max-h-72 pb-5 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="museum-card-premium p-6">
            <p className="relative z-10 text-xs font-bold uppercase tracking-[0.24em] text-[#8a6a31]">
              Contact
            </p>
            <h2 className="relative z-10 mt-3 font-cinzel-decorative text-3xl font-bold text-[#123327]">
              Reach the archive team
            </h2>
            <p className="relative z-10 mt-4 text-sm leading-7 text-stone-600">
              Share corrections, collaboration requests, or preservation notes for future archival review.
            </p>

            <iframe
              title="Maharitage Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d884.8877093301818!2d72.83527814210072!3d19.1235554232819!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9d90e067ba9%3A0x16268e5d6bca2e6a!2sBharatiya%20Vidya%20Bhavan&#39;s%20Sardar%20Patel%20Institute%20of%20Technology%20(SPIT)!5e0!3m2!1sen!2sin!4v1762007529062!5m2!1sen!2sin"
              width="100%"
              height="280"
              style={{ border: 0, borderRadius: "24px" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="relative z-10 mt-6"
            />

            <div className="relative z-10 mt-5 grid gap-3">
              <div className="flex items-center gap-4 rounded-2xl border border-[#123327]/10 bg-[#fffdf7]/70 px-4 py-3">
                <Phone className="text-[#8a6a31]" size={20} />
                <div>
                  <p className="font-semibold text-[#123327]">Currently Not Available</p>
                  <p className="text-xs text-stone-500">From 10 am to 7 pm</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-[#123327]/10 bg-[#fffdf7]/70 px-4 py-3">
                <Mail className="text-[#8a6a31]" size={20} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#123327]">
                    maharitage.maharastra@gmail.com
                  </p>
                  <p className="text-xs text-stone-500">24x7 Available</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-[#123327]/10 bg-[#fffdf7]/70 px-4 py-3">
                <MapPin className="text-[#8a6a31]" size={20} />
                <p className="text-sm font-semibold text-[#123327]">Mumbai, Maharashtra</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="museum-card-premium p-6 sm:p-8">
            <p className="relative z-10 text-xs font-bold uppercase tracking-[0.24em] text-[#8a6a31]">
              Message
            </p>
            <h3 className="relative z-10 mt-3 font-cinzel-decorative text-3xl font-bold text-[#123327]">
              Send a note
            </h3>

            <div className="relative z-10 mt-7 grid gap-5">
              <div>
                <label className="archive-label block">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                  className="archive-input mt-1 w-full rounded-2xl px-4 py-3"
                />
              </div>

              <div>
                <label className="archive-label block">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="archive-input mt-1 w-full rounded-2xl px-4 py-3"
                />
              </div>

              <div>
                <label className="archive-label block">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message..."
                  maxLength={400}
                  rows={5}
                  required
                  className="archive-input mt-1 w-full resize-none rounded-2xl px-4 py-3"
                />
                <p className="mt-2 text-right text-xs text-stone-500">
                  {formData.message.length}/400
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#123327] px-6 py-3 font-bold text-[#fbf7ee] transition hover:bg-[#071b15] disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;
