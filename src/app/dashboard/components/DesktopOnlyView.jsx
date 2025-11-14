import React from "react";
import Image from "next/image";
import Header from "../../component/Header";
import dashboardImage from "../../../assets/images/dashboard-bg.png";

const DesktopOnlyView = () => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden w-full">
      <Header currentPath="/dashboard" theme="dark" />
      <div className="relative w-full">
        <Image
          src={dashboardImage}
          alt="Background"
          width={1920}
          height={1080}
          className="w-full h-screen object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-20" />
        <div className="absolute inset-0 flex flex-col justify-center items-center gap-5 z-30 text-center p-4">
          <div className="bg-[#FFFD99]/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-lg">
            <h1 className="text-3xl font-bold text-green-900 mb-4">
              Desktop Access Required
            </h1>
            <p className="text-lg text-green-800">
              For the best experience and full functionality, please access the
              dashboard from a desktop or laptop computer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopOnlyView;
