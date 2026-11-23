import type {
  AuditResult,
  PlanDefinition,
  PlanName,
  UserRole,
} from '@/core/constants/plans';
import type { AuditLogRecord } from './audit';
import type { GeneratedDocumentRecord } from './project';
import type { AuthUserProfile, TeamMember, WhiteLabelConfig } from './user';

export interface PlansCatalogResponseDTO {
  plans: readonly PlanDefinition[];
}

export interface SubscribePlanRequestDTO {
  plan: PlanName;
}

export interface SubscribePlanResponseDTO {
  user: AuthUserProfile;
  message: string;
}

export interface EnterpriseConfigRequestDTO {
  white_label?: WhiteLabelConfig;
  rotate_api_key?: boolean;
}

export interface EnterpriseConfigResponseDTO {
  user: AuthUserProfile;
  generated_api_key?: string;
}

export interface TeamInviteRequestDTO {
  correo: string;
  rol: UserRole;
}

export interface TeamManageResponseDTO {
  user: AuthUserProfile;
  team_members: TeamMember[];
}

export interface AuditMetricsSummary {
  total_logs: number;
  exitosos: number;
  bloqueados: number;
  high_token_drafts_count: number;
  total_high_token_sum: number;
  db_account: 'auditor_qa_docuflow';
  db_privilege: 'read';
}

export interface AdminAuditResponseDTO {
  logs: AuditLogRecord[];
  high_token_drafts: GeneratedDocumentRecord[];
  metrics: AuditMetricsSummary;
  filter_resultado?: AuditResult;
}
