import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dashboardImage from "../../../assets/images/dashboard-bg.png";
import Header from "../../component/Header";
import {
  LayoutDashboard,
  FileText,
  User,
  PlusSquare,
  FilePlus,
  List,
  Key,
} from "lucide-react";
import AIFloatingButton from "../../component/AIFloatingButton";
import ManageSites from "./shared/ManageSites";
import ManageInscriptions from "./shared/ManageInscriptions";
import AddSiteForm from "./shared/AddSiteForm";
import AddInscriptionForm from "./shared/AddInscriptionForm";
import MySubmissions from "./researchExpert/MySubmissions";
import Sidebar from "./Sidebar";
import Profile from "./shared/Profile";
import ApiKeyManagement from "./shared/ApiKeyManagement";
import Footer from "../../component/Footer";
import { api } from "@/lib/api";
import Notification from "./Notification";
import { fetchWithInternalToken } from "../../../lib/fetch";

const ResearchExpertDashboard = ({ user, selectedItem, handleSelectItem }) => {
  const router = useRouter();
  const [message, setMessage] = useState(null);
  const stats = [
    { label: "Reviewed Articles", value: 50 },
    { label: "Pending Submissions", value: 10 },
    { label: "Collaborations", value: 5 },
    { label: "Published Research", value: 12 },
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
        name: "Suggest Site Changes",
        icon: <List size={20} />,
        onClick: () => handleSelectItem("Suggest Site Changes"),
      },
      {
        name: "Suggest Inscription Changes",
        icon: <FileText size={20} />,
        onClick: () => handleSelectItem("Suggest Inscription Changes"),
      },
      {
        name: "Suggest New Site",
        icon: <PlusSquare size={20} />,
        onClick: () => handleSelectItem("Suggest New Site"),
      },
      {
        name: "Suggest New Inscription",
        icon: <FilePlus size={20} />,
        onClick: () => handleSelectItem("Suggest New Inscription"),
      },
    ],
    [
      {
        name: "Submissions",
        icon: <FileText size={20} />,
        onClick: () => handleSelectItem("Submissions"),
      },
    ],
    [
      {
        name: "Logout",
        onClick: async () => {
          try {
            await fetchWithInternalToken("/api/auth/logout", {
              method: "POST",
            });
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
    setIsLoading
  ) => {
    e.preventDefault();
    setIsLoading(true);

    if (rawSiteName.trim().length < 4) {
      setMessage({
        type: "error",
        text: "Site name must be at least 4 characters long.",
      });
      setTimeout(() => setMessage(null), 2000);
      setIsLoading(false);
      return;
    }

    if (images.length === 0) {
      setMessage({ type: "error", text: "At least one image is required." });
      setTimeout(() => setMessage(null), 2000);
      setIsLoading(false);
      return;
    }

    if (!siteData.site_discription.trim()) {
      setMessage({ type: "error", text: "Description is required." });
      setTimeout(() => setMessage(null), 2000);
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("type", "site");
      formData.append("action", "add");
      formData.append("data", JSON.stringify(siteData));
      formData.append("researchExpertId", user.id);
      formData.append("changesDescription", "New site submission");
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetchWithInternalToken("/api/research-requests", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Site addition request submitted successfully for review!",
        });
        setTimeout(() => setMessage(null), 2000);
        // Clear form
        dispatch({ type: "RESET_FORM" });
        setRawSiteName("");
        setImages([]);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to submit site addition request.",
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
    setIsLoading
  ) => {
    e.preventDefault();
    setIsLoading(true);

    if (!inscriptionData.discription.trim()) {
      setMessage({ type: "error", text: "Description is required." });
      setTimeout(() => setMessage(null), 2000);
      setIsLoading(false);
      return;
    }

    if (images.length === 0) {
      setMessage({ type: "error", text: "At least one image is required." });
      setTimeout(() => setMessage(null), 2000);
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("type", "inscription");
      formData.append("action", "add");
      formData.append(
        "data",
        JSON.stringify({ ...inscriptionData, site_id: selectedSite })
      );
      formData.append("researchExpertId", user.id);
      formData.append("changesDescription", "New inscription submission");
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetchWithInternalToken("/api/research-requests", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Inscription addition request submitted successfully for review!",
        });
        setTimeout(() => setMessage(null), 2000);
        setInscriptionData({
          inscription_id: "",
          discription: "",
          original_script: "",
          language_detected: "",
          translations: {
            english: null,
            hindi: null,
          },
        });
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to submit request.",
        });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
      setTimeout(() => setMessage(null), 2000);
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

    try {
      const formData = new FormData();
      formData.append("type", "site");
      formData.append("action", "modify");
      formData.append("data", JSON.stringify(siteData));
      formData.append("researchExpertId", user.id);
      formData.append("changesDescription", "Site modification");
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetchWithInternalToken("/api/research-requests", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Site modification request submitted successfully for review!",
        });
        setTimeout(() => {
          setMessage(null);
          onCancel();
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to submit site modification request.",
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

  const handleModifyInscriptionSubmit = async (
    e,
    inscriptionData,
    images,
    siteId,
    setIsLoading
  ) => {
    e.preventDefault();
    setIsLoading(true);
    console.log(
      "Submitting modification for inscription:",
      inscriptionData,
      " on site:",
      siteId,
      " with images:",
      images,
      "loading state:",
      setIsLoading
    );
    try {
      const formData = new FormData();
      formData.append("type", "inscription");
      formData.append("action", "modify");
      console.log("Inscription Data being sent:", {
        ...inscriptionData,
        siteId,
      });
      formData.append(
        "data",
        JSON.stringify({ ...inscriptionData, site_id: siteId })
      );
      formData.append("researchExpertId", user.id);
      formData.append("changesDescription", "Inscription modification");
      images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetchWithInternalToken("/api/research-requests", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${api.getToken()}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Inscription modification request submitted successfully for review!",
        });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({
          type: "error",
          text:
            result.message ||
            "Failed to submit inscription modification request.",
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
                      Research Console
                    </p>
                    <h1 className="mt-2 font-cinzel-decorative text-4xl font-bold leading-tight text-stone-900 sm:text-5xl">
                      Welcome, {user?.username}
                    </h1>
                    <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-600">
                      Review records, propose corrections, submit new forts or
                      inscriptions, and maintain scholarly context through an
                      institutional archive workflow.
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
                          { title: "Suggest Additions", desc: "Suggest new fort and cave records with gallery evidence" },
                          { title: "Submit Corrections", desc: "Submit inscription changes for administrative review" },
                          { title: "Track Submissions", desc: "Track institutional submission history" },
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
              {selectedItem === "API Keys" && (
                <ApiKeyManagement setMessage={setMessage} />
              )}
              {selectedItem === "Suggest Site Changes" && (
                <ManageSites
                  showDelete={false}
                  handleSubmit={handleModifySiteSubmit}
                  setMessage={setMessage}
                />
              )}
              {selectedItem === "Suggest Inscription Changes" && (
                <ManageInscriptions
                  showDelete={false}
                  handleSubmit={handleModifyInscriptionSubmit}
                  setMessage={setMessage}
                />
              )}
              {selectedItem === "Suggest New Site" && (
                <AddSiteForm handleSubmit={handleAddSiteSubmit} />
              )}
              {selectedItem === "Suggest New Inscription" && (
                <AddInscriptionForm
                  handleSelectItem={handleSelectItem}
                  handleSubmit={handleAddInscriptionSubmit}
                />
              )}
              {selectedItem === "Submissions" && <MySubmissions />}
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
