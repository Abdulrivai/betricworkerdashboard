'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching dashboard data...');

      // Fetch stats
      const statsResponse = await fetch('/api/admin/dashboard/stats');
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
      }
      const statsData = await statsResponse.json();

      // Fetch recent projects
      const projectsResponse = await fetch('/api/admin/dashboard/recent-projects');
      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch recent projects: ${projectsResponse.status}`);
      }
      const projectsData = await projectsResponse.json();

      console.log('✅ Dashboard data loaded:', { statsData, projectsData });

      setStats(statsData.stats || stats);
      setRecentProjects(projectsData.projects || []);

    } catch (error: any) {
      console.error('❌ Dashboard fetch error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    recentProjects,
    isLoading,
    error,
    refetch: fetchDashboardData
  };
}