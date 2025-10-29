'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '../component/loading';
import React from 'react';
import { ROLES } from '../../lib/roles';

const PublicUserDashboard = React.lazy(() => import('./components/PublicUserDashboard'));
const ResearchExpertDashboard = React.lazy(() => import('./components/ResearchExpertDashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState('Dashboard');

  const handleSelectItem = (item) => {
    setSelectedItem(item);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error);
        }

        setUser(data.data);
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('auth-token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const renderRoleSpecificDashboard = () => {
    switch (user?.role) {
      case ROLES.ADMIN:
        return <AdminDashboard user={user} selectedItem={selectedItem} handleSelectItem={handleSelectItem} />;
      case ROLES.RESEARCH_EXPERT:
        return <ResearchExpertDashboard user={user} selectedItem={selectedItem} handleSelectItem={handleSelectItem} />;
      case ROLES.PUBLIC_USER:
      default:
        return <PublicUserDashboard user={user} selectedItem={selectedItem} handleSelectItem={handleSelectItem} />;
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      {renderRoleSpecificDashboard()}
    </Suspense>
  );
}
