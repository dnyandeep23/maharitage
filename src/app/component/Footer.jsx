import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Globe } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { name: "Elephanta Cave", href: "/caves/elephanta" },
    { name: "Ajanta Caves", href: "/caves/ajanta" },  
    { name: "Ellora Cave", href: "/caves/ellora" }
  ];

  const contactInfo = {
    email: "info@maharitage.com",
    phone: "+91 98765 43210",
    address: "Mumbai, Maharashtra"
  };

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/maharitage", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com/maharitage", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com/maharitage", label: "Instagram" },
    { icon: Globe, href: "https://maharitage.com", label: "Website" }
  ];

  const handleNavigation = (href) => {
    if (href.startsWith('http')) {
      window.open(href, '_blank');
    } else {
      // Handle internal navigation
      // console.log(`Navigate to: ${href}`);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white rounded-full opacity-50"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h2 className="text-4xl font-bold tracking-wide mb-4 font-cinzel-decorative">
                MAHARITAGE
              </h2>
              <p className="text-green-100 text-lg leading-relaxed max-w-md" style={{ fontFamily: "'Inter', sans-serif" }}>
                Preserving and promoting Maharashtra's magnificent cave heritage for future generations.
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleNavigation(social.href)}
                    className="group bg-green-800/50 hover:bg-white/20 p-3 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg backdrop-blur-sm"
                    aria-label={social.label}
                  >
                    <IconComponent className="w-5 h-5 text-green-100 group-hover:text-white transition-colors duration-200" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-semibold mb-8 text-green-100" style={{ fontFamily: "'Playfair Display', serif" }}>
              Quick Links
            </h3>
            <ul className="space-y-4">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavigation(link.href)}
                    className="group text-green-200 hover:text-white text-lg transition-all duration-300 flex items-center space-x-2"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full group-hover:bg-white transition-colors duration-300"></span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">{link.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-semibold mb-8 text-green-100" style={{ fontFamily: "'Playfair Display', serif" }}>
              Contact Us
            </h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 group">
                <div className="bg-green-700/50 p-2 rounded-lg group-hover:bg-green-600/50 transition-colors duration-300">
                  <Mail className="w-5 h-5 text-green-200" />
                </div>
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Email</p>
                  <p className="text-white text-lg hover:text-green-200 transition-colors duration-300 cursor-pointer" 
                     onClick={() => window.open(`mailto:${contactInfo.email}`)}>
                    {contactInfo.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="bg-green-700/50 p-2 rounded-lg group-hover:bg-green-600/50 transition-colors duration-300">
                  <Phone className="w-5 h-5 text-green-200" />
                </div>
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Phone</p>
                  <p className="text-white text-lg hover:text-green-200 transition-colors duration-300 cursor-pointer"
                     onClick={() => window.open(`tel:${contactInfo.phone}`)}>
                    {contactInfo.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="bg-green-700/50 p-2 rounded-lg group-hover:bg-green-600/50 transition-colors duration-300">
                  <MapPin className="w-5 h-5 text-green-200" />
                </div>
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Location</p>
                  <p className="text-white text-lg">{contactInfo.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-green-700/50">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <p className="text-green-200 text-xs sm:text-sm text-center lg:text-left" style={{ fontFamily: "'Inter', sans-serif" }}>
              © 2025 Maharitage. All rights reserved. | Preserving Maharashtra's Cave Heritage
            </p>
            
            {/* Additional Links */}
            <div className="flex flex-wrap justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-green-200">
              <button className="hover:text-white transition-colors duration-300">Privacy Policy</button>
              <button className="hover:text-white transition-colors duration-300">Terms of Service</button>
              <button className="hover:text-white transition-colors duration-300">Sitemap</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;