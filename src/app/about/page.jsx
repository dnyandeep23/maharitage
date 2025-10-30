"use client";

import Image from "next/image";
import React from "react";
import aboutImg from "../../assets/images/about.png";
import about_content from "../../assets/images/about_content.svg";
import Footer from "../component/Footer";
import Header from "../component/Header";
function About() {
  return (
    <div className="w-screen bg-[#EAFFE1]">
      <Header theme="light" />
      <div className="w-full h-94 rounded-b-[190px] relative ">
        <Image
          src={aboutImg}
          alt="About"
          fill
          className="object-cover max-h-96 rounded-b-[190px] "
          priority
        />
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center font-bold text-7xl text-white/65 rounded-b-[190px] bg-black/40">
          <p className="mt-20">About Us</p>
        </div>
      </div>
      <div className="mt-10  text-black   rounded-full relative">
        <Image src={about_content}></Image>
        <div className="absolute top-[20%] left-[5%] w-3xl">
          <p className="text-6xl font-extrabold ">Maharitage</p>
          <p className="mt-10 text-xl">
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
      <div className="h-[190vh]"></div>
      <Footer />
    </div>
  );
}

export default About;
