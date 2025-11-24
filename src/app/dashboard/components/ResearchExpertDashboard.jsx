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

    if (!siteData.Site_discription.trim()) {
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
          Inscription_id: "",
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
              <Notification message={message?.text} type={message?.type} />
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
                      As a Research Expert on{" "}
                      <span className="font-semibold text-green-800">
                        Maharitage
                      </span>
                      , your expertise is vital. This is your space to review
                      submissions, contribute to articles, and collaborate with
                      other experts to ensure the historical accuracy and
                      richness of the content we provide.
                    </p>

                    <blockquote className="italic border-l-4 border-green-700 pl-4">
                      “Through rigorous research and collaboration, we can piece
                      together the mosaic of our past.”
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
                      “Every fact verified, every story told, adds another layer
                      to our collective heritage.”
                    </blockquote>

                    <p className="leading-relaxed">
                      Your contributions are invaluable in our mission to create
                      a comprehensive and authoritative resource on
                      Maharashtra's heritage. Thank you for your dedication to
                      scholarly excellence.
                    </p>
                  </div>
                </>
              )}
              {selectedItem === "Profile" && <Profile user={user} />}
              {selectedItem === "API Keys" && (
                <ApiKeyManagement setMessage={setMessage} />
              )}
              {selectedItem === "Manage Sites" && (
                <ManageSites
                  showDelete={false}
                  handleSubmit={handleModifySiteSubmit}
                  setMessage={setMessage}
                />
              )}
              {selectedItem === "Manage Inscriptions" && (
                <ManageInscriptions
                  showDelete={false}
                  handleSubmit={handleModifyInscriptionSubmit}
                  setMessage={setMessage}
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
