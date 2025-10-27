'use client';

import { Mail, MapPin, Phone, Facebook, Twitter, Send } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export default function MaharitageUI() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-gray-800 to-transparent h-96 flex items-center justify-between px-8 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop"
          alt="Header Background"
          fill
          className="absolute inset-0 object-cover opacity-30 -z-10"
          priority
        />
        <div className="relative z-10">
          <h1 className="text-white text-2xl font-bold">MAHARITAGE</h1>
        </div>
        <button className="relative z-10 bg-green-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-600">Register</button>
      </div>

      {/* About Section */}
      <div className="bg-gradient-to-b from-green-50 to-white py-20 px-8">
        <h2 className="text-center text-4xl font-bold mb-16 tracking-widest">ABOUT US</h2>

        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold mb-8">Maharitage</h3>

          <p className="text-gray-700 mb-6 leading-relaxed text-lg">
            Welcome to Maharitage — your digital gateway to the timeless beauty, culture, and heritage of Maharashtra.
          </p>

          <p className="text-gray-700 mb-12 leading-relaxed text-lg">
            Our mission is simple: to preserve, promote, and celebrate the rich legacy of Maharashtra by bringing its historical landmarks, cultural traditions, festivals, and local stories to people everywhere.
          </p>

          <p className="text-gray-700 mb-16 leading-relaxed text-lg">
            From the majestic forts of the Marathas to the spiritual aura of ancient temples, from vibrant folk art to mouth-watering cuisine — Maharitage is a platform where history meets the present, inspiring a deeper connection with the land and its people.
          </p>

          {/* Circular Images */}
          <div className="flex justify-center items-center gap-12 flex-wrap">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-8 border-green-200 shadow-lg flex-shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1469474937569-d2b59cc6e6a9?w=200&h=200&fit=crop"
                alt="Fort"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-8 border-green-200 shadow-lg flex-shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop"
                alt="Temple"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-8 border-green-200 shadow-lg flex-shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1464207687429-7505649dae38?w=200&h=200&fit=crop"
                alt="Heritage"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-b from-green-100 to-green-50 py-20 px-8">
        <h2 className="text-center text-4xl font-bold mb-16 tracking-widest">FAQ</h2>

        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-green-200 rounded-lg p-4 shadow-md hover:shadow-lg transition">
              <p className="text-gray-700 font-medium">Lorem ipsum dolor sit amet consectetur adipiscing elit?</p>
            </div>
          ))}
        </div>
      </div>

      {/* Get in Touch Section */}
      <div className="py-20 px-8 bg-white">
        <h2 className="text-center text-3xl font-bold mb-16 tracking-wide">– Get in touch –</h2>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Side - Map and Contact Info */}
          <div>
            <div className="relative bg-gray-300 rounded-lg overflow-hidden mb-8 h-64 w-full">
              <Image
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&h=300&fit=crop"
                alt="Map"
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">+91 98765-43210</p>
                  <p className="text-gray-600 text-sm">Mon-Sat 10 am-7 pm</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-800">info@maharitage.com</p>
                  <p className="text-gray-600 text-sm">24/7 Support</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="bg-green-50 rounded-lg p-8">
            <h3 className="text-xl font-bold mb-2 text-gray-800">Have a Question?</h3>
            <p className="text-gray-600 mb-8">Drop me a message below !!</p>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  placeholder="Your email"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-green-600 resize-none"
                  placeholder="Your message"
                ></textarea>
              </div>

              <button onClick={handleSubmit} className="w-full bg-green-500 text-white py-3 rounded-full font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2">
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}

    </div>
  );
}