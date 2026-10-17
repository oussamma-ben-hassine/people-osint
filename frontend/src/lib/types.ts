export interface User {
  id: string;
  sso_issuer: string;
  sso_sub: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'DISABLED';
  access_status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  permissions: string[];
  quotas: Record<string, any>;
  created_at: string;
}

export interface SearchJob {
  id: string;
  user_id: string;
  case_id?: string;
  status: 'PENDING' | 'RUNNING' | 'PARTIAL' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  mode: 'PROFESSIONAL' | 'FULL_WEB';
  depth: 'QUICK' | 'DEEP' | 'EXTENDED';
  query_params: Record<string, any>;
  progress_pct: number;
  progress_step: string;
  error_message?: string;
  created_at: string;
}

export interface ResearchCase {
  id: string;
  user_id: string;
  title: string;
  target_name: string;
  mode: string;
  status: string;
  summary_ai?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntity {
  id: string;
  entity_type: string;
  name: string;
  canonical_id?: string;
  attributes: Record<string, any>;
  created_at: string;
}

export interface KnowledgeRelation {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  connection_nature: 'DOCUMENTED' | 'DECLARED' | 'UNCERTAIN';
  uncertainty_score: number;
  provenance: string;
  evidence: Array<{
    source_url: string;
    text_snippet: string;
    verified: boolean;
  }>;
}

export interface CytoscapeGraph {
  nodes: Array<{
    data: {
      id: string;
      label: string;
      entity_type: string;
      attributes: Record<string, any>;
    };
  }>;
  edges: Array<{
    data: {
      id: string;
      source: string;
      target: string;
      label: string;
      relation_type: string;
      connection_nature: string;
      uncertainty_score: number;
      evidence_count: number;
    };
  }>;
}

export interface AIConversation {
  id: string;
  title: string;
  mode: 'KNOWLEDGE_ONLY' | 'WEB_ENRICHED';
  case_id?: string;
  created_at: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'tool';
  content: string;
  citations: Array<Record<string, any>>;
  tools_used: Array<Record<string, any>>;
  created_at: string;
}

export interface ExposureCheck {
  id: string;
  identifier_type: 'EMAIL' | 'DOMAIN';
  identifier_value: string;
  is_verified: boolean;
  verification_token?: string;
  breach_count: number;
  breach_details: Array<any>;
  recommendations: string[];
  created_at: string;
}
