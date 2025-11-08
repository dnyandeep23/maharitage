"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dashboardImage from "../../../assets/images/dashboard-bg.png";
import Header from "../../component/Header";
import {
  LayoutDashboard,
  Users,
  PlusSquare,
  FilePlus,
  List,
  FileText,
  User,
  Bell,
} from "lucide-react";
import Footer from "../../component/Footer";
import AIFloatingButton from "../../component/AIFloatingButton";
import Sidebar from "./Sidebar";
import Profile from "./shared/Profile";
import AddSiteForm from "./shared/AddSiteForm";
import AddInscriptionForm from "./shared/AddInscriptionForm";
import ManageSites from "./shared/ManageSites";
import ManageInscriptions from "./shared/ManageInscriptions";
import DownloadData from "./admin/DownloadData";
import AddAdmin from "./admin/AddAdmin";
import ManageAdmins from "./admin/ManageAdmins";
import ReviewRequests from "./admin/ReviewRequests";

const AdminDashboard = ({ user, selectedItem, handleSelectItem }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("auth-token");
      setToken(storedToken);
    }
  }, []);
  const stats = [
    { label: "Total Users", value: 1250 },
    { label: "Heritage Sites", value: 150 },
    { label: "Pending Approvals", value: 15 },
    { label: "Reported Issues", value: 5 },
  ];

  const sidebarSections = [
    [
      {
        name: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        onClick: () => handleSelectItem("Dashboard"),
      },
    ],
    [
      {
        name: "Manage Sites",
        icon: <List size={20} />,
        onClick: () => handleSelectItem("Manage Sites"),
      },
      {
        name: "Manage Inscriptions",
        icon: <FileText size={20} />,
        onClick: () => handleSelectItem("Manage Inscriptions"),
      },
      {
        name: "Add Site",
        icon: <PlusSquare size={20} />,
        onClick: () => handleSelectItem("Add Site"),
      },
      {
        name: "Add Inscription",
        icon: <FilePlus size={20} />,
        onClick: () => handleSelectItem("Add Inscription"),
      },
    ],
    [
      {
        name: "Download Data",
        icon: <FilePlus size={20} />,
        onClick: () => handleSelectItem("Download Data"),
      },
    ],
    [
      {
        name: "Manage Admins",
        icon: <Users size={20} />,
        onClick: () => handleSelectItem("Manage Admins"),
      },
      {
        name: "Add Admin",
        icon: <Users size={20} />,
        onClick: () => handleSelectItem("Add Admin"),
      },
    ],
    [
      {
        name: "Review Requests",
        icon: <Bell size={20} />,
        onClick: () => handleSelectItem("Review Requests"),
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

  const handleAddSiteSubmit = async (
    e,
    siteData,
    images,
    rawSiteName,
    setRawSiteName,
    setSiteData,
    setImages,
    setMessage,
    setIsLoading
  ) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    if (rawSiteName.trim().length < 4) {
      setMessage({
        type: "error",
        text: "Site name must be at least 4 characters long.",
      });
      setIsLoading(false);
      return;
    }

    if (images.length === 0) {
      setMessage({ type: "error", text: "At least one image is required." });
      setIsLoading(false);
      return;
    }

    if (!siteData.Site_discription.trim()) {
      setMessage({ type: "error", text: "Description is required." });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("siteData", JSON.stringify(siteData));
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Site added successfully!" });
        // Clear form
        setSiteData({
          site_id: "",
          site_name: "",
          location: {
            latitude: "",
            longitude: "",
            district: "",
            state: "Maharashtra",
            country: "India",
          },
          Site_discription: "",
          heritage_type: "",
          period: "",
          historical_context: {
            ruler_or_dynasty: "",
            approx_date: "",
            related_figures: [],
            cultural_significance: "",
          },
          verification_authority: {
            curated_by: [],
          },
          references: [],
          Gallary: [],
          Inscriptions: [],
        });
        setRawSiteName("");
        setImages([]);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to add site.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInscriptionSubmit = async (
    e,
    inscriptionData,
    images,
    selectedSite,
    setInscriptionData,
    setImages,
    setMessage,
    setIsLoading
  ) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    if (!inscriptionData.discription.trim()) {
      setMessage({ type: "error", text: "Description is required." });
      setIsLoading(false);
      return;
    }

    if (images.length === 0) {
      setMessage({ type: "error", text: "At least one image is required." });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("inscriptionData", JSON.stringify(inscriptionData));
    formData.append("siteId", selectedSite);
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const response = await fetch("/api/inscriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Inscription added successfully!",
        });
        setInscriptionData({
          Inscription_id: "",
          discription: "",
          original_script: "",
          language_detected: "",
          translation: "",
          transliteration: "",
          era: "",
          dynasty: "",
          king: "",
          purpose: "",
          reference_to_gods: [],
          reference_to_people: [],
          reference_to_places: [],
          reference_to_events: [],
          reference_to_objects: [],
          reference_to_fauna: [],
          reference_to_flora: [],
          keywords: [],
          extra_notes: "",
          curated_by: [],
          verified_by: [],
          verification_status: "Pending",
          verification_date: "",
          verified_by_name: "",
          verified_by_email: "",
          verified_by_phone: "",
          verified_by_notes: "",
        });
        setImages([]);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to add inscription.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                      As an administrator of{" "}
                      <span className="font-semibold text-green-800">
                        Maharitage
                      </span>
                      , you have a crucial role in maintaining the integrity and
                      quality of the platform. Here, you can manage users,
                      oversee content, and ensure that the heritage of
                      Maharashtra is represented accurately and respectfully.
                    </p>

                    <blockquote className="italic border-l-4 border-green-700 pl-4">
                      “With great power comes great responsibility. Let's build
                      a platform that stands the test of time.”
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
                      “The digital preservation of our heritage is a vital task
                      for future generations.”
                    </blockquote>

                    <p className="leading-relaxed">
                      Your administrative actions help ensure a safe and
                      productive environment for all users. Thank you for your
                      dedication to preserving Maharashtra's rich cultural
                      legacy.
                    </p>
                  </div>
                </>
              )}
              {selectedItem === "Profile" && <Profile user={user} />}
              {selectedItem === "Manage Inscriptions" && (
                <ManageInscriptions showDelete={true} />
              )}
              {selectedItem === "Download Data" && <DownloadData />}
              {selectedItem === "Manage Admins" && <ManageAdmins />}
              {selectedItem === "Add Admin" && <AddAdmin />}
              {selectedItem === "Manage Sites" && (
                <ManageSites showDelete={true} />
              )}
              {selectedItem === "Add Site" && (
                <AddSiteForm handleSubmit={handleAddSiteSubmit} />
              )}
              {selectedItem === "Add Inscription" && (
                <AddInscriptionForm
                  handleSelectItem={handleSelectItem}
                  handleSubmit={handleAddInscriptionSubmit}
                />
              )}
              {selectedItem === "Review Requests" && <ReviewRequests />}
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
