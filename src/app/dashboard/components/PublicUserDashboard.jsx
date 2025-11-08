import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dashboardImage from "../../../assets/images/dashboard-bg.png";
import Header from "../../component/Header";
import { LayoutDashboard, User, Key } from "lucide-react";
import Footer from "../../component/Footer";
import AIFloatingButton from "../../component/AIFloatingButton";
import Sidebar from "./Sidebar";
import Profile from "./shared/Profile";
import ApiKeyManagement from "./shared/ApiKeyManagement";

const PublicUserDashboard = ({ user, selectedItem, handleSelectItem }) => {
  const router = useRouter();
  const stats = [
    { label: "Heritage Sites", value: 5 },
    { label: "Active Projects", value: 3 },
    { label: "Community Members", value: 3 },
    { label: "Uploaded Photos", value: 45 },
  ];

  const sidebarSections = [
    [
      {
        name: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        onClick: () => handleSelectItem("Dashboard"),
      },
      {
        name: "Profile",
        icon: <User size={20} />,
        onClick: () => handleSelectItem("Profile"),
      },
      {
        name: "API Keys",
        icon: <Key size={20} />,
        onClick: () => handleSelectItem("API Keys"),
      },
    ],
    [
      {
        name: "Logout",
        onClick: async () => {
          try {
            await fetch("/api/auth/logout", { method: "POST" });
            localStorage.removeItem("auth-token");
            router.push("/login");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ],
  ];

  return (
    <div>
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Header */}
        <Header currentPath="/dashboard" theme="dark" />

        {/* Background */}
        <div className="relative w-full">
          <Image
            src={dashboardImage}
            alt="Dashboard"
            width={1920}
            height={1080}
            className="w-full h-screen object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-20" />

          {/* Dashboard Content */}
          <div className="absolute inset-0 flex justify-center items-center gap-5 z-30">
            <Sidebar
              user={user}
              sidebarSections={sidebarSections}
              router={router}
              selectedItem={selectedItem}
            />

            {/* Main Section */}
            <div className="w-[75%] h-[80vh] p-10 rounded-4xl bg-[#FFFD99]/50 overflow-y-auto">
              {selectedItem === "Dashboard" && (
                <>
                  <p className="text-green-950 font-bold text-xl">
                    Welcome,
                    <span className="text-4xl font-extrabold text-green-700">
                      {" "}
                      {user?.username}
                    </span>
                  </p>

                  {/* Main Content */}
                  <div className="flex flex-col gap-6 text-green-900 mt-4">
                    <p className="leading-relaxed text-lg">
                      Welcome to{" "}
                      <span className="font-semibold text-green-800">
                        Maharitage
                      </span>{" "}
                      — a digital gateway to explore, preserve, and celebrate
                      the cultural and historical legacy of Maharashtra. From
                      ancient temples to majestic forts, every corner tells a
                      story of devotion, courage, and artistry. Through this
                      platform, you can discover heritage sites, follow
                      restoration efforts, and take part in protecting the
                      identity that defines us.
                    </p>

                    <blockquote className="italic border-l-4 border-green-700 pl-4">
                      “Heritage is not just about monuments — it’s about keeping
                      our roots alive through awareness and action.”
                    </blockquote>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {stats.map((item, idx) => (
                        <div
                          key={idx}
                          className="border border-dashed border-green-700 rounded-xl p-4 text-center"
                        >
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-sm font-medium">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    <blockquote className="italic border-l-4 border-green-700 pl-4">
                      “The past is never gone — it lives within every story we
                      preserve.”
                    </blockquote>

                    <p className="leading-relaxed">
                      Your contribution helps revive lost chapters of our
                      history and make them accessible to all. Together, let’s
                      build a bridge between our glorious past and a sustainable
                      future — where heritage meets innovation.
                    </p>
                  </div>
                </>
              )}
              {selectedItem === "Profile" && <Profile user={user} />}
              {selectedItem === "API Keys" && <ApiKeyManagement />}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Button + Footer */}
      <AIFloatingButton />
      <Footer />
    </div>
  );
};

export default PublicUserDashboard;
