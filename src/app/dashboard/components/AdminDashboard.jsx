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
import JSONUpload from "./shared/JSONUpload";
import Notification from "./Notification";
import { api } from "@/lib/api";
import { fetchWithInternalToken } from "../../../lib/fetch";

const AdminDashboard = ({ user, selectedItem, handleSelectItem }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState(null);

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
        name: "Manage inscriptions",
        icon: <FileText size={20} />,
        onClick: () => handleSelectItem("Manage inscriptions"),
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
      {
        name: "Upload JSON Data",
        icon: <FilePlus size={20} />,
        onClick: () => handleSelectItem("Upload JSON Data"),
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

  const handleAddSiteSubmit = async (
    e,
    siteData,
    images,
    rawSiteName,
    setRawSiteName,
    dispatch,
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

    if (!siteData.site_discription.trim()) {
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
      const response = await fetchWithInternalToken("/api/sites", {
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
        dispatch({ type: "RESET_FORM" });
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

  const handleModifySiteSubmit = async (
    e,
    siteData,
    images,
    rawSiteName,
    setMessage,
    setIsLoading,
    onUpdate,
    onCancel
  ) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("siteData", JSON.stringify(siteData));
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const response = await fetchWithInternalToken(`/api/sites/${siteData.site_id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Site updated successfully!" });
        onUpdate(result.site);
        setTimeout(() => {
          setMessage(null);
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to update site.",
        });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
      setTimeout(() => setMessage(null), 2000);
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
      const response = await fetchWithInternalToken("/api/inscriptions", {
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
          inscription_id: "",
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
      <div className="relative min-h-screen overflow-hidden bg-[#101b15]">
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
          <div className="absolute inset-0 z-10 bg-[#101b15]/76" />
          <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_25%_20%,rgba(143,114,68,0.2),transparent_32%),linear-gradient(to_top,#f4ecdd,rgba(244,236,221,0.42),transparent)]" />

          {/* Dashboard Content */}
          <div className="absolute inset-0 z-30 flex flex-col items-stretch justify-start gap-4 overflow-y-auto px-3 pb-24 pt-24 sm:px-5 lg:flex-row lg:items-center lg:justify-center lg:gap-5 lg:px-8 lg:pb-0 lg:pt-20">
            <Sidebar
              user={user}
              sidebarSections={sidebarSections}
              router={router}
              selectedItem={selectedItem}
            />

            {/* Main Section */}
            <div className="dashboard-surface archive-scroll min-h-[64vh] w-full overflow-y-auto p-5 text-stone-900 sm:p-8 lg:h-[80vh] lg:w-[75%] lg:p-10">
              <Notification message={message?.text} type={message?.type} />
              {selectedItem === "Dashboard" && (
                <div className="animate-fade-in">
                  <div className="mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">
                      Institutional Console
                    </p>
                    <h1 className="mt-2 font-cinzel-decorative text-4xl font-bold leading-tight text-stone-900 sm:text-5xl">
                      Welcome, {user?.username}
                    </h1>
                    <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">
                      Manage the MahaRitage archive through structured records, visual evidence, inscription data, and review workflows designed for cultural preservation teams.
                    </p>
                  </div>

                  {/* Main Content */}
                  <div className="flex flex-col gap-10">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {stats.map((item, idx) => (
                        <div
                          key={idx}
                          className="archive-stat-card p-5"
                        >
                          <p className="text-4xl font-bold text-stone-900">{item.value}</p>
                          <p className="mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-bold text-xl text-stone-900 mb-4">Core Workflows</h3>
                      <div className="grid gap-4 lg:grid-cols-3">
                        {[
                          { title: "Manage Heritage", desc: "Add forts with architecture and preservation metadata" },
                          { title: "Review Submissions", desc: "Review submitted heritage research records" },
                          { title: "System Operations", desc: "Maintain galleries, inscriptions, and API access" },
                        ].map((item) => (
                          <div key={item.title} className="archive-stat-card group flex cursor-pointer flex-col justify-center p-5 text-left">
                            <span className="font-bold text-stone-900">{item.title}</span>
                            <span className="mt-2 text-sm text-stone-500">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {selectedItem === "Profile" && <Profile user={user} />}
              {selectedItem === "Manage inscriptions" && (
                <ManageInscriptions showDelete={true} />
              )}
              {selectedItem === "Download Data" && <DownloadData />}
              {selectedItem === "Manage Admins" && <ManageAdmins />}
              {selectedItem === "Add Admin" && <AddAdmin />}
              {selectedItem === "Manage Sites" && (
                <ManageSites
                  showDelete={true}
                  handleSubmit={handleModifySiteSubmit}
                />
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
              {selectedItem === "Upload JSON Data" && <JSONUpload />}
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
