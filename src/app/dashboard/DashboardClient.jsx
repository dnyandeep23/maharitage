"use client";

import { useState, Suspense } from "react";
import Loading from "../loading";
import React from "react";
import { ROLES } from "../../lib/roles";

const PublicUserDashboard = React.lazy(() =>
  import("./components/PublicUserDashboard")
);
const ResearchExpertDashboard = React.lazy(() =>
  import("./components/ResearchExpertDashboard")
);
const AdminDashboard = React.lazy(() => import("./components/AdminDashboard"));

export default function DashboardClient({ user }) {
  const [selectedItem, setSelectedItem] = useState("Dashboard");

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  const renderRoleSpecificDashboard = () => {
    switch (user?.role) {
      case ROLES.ADMIN:
        return (
          <AdminDashboard
            user={user}
            selectedItem={selectedItem}
            handleSelectItem={handleSelectItem}
          />
        );
      case ROLES.RESEARCH_EXPERT:
        return (
          <ResearchExpertDashboard
            user={user}
            selectedItem={selectedItem}
            handleSelectItem={handleSelectItem}
          />
        );
      case ROLES.PUBLIC_USER:
      default:
        return (
          <PublicUserDashboard
            user={user}
            selectedItem={selectedItem}
            handleSelectItem={handleSelectItem}
          />
        );
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="text-green-800">{renderRoleSpecificDashboard()}</div>
    </Suspense>
  );
}
