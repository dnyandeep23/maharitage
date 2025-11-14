"use client";

import { useState, Suspense, useEffect } from "react";
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
const DesktopOnlyView = React.lazy(() =>
  import("./components/DesktopOnlyView")
);

export default function DashboardClient({ user }) {
  const [isDesktop, setIsDesktop] = useState(true); // Assume desktop initially

  useEffect(() => {
    const checkDevice = () => {
      // Using 1024px as the breakpoint for desktop (common for `lg` in Tailwind)
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Check on initial mount
    checkDevice();

    // Add event listener for window resize
    window.addEventListener("resize", checkDevice);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

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
      {isDesktop ? (
        <div className="flex min-h-screen text-green-800">
          {renderRoleSpecificDashboard()}
        </div>
      ) : (
        <DesktopOnlyView />
      )}
    </Suspense>
  );
}
