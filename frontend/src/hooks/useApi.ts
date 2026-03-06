import { useState, useEffect, useCallback } from 'react';
import { auth, dashboard as dashboardApi } from '@/lib/api';

/**
 * Hook to fetch dashboard stats from API.
 * Falls back to mock data when not authenticated or on API error.
 */
export function useDashboardStats() {
  const [data, setData] = useState<{
    activeAgents: string;
    researchTasks: string;
    memoryNodes: string;
    systemLoad: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  const fetchData = useCallback(async () => {
    if (!auth.isAuthenticated() || useMock) {
      setData({
        activeAgents: '12',
        researchTasks: '1,492',
        memoryNodes: '8.4M',
        systemLoad: '24%',
      });
      setLoading(false);
      return;
    }
    try {
      const res = await dashboardApi.getStats();
      setData(res);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setData({
        activeAgents: '12',
        researchTasks: '1,492',
        memoryNodes: '8.4M',
        systemLoad: '24%',
      });
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
