import React from "react";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

const Footer = () => {
  const router = useRouter();

  const quickLinks = [
    { name: "Kanheri Cave", href: "/heritage/Kan0004" },
    { name: "Ajanta Caves", href: "/heritage/Aja0003" },
    { name: "Ellora Cave", href: "/heritage/Ell0001" },
  ];

  const contactInfo = {
    email: "maharitage.maharastra@gmail.com",
    phone: "Currently Unavailable",
    address: "Mumbai, Maharashtra",
  };

  const handleNavigation = (href) => {
    if (href.startsWith("http")) {
      window.open(href, "_blank");
    } else {
      router.push(href);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-[#071b15] text-[#fbf7ee]">
      <div className="absolute inset-0 heritage-texture opacity-[0.08]" />
      <div className="absolute inset-0 bg-linear-to-br from-[#071b15] via-[#123327] to-[#15120d]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[#d9c18a]/35" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-4xl font-bold tracking-wide mb-4 font-cinzel-decorative">
                MAHARITAGE
              </h2>
              <p className="text-[#fbf7ee]/72 text-base leading-8 max-w-md">
                A cinematic digital archive for Maharashtra's forts, caves,
                inscriptions, architecture, and living cultural memory.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h3 className="mb-8 font-playfair-display text-2xl font-semibold text-[#d9c18a]">
              Collection
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavigation(link.href)}
                    className="group text-[#fbf7ee]/72 hover:text-white text-base transition-all duration-300 flex items-center space-x-2"
                  >
                    <ArrowUpRight className="h-4 w-4 text-[#d9c18a]" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-1">
            <h3 className="mb-8 font-playfair-display text-2xl font-semibold text-[#d9c18a]">
              Contact Us
            </h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 group">
                <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/15 transition-colors duration-300">
                  <Mail className="w-5 h-5 text-[#d9c18a]" />
                </div>
                <div>
                  <p className="text-[#fbf7ee]/56 text-sm font-medium mb-1">
                    Email
                  </p>
                  <p
                    className="text-white text-base hover:text-[#d9c18a] transition-colors duration-300 cursor-pointer break-all"
                    onClick={() => window.open(`mailto:${contactInfo.email}`)}
                  >
                    {contactInfo.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/15 transition-colors duration-300">
                  <Phone className="w-5 h-5 text-[#d9c18a]" />
                </div>
                <div>
                  <p className="text-[#fbf7ee]/56 text-sm font-medium mb-1">
                    Phone
                  </p>
                  <p
                    className="text-white text-base hover:text-[#d9c18a] transition-colors duration-300 cursor-pointer"
                    onClick={() => window.open(`tel:${contactInfo.phone}`)}
                  >
                    {contactInfo.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/15 transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-[#d9c18a]" />
                </div>
                <div>
                  <p className="text-[#fbf7ee]/56 text-sm font-medium mb-1">
                    Location
                  </p>
                  <p className="text-white text-base">{contactInfo.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-[#d9c18a]/18">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <p className="text-[#fbf7ee]/56 text-xs sm:text-sm text-center lg:text-left">
              © 2026 MahaRitage. All rights reserved. | Preserving Maharashtra's
              heritage archive
            </p>

            {/* Additional Links */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-[#fbf7ee]/60">
              <button
                className="hover:text-white transition-colors duration-300"
                onClick={() => router.push("/privacy-policy")}
              >
                Privacy Policy
              </button>

              <button
                className="hover:text-white transition-colors duration-300"
                onClick={() => router.push("/terms-and-conditions")}
              >
                Terms of Service
              </button>

              {/* Sitemap with Tooltip */}
              <div className="relative group">
                <button
                  className="hover:text-white transition-colors duration-300"
                  onClick={() => router.push("/sitemap.xml")}
                >
                  Sitemap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
