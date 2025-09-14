'use client'
import { motion } from 'framer-motion';
import Image from 'next/image';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-6 text-center">
          About Maharitage
        </h1>
        <p className="text-lg text-amber-800 text-center max-w-3xl mx-auto mb-12">
          Discover the rich cultural heritage and historical treasures of Maharashtra through our interactive platform.
        </p>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-semibold text-amber-900">Our Mission</h2>
            <p className="text-amber-800">
              At Maharitage, we are dedicated to preserving and promoting the rich cultural heritage of Maharashtra. 
              Our mission is to create an engaging digital platform that connects people with the historical 
              monuments, traditional arts, and cultural practices that make Maharashtra unique.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative h-[300px] rounded-lg overflow-hidden shadow-xl"
          >
            <Image
              src="/about-mission.jpg"
              alt="Maharashtra Heritage"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-amber-900 mb-4">Interactive Exploration</h3>
            <p className="text-amber-800">
              Explore historical sites and monuments through interactive maps and virtual tours.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-amber-900 mb-4">Cultural Education</h3>
            <p className="text-amber-800">
              Learn about Maharashtra's traditions, festivals, and cultural practices through detailed guides.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-amber-900 mb-4">Heritage Preservation</h3>
            <p className="text-amber-800">
              Support initiatives to preserve and protect Maharashtra's historical landmarks.
            </p>
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl font-semibold text-amber-900 mb-8">Our Team</h2>
          <p className="text-amber-800 max-w-2xl mx-auto">
            Our dedicated team of historians, developers, and cultural enthusiasts works tirelessly 
            to bring Maharashtra's heritage to life in the digital age.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AboutPage;
