'use client';

import React, { Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../lib/roles';

const PublicUserDashboard = React.lazy(() => import('./components/PublicUserDashboard'));
const ResearchExpertDashboard = React.lazy(() => import('./components/ResearchExpertDashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

export default function DashboardPage() {
  const { user } = useAuth();

  const renderRoleSpecificDashboard = () => {
    switch (user?.role) {
      case ROLES.ADMIN:
        return <AdminDashboard />;
      case ROLES.RESEARCH_EXPERT:
        return <ResearchExpertDashboard />;
      case ROLES.PUBLIC_USER:
      default:
        return <PublicUserDashboard />;
    }
  };

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        {renderRoleSpecificDashboard()}
      </Suspense>
    </div>
  );
}
