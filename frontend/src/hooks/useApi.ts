import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, dashboard as dashboardApi, createWebSocket } from '@/lib/api';

export function useDashboardStats() {
  const [data, setData] = useState<{
    activeAgents: string;
    researchTasks: string;
    memoryNodes: string;
    systemLoad: string;
    totalAgents?: string;
    runningResearch?: string;
    toolCount?: string;
    reportCount?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const fetchData = useCallback(async () => {
    if (!auth.isAuthenticated()) {
      setData({
        activeAgents: '0',
        researchTasks: '0',
        memoryNodes: '0',
        systemLoad: '5%',
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
        activeAgents: '0',
        researchTasks: '0',
        memoryNodes: '0',
        systemLoad: '0%',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (auth.isAuthenticated()) {
      cleanupRef.current = createWebSocket('dashboard', undefined, (event, payload) => {
        if (event === 'metrics' && payload) {
          setData(payload as typeof data);
        }
      });
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useDashboardActivity(limit = 10) {
  const [data, setData] = useState<Array<{ id: string; task: string; status: string; time: string; agent: string; depth?: string; focus?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      setLoading(false);
      return;
    }
    dashboardApi.getActivity(limit)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  return { data, loading };
}

export function useDashboardPerformance() {
  const [data, setData] = useState<Array<{ time: string; load: number; memory: number; researches?: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      setLoading(false);
      return;
    }
    dashboardApi.getPerformance()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function useDashboardHealth() {
  const [data, setData] = useState<{ health: number; apiLatency: string; memoryUsage: string; uptime: string; totalResearches?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      setLoading(false);
      return;
    }
    dashboardApi.getHealth()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
