"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithInternalToken } from "../../../lib/fetch";

const EMPTY_STATS = {
  totalUsers: 0,
  publicUsers: 0,
  researchExperts: 0,
  admins: 0,
  heritageSites: 0,
  pendingApprovals: 0,
  inscriptions: 0,
};

export default function useDashboardStats() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const response = await fetchWithInternalToken("/api/dashboard/stats", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load dashboard stats");
        }

        const data = await response.json();
        if (isMounted) {
          setStats({ ...EMPTY_STATS, ...data });
        }
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(() => ({ stats, isLoading }), [stats, isLoading]);
}
