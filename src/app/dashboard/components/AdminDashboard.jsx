import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dashboardImage from "../../../assets/images/dashboard-bg.png";
import Header from "../../component/Header";
import { LayoutDashboard, Users } from "lucide-react";
import Footer from "../../component/Footer";
import AIFloatingButton from "../../component/AIFloatingButton";
import Sidebar from "./Sidebar";
const AdminDashboard = ({ user, selectedItem, handleSelectItem }) => {
  const router = useRouter();
  const stats = [
    { label: "Total Users", value: 1250 },
    { label: "Heritage Sites", value: 150 },
    { label: "Pending Approvals", value: 15 },
    { label: "Reported Issues", value: 5 },
  ];

  const sidebarSections = [
    [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, onClick: () => handleSelectItem('Dashboard') },
    ],
    [
      { name: "Manage Users", icon: <Users size={20} />, onClick: () => handleSelectItem('Manage Users') },
    ],
    [
      {
        name: "Logout",
        onClick: async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('auth-token');
            router.push('/login');
          } catch (error) {
            console.error('Logout error:', error);
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
            <Sidebar user={user} sidebarSections={sidebarSections} router={router} />

            {/* Main Section */}
            <div className="w-[75%] h-[80vh] p-10 rounded-4xl bg-[#FFFD99]/50 overflow-y-auto">
              {selectedItem === 'Dashboard' && (
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
                      As an administrator of{" "}
                      <span className="font-semibold text-green-800">
                        Maharitage
                      </span>
                      , you have a crucial role in maintaining the integrity and
                      quality of the platform. Here, you can manage users, oversee
                      content, and ensure that the heritage of Maharashtra is
                      represented accurately and respectfully.
                    </p>

                    <blockquote className="italic border-l-4 border-green-700 pl-4">
                      “With great power comes great responsibility. Let's build a
                      platform that stands the test of time.”
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
                      “The digital preservation of our heritage is a vital task for
                      future generations.”
                    </blockquote>

                    <p className="leading-relaxed">
                      Your administrative actions help ensure a safe and productive
                      environment for all users. Thank you for your dedication to
                      preserving Maharashtra's rich cultural legacy.
                    </p>
                  </div>
                </>
              )}
              {selectedItem === 'Manage Users' && <div>Manage Users Content</div>}
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

export default AdminDashboard;
