import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dashboardImage from "../../../assets/images/dashboard-bg.png";
import Header from "../../component/Header";
import { LayoutDashboard, FileText } from "lucide-react";
import Footer from "../../component/Footer";
import AIFloatingButton from "../../component/AIFloatingButton";
import Sidebar from "./Sidebar";

const ResearchExpertDashboard = ({ user, selectedItem, handleSelectItem }) => {
  const router = useRouter();
  const stats = [
    { label: "Reviewed Articles", value: 50 },
    { label: "Pending Submissions", value: 10 },
    { label: "Collaborations", value: 5 },
    { label: "Published Research", value: 12 },
  ];

  const sidebarSections = [
    [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, onClick: () => handleSelectItem('Dashboard') },
    ],
    [
      { name: "Submissions", icon: <FileText size={20} />, onClick: () => handleSelectItem('Submissions') },
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
                      As a Research Expert on{" "}
                      <span className="font-semibold text-green-800">
                        Maharitage
                      </span>
                      , your expertise is vital. This is your space to review submissions, contribute to articles, and collaborate with other experts to ensure the historical accuracy and richness of the content we provide.
                    </p>

                    <blockquote className="italic border-l-4 border-green-700 pl-4">
                      “Through rigorous research and collaboration, we can piece together the mosaic of our past.”
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
                      “Every fact verified, every story told, adds another layer to our collective heritage.”
                    </blockquote>

                    <p className="leading-relaxed">
                      Your contributions are invaluable in our mission to create a comprehensive and authoritative resource on Maharashtra's heritage. Thank you for your dedication to scholarly excellence.
                    </p>
                  </div>
                </>
              )}
              {selectedItem === 'Submissions' && <div>Submissions Content</div>}
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

export default ResearchExpertDashboard;
