import type { UserRole } from '@/core/constants/plans';

export const ADVISOR_RECOMMENDED_PLANS = ['Team IA', 'Enterprise'] as const;
export type AdvisorRecommendedPlan = (typeof ADVISOR_RECOMMENDED_PLANS)[number];

export const DEMO_APPOINTMENT_STATES = [
  'pendiente',
  'confirmada',
  'completada',
  'cancelada',
] as const;
export type DemoAppointmentState = (typeof DEMO_APPOINTMENT_STATES)[number];

export interface DemoAppointmentRecord {
  id: string;
  nombre: string;
  correo: string;
  organizacion: string;
  plan_recomendado: AdvisorRecommendedPlan;
  tamano_equipo: string;
  fecha_preferida: string;
  notas?: string;
  estado: DemoAppointmentState;
  created_at: string;
}

export interface ScheduleDemoRequestDTO {
  nombre: string;
  correo: string;
  organizacion: string;
  plan_recomendado: AdvisorRecommendedPlan;
  tamano_equipo: string;
  fecha_preferida: string;
  notas?: string;
}

export interface ScheduleDemoResponseDTO {
  appointment: DemoAppointmentRecord;
  message: string;
}

export const PLAN_REQUEST_STATES = ['pendiente', 'aprobada', 'rechazada'] as const;
export type PlanRequestState = (typeof PLAN_REQUEST_STATES)[number];

export interface PlanRequestInitialMember {
  correo: string;
  rol: UserRole;
}

export interface PlanRequestRecord {
  id: string;
  usuario_id: string;
  plan_solicitado: AdvisorRecommendedPlan;
  organizacion: string;
  industria: string;
  correo_corporativo: string;
  num_usuarios: number;
  personalizaciones: string[];
  integracion_git: string;
  miembros_iniciales?: PlanRequestInitialMember[];
  estado: PlanRequestState;
  notas_admin: string;
  created_at: string;
}

export interface CreatePlanRequestDTO {
  plan_solicitado: AdvisorRecommendedPlan;
  organizacion: string;
  industria?: string;
  correo_corporativo: string;
  num_usuarios: number;
  personalizaciones?: string[];
  integracion_git?: string;
  miembros_iniciales?: PlanRequestInitialMember[];
}

export interface CreatePlanRequestResponseDTO {
  request: PlanRequestRecord;
  message: string;
}

export interface MyPlanRequestsResponseDTO {
  requests: PlanRequestRecord[];
}

export interface AdminApprovalsResponseDTO {
  requests: PlanRequestRecord[];
  demos: DemoAppointmentRecord[];
}

export interface ReviewPlanRequestDTO {
  estado: 'aprobada' | 'rechazada';
  notas_admin?: string;
}

export interface ReviewPlanRequestResponseDTO {
  request: PlanRequestRecord;
  message: string;
}

export interface UpdateDemoStatusRequestDTO {
  estado: DemoAppointmentState;
  notas?: string;
}

export interface UpdateDemoStatusResponseDTO {
  appointment: DemoAppointmentRecord;
  message: string;
}
