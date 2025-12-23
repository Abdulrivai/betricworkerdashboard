'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Stats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalWorkers: number;
  pendingApprovals: number;
  totalValue: number;
  onTimeCompletion: number;
  lateCompletion: number;
}

interface RecentProject {
  id: string;
  title: string;
  worker: { full_name: string } | null;
  status: string;
  current_deadline: string;
  project_value: number;
}

export function useDashboardData() {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalWorkers: 0,
    pendingApprovals: 0,
    totalValue: 0,
    onTimeCompletion: 0,
    lateCompletion: 0
  });

  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cache timestamp to prevent unnecessary refetches
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5000; // 5 seconds cache (reduced for real-time updates)

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      // Check if we have fresh data in cache
      const now = Date.now();
      if (!forceRefresh && now - lastFetchTime.current < CACHE_DURATION) {
        console.log('📦 Using cached dashboard data');
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching dashboard data...');

      // Fetch both in parallel for better performance - NO CACHE for real-time data
      const [statsResponse, projectsResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }),
        fetch('/api/admin/dashboard/recent-projects', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        })
      ]);

      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
      }
      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch recent projects: ${projectsResponse.status}`);
      }

      const [statsData, projectsData] = await Promise.all([
        statsResponse.json(),
        projectsResponse.json()
      ]);

      console.log('✅ Dashboard data loaded:', projectsData.projects?.length, 'projects');

      setStats(statsData.stats || stats);
      setRecentProjects(projectsData.projects || []);

      // Update cache timestamp
      lastFetchTime.current = now;

    } catch (error: any) {
      console.error('❌ Dashboard fetch error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch only - no auto-refresh
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    recentProjects,
    isLoading,
    error,
    refetch: () => fetchDashboardData(true) // Expose manual refresh with force
  };
}