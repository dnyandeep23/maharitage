import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dashboardImage from "../../../assets/images/dashboard-bg.png";
import Header from "../../component/Header";
import { Bell, Compass, Key, LayoutDashboard, User, Users, ChevronRight } from "lucide-react";
import Footer from "../../component/Footer";
import AIFloatingButton from "../../component/AIFloatingButton";
import Sidebar from "./Sidebar";
import Profile from "./shared/Profile";
import ApiKeyManagement from "./shared/ApiKeyManagement";
import { fetchWithInternalToken } from "../../../lib/fetch";
import { motion } from "framer-motion";
import useDashboardStats from "./useDashboardStats";

const PublicUserDashboard = ({
  user,
  selectedItem,
  handleSelectItem,
  showToast,
}) => {
  const router = useRouter();
  const { stats: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const stats = [
    { label: "Total Users", value: dashboardStats.totalUsers, icon: <Users className="mb-2 h-5 w-5 text-blue-800" /> },
    { label: "Heritage Sites", value: dashboardStats.heritageSites, icon: <Compass className="mb-2 h-5 w-5 text-amber-800" /> },
    { label: "Pending Approvals", value: dashboardStats.pendingApprovals, icon: <Bell className="mb-2 h-5 w-5 text-stone-800" /> },
    { label: "Research Experts", value: dashboardStats.researchExperts, icon: <LayoutDashboard className="mb-2 h-5 w-5 text-emerald-800" /> },
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
            await fetchWithInternalToken("/api/auth/logout", { method: "POST" });
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
      <div className="min-h-screen bg-[#101b15] relative overflow-hidden">
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
          <div className="absolute inset-0 bg-[#101b15]/76 z-10" />
          <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_25%_20%,rgba(143,114,68,0.2),transparent_32%),linear-gradient(to_top,#f4ecdd,rgba(244,236,221,0.42),transparent)]" />

          {/* Dashboard Content */}
          <div className="absolute inset-0 z-30 flex flex-col items-stretch justify-start gap-4 overflow-y-auto px-3 pb-24 pt-24 sm:px-5 lg:flex-row lg:items-center lg:justify-center lg:gap-5 lg:px-8 lg:pb-6 lg:pt-28">
            <Sidebar
              user={user}
              sidebarSections={sidebarSections}
              router={router}
              selectedItem={selectedItem}
            />

            {/* Main Section */}
            <div className="dashboard-surface archive-scroll min-h-[64vh] w-full overflow-y-auto p-5 sm:p-8 lg:h-[80vh] lg:w-[75%] lg:p-10">
              {selectedItem === "Dashboard" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">
                      Explorer Console
                    </p>
                    <h1 className="mt-2 font-cinzel-decorative text-4xl font-bold leading-tight text-stone-900 sm:text-5xl">
                      Welcome, {user?.username}
                    </h1>
                    <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">
                      Explore Maharashtra's cultural records, manage API access,
                      and continue research journeys through curated heritage
                      data, galleries, and AI-guided context.
                    </p>
                  </div>

                  {/* Main Content */}
                  <div className="flex flex-col gap-10">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {stats.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="archive-stat-card p-5"
                        >
                          {item.icon}
                          <p className="text-4xl font-bold text-stone-900">
                            {statsLoading ? "--" : item.value.toLocaleString()}
                          </p>
                          <p className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{item.label}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-bold text-xl text-stone-900 mb-4">Quick Actions</h3>
                      <div className="grid gap-4 lg:grid-cols-3">
                        {[
                          { title: "Search Records", desc: "Find by place, period, or district" },
                          { title: "Developer Access", desc: "Generate API keys for raw data" },
                          { title: "AI Assistant", desc: "Use the AI guide for exploration" }
                        ].map((item, i) => (
                          <motion.button
                            key={item.title}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="archive-stat-card group flex flex-col justify-center p-5 text-left"
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="font-bold text-stone-900">{item.title}</span>
                              <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-emerald-700 transition" />
                            </div>
                            <span className="mt-2 text-sm text-stone-500">{item.desc}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {selectedItem === "Profile" && <Profile user={user} />}
              {selectedItem === "API Keys" && <ApiKeyManagement showToast={showToast} />}
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
