/**
 * Verdant Foundry API Client
 * Base fetch wrapper for backend API Gateway (NestJS)
 */

const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:4000/api';
const WS_BASE = (import.meta.env?.VITE_WS_URL || 'ws://localhost:4000').replace(/^http/, 'ws');

function getToken(): string | null {
  return localStorage.getItem('vf_access_token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('vf_refresh_token');
}

function setToken(token: string): void {
  localStorage.setItem('vf_access_token', token);
}

function clearToken(): void {
  localStorage.removeItem('vf_access_token');
  localStorage.removeItem('vf_refresh_token');
}

export const auth = {
  getToken,
  setToken,
  clearToken,
  isAuthenticated: () => !!getToken(),
};

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) {
      clearToken();
      return false;
    }
    const data = (await res.json()) as { accessToken?: string };
    if (data.accessToken) {
      setToken(data.accessToken);
      return true;
    }
  } catch {
    clearToken();
  }
  return false;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return api<T>(path, options, true);
    clearToken();
    throw new Error('Unauthorized');
  }

  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || res.statusText || 'Request failed');
  }

  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res.text() as Promise<T>;
}

/** WebSocket for research stream - subscribe to research events */
export function createResearchSocket(researchId: string, onEvent: (event: string, payload: unknown) => void) {
  const ws = new WebSocket(`${WS_BASE}/ws`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ event: 'subscribe-research', data: researchId }));
  };
  ws.onmessage = (e) => {
    try {
      const { event, payload } = JSON.parse(e.data) as { event: string; payload: unknown };
      onEvent(event, payload);
    } catch {
      // ignore
    }
  };
  return () => ws.close();
}

// Auth
export async function login(email: string, password: string) {
  const data = await api<{ accessToken: string; refreshToken: string }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }
  );
  setToken(data.accessToken);
  localStorage.setItem('vf_refresh_token', data.refreshToken);
  return data;
}

export async function register(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
) {
  const data = await api<{ accessToken: string; refreshToken: string }>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    }
  );
  setToken(data.accessToken);
  localStorage.setItem('vf_refresh_token', data.refreshToken);
  return data;
}

// Dashboard
export const dashboard = {
  getStats: () => api<{ activeAgents: string; researchTasks: string; memoryNodes: string; systemLoad: string }>('/dashboard/stats'),
  getActivity: (limit?: number) =>
    api<Array<{ id: string; task: string; status: string; time: string; agent: string }>>(
      limit ? `/dashboard/activity?limit=${limit}` : '/dashboard/activity'
    ),
  getPerformance: () =>
    api<Array<{ time: string; load: number; memory: number }>>('/dashboard/performance'),
  getToolUsage: () =>
    api<Array<{ name: string; calls: number }>>('/dashboard/tool-usage'),
  getHealth: () =>
    api<{ health: number; apiLatency: string; memoryUsage: string; uptime: string }>('/dashboard/health'),
};

// Agents
export const agents = {
  list: () => api<Array<{ id: string; name: string; role: string; status: string; tasks: number; uptime: string }>>('/agents'),
  get: (id: string) => api(`/agents/${id}`),
  getLogs: (id: string, limit?: number) =>
    api<Array<{ id: string; timestamp: string; agent: string; message: string; type: string; researchId: string; researchQuery: string }>>(
      `/agents/${id}/logs${limit ? `?limit=${limit}` : ''}`
    ),
  getMemory: (id: string) =>
    api<{ summary: { nodeCount: number }; recentNodes: Array<{ id: string; title: string; type: string; tags: string[]; size: string; createdAt: string }> }>(
      `/agents/${id}/memory`
    ),
  create: (data: { name: string; role: string; objective?: string }) =>
    api('/agents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; role: string; objective: string }>) =>
    api(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/agents/${id}`, { method: 'DELETE' }),
  action: (id: string, action: string) =>
    api(`/agents/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
};

// Tools
export const tools = {
  list: () => api<Array<{ id: string; name: string; type: string; calls: string; status: string }>>('/tools'),
  get: (id: string) => api(`/tools/${id}`),
  create: (data: { name: string; type?: string; description?: string; code?: string }) =>
    api<{ id: string; name: string; type: string }>('/tools', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; type: string; description: string; code: string }>) =>
    api(`/tools/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/tools/${id}`, { method: 'DELETE' }),
  execute: (id: string, params?: Record<string, unknown>) =>
    api<{ success: boolean; logs: string[]; result: unknown }>(`/tools/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ params }),
    }),
  getLogs: (id: string, limit?: number) =>
    api<Array<{ id: string; success: boolean; params: unknown; result: unknown; logs: string[]; createdAt: string }>>(
      `/tools/${id}/logs${limit ? `?limit=${limit}` : ''}`
    ),
};

// Memory
export const memory = {
  list: (query?: string, tags?: string[]) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (tags?.length) params.set('tags', tags.join(','));
    return api(`/memory?${params.toString()}`);
  },
  getGraph: () => api<{ nodes: unknown[]; edges: unknown[] }>('/memory/graph'),
  getStats: () => api<{ nodeCount: number; sizeBytes: number; sizeMB: string }>('/memory/stats'),
  search: (query: string, tags?: string[], limit?: number) =>
    api('/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query, tags, limit }),
    }),
  createDocument: (data: { title: string; type: string; content: string; tags?: string[] }) =>
    api('/memory/documents', { method: 'POST', body: JSON.stringify(data) }),
  get: (id: string) => api(`/memory/${id}`),
  remove: (id: string) => api(`/memory/${id}`, { method: 'DELETE' }),
};

// Research
export const research = {
  start: (query: string, depth?: string, focus?: string) =>
    api<{ id: string; status: string }>('/research/start', {
      method: 'POST',
      body: JSON.stringify({ query, depth, focus }),
    }),
  list: (limit?: number) =>
    api<Array<{ id: string; query: string; depth: string; focus: string; status: string; startedAt: string; completedAt: string | null }>>(
      limit ? `/research?limit=${limit}` : '/research'
    ),
  get: (id: string) => api(`/research/${id}`),
  getReport: (id: string) => api<{ content: string; metadata?: unknown }>(`/research/${id}/report`),
  updateReport: (id: string, content: string) =>
    api<{ content: string; metadata?: unknown }>(`/research/${id}/report`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
  getLogs: (id: string) =>
    api<Array<{ id: string; timestamp: string; agent: string; message: string; type: string }>>(
      `/research/${id}/logs`
    ),
  search: (query: string, limit?: number) =>
    api<Array<{ id: string; query: string; content: string; score: number | null; status: string; startedAt: string }>>(
      '/research/search',
      { method: 'POST', body: JSON.stringify({ query, limit }) },
    ),
};

// Reports
export const reports = {
  list: () =>
    api<Array<{ id: string; title: string; blocks: unknown; themeId: string | null; layoutId: string | null; createdAt: string; updatedAt: string }>>('/reports'),
  get: (id: string) =>
    api<{ id: string; title: string; blocks: Array<{ type: string; content: string; meta?: Record<string, unknown> }>; themeId: string | null; layoutId: string | null }>(`/reports/${id}`),
  create: (data: { title: string; blocks?: unknown[]; themeId?: string; layoutId?: string }) =>
    api('/reports', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; blocks?: unknown[]; themeId?: string; layoutId?: string }) =>
    api(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/reports/${id}`, { method: 'DELETE' }),
  createFromResearch: (researchId: string) =>
    api<{ id: string; title: string }>(`/reports/from-research/${researchId}`, { method: 'POST' }),
  updateBlock: (id: string, blockIndex: number, block: { type: string; content: string; meta?: Record<string, unknown> }) =>
    api(`/reports/${id}/blocks/${blockIndex}`, { method: 'PATCH', body: JSON.stringify(block) }),
  addBlock: (id: string, block: { type: string; content: string; meta?: Record<string, unknown>; afterIndex?: number }) =>
    api(`/reports/${id}/blocks`, { method: 'POST', body: JSON.stringify(block) }),
  removeBlock: (id: string, blockIndex: number) =>
    api(`/reports/${id}/blocks/${blockIndex}`, { method: 'DELETE' }),
  reorderBlocks: (id: string, fromIndex: number, toIndex: number) =>
    api(`/reports/${id}/blocks/reorder`, { method: 'PATCH', body: JSON.stringify({ fromIndex, toIndex }) }),
  getThemes: () =>
    api<Array<{ id: string; name: string; colors: string[] }>>('/reports/themes'),
  getLayouts: () =>
    api<Array<{ id: string; name: string; columns: number }>>('/reports/layouts'),
  exportUrl: (id: string, format: 'pdf' | 'html' | 'markdown' | 'docx' = 'pdf') =>
    `${API_BASE}/reports/${id}/export?format=${format}`,
};

// Evolution
export const evolution = {
  getSimulations: () =>
    api<Array<{ id: string; name: string; status: string; progress: number; agent: unknown }>>('/evolution/simulations'),
  getSimulation: (id: string) => api(`/evolution/simulations/${id}`),
  createSimulation: (data: { name: string; agentId: string; config?: object }) =>
    api('/evolution/simulations', { method: 'POST', body: JSON.stringify(data) }),
  simulationAction: (id: string, action: string) =>
    api(`/evolution/simulations/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
  getSuggestions: (type?: string) =>
    api<Array<{ id: number; type: string; target: string; title: string; description: string; impact: string }>>(
      type ? `/evolution/suggestions?type=${type}` : '/evolution/suggestions'
    ),
  createFeedback: (data: { entityType: string; entityId: string; thumbsUp: boolean }) =>
    api('/evolution/feedback', { method: 'POST', body: JSON.stringify(data) }),
  getExperiments: () => api<Array<{ id: string; name: string; status: string }>>('/evolution/experiments'),
  getExperiment: (id: string) => api(`/evolution/experiments/${id}`),
  createExperiment: (data: { name: string; configs: object[] }) =>
    api('/evolution/experiments', { method: 'POST', body: JSON.stringify(data) }),
  runExperiment: (id: string) =>
    api(`/evolution/experiments/${id}/run`, { method: 'POST' }),
  getVersions: () =>
    api<Array<{ id: string; version: string; entityType: string; entityId: string; date: string; author: string; changes: string }>>('/evolution/versions'),
};

// Versioning
export const versions = {
  getHistory: (limit?: number) =>
    api<Array<{ id: string; entityType: string; entityId: string; version: number; label: string; changeSummary: string; createdAt: string }>>(
      `/versions/history${limit ? `?limit=${limit}` : ''}`
    ),
  getVersions: (entityType: string, entityId: string) =>
    api<Array<{ id: string; version: number; label: string; changeSummary: string; createdAt: string; user: { id: string; firstName: string; lastName: string; email: string } }>>(
      `/versions/${entityType}/${entityId}`
    ),
  getVersion: (entityType: string, entityId: string, version: number) =>
    api<{ id: string; version: number; label: string; snapshot: unknown; changeSummary: string; createdAt: string }>(
      `/versions/${entityType}/${entityId}/${version}`
    ),
  diff: (entityType: string, entityId: string, from: number, to: number) =>
    api<{ from: unknown; to: unknown; fromSnapshot: unknown; toSnapshot: unknown }>(
      `/versions/${entityType}/${entityId}/diff?from=${from}&to=${to}`
    ),
};

// Kernel
export const kernel = {
  getMetrics: () => api<Record<string, unknown>>('/kernel/metrics'),
  getState: () => api<{ state: string }>('/kernel/state'),
  setState: (state: string) => api('/kernel/state', { method: 'POST', body: JSON.stringify({ state }) }),
  getProcesses: () => api<Array<Record<string, unknown>>>('/kernel/processes'),
  processAction: (id: string, action: string) =>
    api(`/kernel/processes/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
  getLogs: (limit?: number) =>
    api<Array<Record<string, unknown>>>(limit ? `/kernel/logs?limit=${limit}` : '/kernel/logs'),
  getNetwork: () => api<{ nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>> }>('/kernel/network'),
  getFilesystem: () => api<{ folders: Array<Record<string, unknown>>; files: Array<Record<string, unknown>> }>('/kernel/filesystem'),
};

// Users
export const users = {
  getProfile: () => api<{ id: string; email: string; firstName: string | null; lastName: string | null; role: string }>('/users/me'),
  updateProfile: (data: { firstName?: string; lastName?: string }) =>
    api<{ id: string; email: string; firstName: string | null; lastName: string | null }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getApiKeys: () =>
    api<Array<{ id: string; name: string; key: string; prefix: string; lastUsed: string | null; createdAt: string }>>('/users/me/api-keys'),
  createApiKey: (name: string, prefix?: 'vf_live' | 'vf_test') =>
    api<{ id: string; name: string; key: string; prefix: string; message: string }>('/users/me/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, prefix: prefix ?? 'vf_test' }),
    }),
  revokeApiKey: (id: string) => api(`/users/me/api-keys/${id}`, { method: 'DELETE' }),
};

// WebSocket helper for multiple channels
export function createWebSocket(channel: string, data?: unknown, onEvent?: (event: string, payload: unknown) => void) {
  const ws = new WebSocket(`${WS_BASE}/ws`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ event: `subscribe-${channel}`, data }));
  };
  ws.onmessage = (e) => {
    try {
      const { event, payload } = JSON.parse(e.data) as { event: string; payload: unknown };
      onEvent?.(event, payload);
    } catch {
      // ignore
    }
  };
  return () => ws.close();
}
