'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const renderRoleSpecificContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Users"
              description="Manage system users"
              onClick={() => router.push('/dashboard/users')}
            />
            <DashboardCard
              title="Settings"
              description="System configuration"
              onClick={() => router.push('/dashboard/settings')}
            />
          </div>
        );

      case 'researcher':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Research Data"
              description="Access research materials"
              onClick={() => router.push('/dashboard/research')}
            />
            <DashboardCard
              title="Publications"
              description="Manage your publications"
              onClick={() => router.push('/dashboard/publications')}
            />
          </div>
        );

      case 'public':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Browse Collections"
              description="Explore heritage collections"
              onClick={() => router.push('/dashboard/collections')}
            />
            <DashboardCard
              title="My Bookmarks"
              description="View saved items"
              onClick={() => router.push('/dashboard/bookmarks')}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-sm sm:text-base text-gray-600">
          You are logged in as a {user?.role} user
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {renderRoleSpecificContent()}
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-4 sm:p-6 bg-white rounded-lg shadow-md hover:shadow-lg 
                 transition-all duration-200 ease-in-out
                 border border-gray-200 text-left w-full
                 hover:scale-102 focus:scale-102
                 focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      <h3 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">{description}</p>
    </button>
  );
}