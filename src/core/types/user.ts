import type { PlanDefinition, PlanName, UserRole } from '@/core/constants/plans';

export interface UserPlanEmbedded {
  nombre: PlanName;
  precio: number;
  max_proyectos_mes: number;
}

export interface TeamMember {
  correo: string;
  rol: UserRole;
  invited_at: string;
}

export interface WhiteLabelConfig {
  enabled: boolean;
  brand_name: string;
  logo_url?: string;
}

export interface UserRecord {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole;
  plan: UserPlanEmbedded;
  is_active: boolean;
  created_at: string;
  team_members?: TeamMember[];
  white_label?: WhiteLabelConfig;
  api_key?: string;
}

export interface UserWithPasswordRecord extends UserRecord {
  password_hash: string;
}

export interface AuthSessionPayload {
  sub: string;
  correo: string;
  nombre: string;
  rol: UserRole;
  plan: PlanName;
}

export interface PlanUsageSummary {
  proyectos_mes_actual: number;
  max_proyectos_mes: number;
  restantes_mes: number;
}

export interface AuthUserProfile extends UserRecord {
  plan_details: PlanDefinition;
  usage: PlanUsageSummary;
}
