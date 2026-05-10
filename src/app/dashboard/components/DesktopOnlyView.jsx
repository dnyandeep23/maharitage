import React from "react";
import Image from "next/image";
import Header from "../../component/Header";
import dashboardImage from "../../../assets/images/dashboard-bg.png";

const DesktopOnlyView = () => {
  return (
    <div className="min-h-screen bg-[#071b15] relative overflow-hidden w-full">
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
        <div className="absolute inset-0 bg-[#071b15]/74 z-10" />
        <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_25%_20%,rgba(185,146,74,0.2),transparent_32%),linear-gradient(to_top,#f7f3ea,rgba(247,243,234,0.42),transparent)]" />
        <div className="absolute inset-0 flex flex-col justify-center items-center gap-5 z-30 text-center p-4">
          <div className="museum-card p-8 max-w-lg">
            <p className="archive-kicker">Archival workspace</p>
            <h1 className="mt-3 font-cinzel-decorative text-3xl font-bold text-[#123327] mb-4">
              Desktop Access Required
            </h1>
            <p className="archive-copy">
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
