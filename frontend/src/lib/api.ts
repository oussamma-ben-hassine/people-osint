import { User, SearchJob, ResearchCase, KnowledgeEntity, KnowledgeRelation, CytoscapeGraph, AIConversation, AIMessage, ExposureCheck } from './types';

const API_BASE = '';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/login';
    }
    throw new Error('Non authentifié');
  }

  if (res.status === 403) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/forbidden')) {
      window.location.href = '/auth/forbidden';
    }
    const err = await res.json().catch(() => ({ detail: 'Accès non autorisé' }));
    throw new Error(err.detail || 'Accès non autorisé');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `Erreur ${res.status}` }));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  getMe: () => fetchJson<User>('/auth/me'),
  getLoginUrl: () => fetchJson<{ authorization_url: string; state: string }>('/auth/login'),
  logout: () => fetchJson<{ status: string }>('/auth/logout', { method: 'POST' }),

  // Searches
  createSearch: (data: any) => fetchJson<SearchJob>('/api/v1/searches', { method: 'POST', body: JSON.stringify(data) }),
  listSearches: () => fetchJson<SearchJob[]>('/api/v1/searches'),
  getSearch: (id: string) => fetchJson<SearchJob>(`/api/v1/searches/${id}`),
  getSearchResults: (id: string) => fetchJson<any[]>(`/api/v1/searches/${id}/results`),
  refreshSearch: (id: string) => fetchJson<SearchJob>(`/api/v1/searches/${id}/refresh`, { method: 'POST' }),
  cancelSearch: (id: string) => fetchJson<any>(`/api/v1/searches/${id}/cancel`, { method: 'POST' }),

  // Research Cases
  listCases: () => fetchJson<ResearchCase[]>('/api/v1/research-cases'),
  getCase: (id: string) => fetchJson<ResearchCase>(`/api/v1/research-cases/${id}`),
  getCaseSnapshots: (id: string) => fetchJson<any[]>(`/api/v1/research-cases/${id}/snapshots`),
  compareCases: (caseIds: string[]) => fetchJson<any>('/api/v1/research-cases/compare', { method: 'POST', body: JSON.stringify({ case_ids: caseIds }) }),
  deleteCase: (id: string) => fetchJson<any>(`/api/v1/research-cases/${id}`, { method: 'DELETE' }),

  // Knowledge & Graph
  listEntities: (type?: string, caseId?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (caseId) params.set('case_id', caseId);
    return fetchJson<KnowledgeEntity[]>(`/api/v1/knowledge/entities?${params.toString()}`);
  },
  listRelations: (caseId?: string) => {
    const params = new URLSearchParams();
    if (caseId) params.set('case_id', caseId);
    return fetchJson<KnowledgeRelation[]>(`/api/v1/knowledge/relations?${params.toString()}`);
  },
  queryKnowledge: (query: string, mode: string = 'HYBRID') => fetchJson<any>('/api/v1/knowledge/query', { method: 'POST', body: JSON.stringify({ query, mode }) }),
  getGraph: (caseId?: string) => {
    const params = new URLSearchParams();
    if (caseId) params.set('case_id', caseId);
    return fetchJson<CytoscapeGraph>(`/api/v1/graph?${params.toString()}`);
  },

  // AI Explorer
  createConversation: (title?: string, mode: string = 'KNOWLEDGE_ONLY', caseId?: string) => fetchJson<AIConversation>('/api/v1/ai/conversations', { method: 'POST', body: JSON.stringify({ title, mode, case_id: caseId }) }),
  listConversations: () => fetchJson<AIConversation[]>('/api/v1/ai/conversations'),
  getMessages: (convId: string) => fetchJson<AIMessage[]>(`/api/v1/ai/conversations/${convId}/messages`),
  sendMessage: (convId: string, content: string) => fetchJson<AIMessage>(`/api/v1/ai/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Exposure
  createExposureCheck: (type: 'EMAIL' | 'DOMAIN', value: string) => fetchJson<ExposureCheck>('/api/v1/exposure/checks', { method: 'POST', body: JSON.stringify({ identifier_type: type, identifier_value: value }) }),
  verifyExposureCheck: (id: string, token: string) => fetchJson<ExposureCheck>(`/api/v1/exposure/checks/${id}/verify`, { method: 'POST', body: JSON.stringify({ verification_token: token }) }),
  listExposureChecks: () => fetchJson<ExposureCheck[]>('/api/v1/exposure/checks'),

  // Admin
  listAdminUsers: () => fetchJson<User[]>('/api/v1/admin/users'),
  updateUserAccess: (id: string, data: any) => fetchJson<User>(`/api/v1/admin/users/${id}/access`, { method: 'PATCH', body: JSON.stringify(data) }),
  listAdminConnectors: () => fetchJson<any[]>('/api/v1/admin/connectors'),
  updateConnector: (id: string, data: any) => fetchJson<any>(`/api/v1/admin/connectors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminStats: () => fetchJson<any>('/api/v1/admin/stats'),
  getAdminAudit: () => fetchJson<any[]>('/api/v1/admin/audit'),
  gdprEraseUser: (userId: string) => fetchJson<any>(`/api/v1/admin/gdpr/erasure/${userId}`, { method: 'POST' }),
};
