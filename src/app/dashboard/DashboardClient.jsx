"use client";

import { useState, Suspense } from "react";
import Loading from "../loading";
import React from "react";
import { ROLES } from "../../lib/roles";
import Toast from "../component/Toast";

const PublicUserDashboard = React.lazy(() =>
  import("./components/PublicUserDashboard")
);
const ResearchExpertDashboard = React.lazy(() =>
  import("./components/ResearchExpertDashboard")
);
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));
export default function DashboardClient({ user }) {
  const [toast, setToast] = useState({
    message: "",
    type: "success",
    show: false,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast({ message: "", type: "success", show: false });
    }, 3000);
  };

  const [selectedItem, setSelectedItem] = useState("Dashboard");

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const renderRoleSpecificDashboard = () => {
    const props = {
      user,
      selectedItem,
      handleSelectItem,
      showToast,
    };
    switch (user?.role) {
      case ROLES.ADMIN:
        return <AdminDashboard {...props} />;
      case ROLES.RESEARCH_EXPERT:
        return <ResearchExpertDashboard {...props} />;
      case ROLES.PUBLIC_USER:
      default:
        return <PublicUserDashboard {...props} />;
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex min-h-screen text-[#263a2d]">
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
        {renderRoleSpecificDashboard()}
      </div>
    </Suspense>
  );
}
