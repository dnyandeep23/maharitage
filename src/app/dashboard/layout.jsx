'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '../component/loading';
import React from 'react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  if (loading) {
    return <Loading />;
  }

  return (
      <div className="min-h-screen bg-gray-100">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 md:hidden bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Sidebar Backdrop for Mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-0 w-64 h-full bg-white shadow-lg z-50 
                        transform transition-transform duration-300 ease-in-out
                        md:transform-none
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex flex-col h-full">
            {/* User Info */}
            <div className="p-4 md:p-6 border-b">
              <div className="font-semibold text-lg">{user?.name}</div>
              <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push('/dashboard/profile')}
                    className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                  >
                    Profile
                  </button>
                </li>
                {user?.role === 'admin' && (
                  <li>
                    <button
                      onClick={() => router.push('/dashboard/users')}
                      className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                    >
                      Manage Users
                    </button>
                  </li>
                )}
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t">
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    localStorage.removeItem('auth-token');
                    router.push('/login');
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="w-full px-4 py-2 text-red-600 rounded hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="transition-all duration-300 ease-in-out
                        md:ml-64 p-4 sm:p-6 md:p-8
                        pt-16 md:pt-8">
          <div className="max-w-7xl mx-auto">
            {React.cloneElement(children, { user: user })}
          </div>
        </div>
      </div>
  );
}