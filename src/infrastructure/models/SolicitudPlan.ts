import { Schema, type Connection, type Model, type Types } from 'mongoose';
import { USER_ROLES, type UserRole } from '@/core/constants/plans';
import {
  ADVISOR_RECOMMENDED_PLANS,
  PLAN_REQUEST_STATES,
  type AdvisorRecommendedPlan,
  type PlanRequestState,
} from '@/core/types';

export interface SolicitudPlanMemberDoc {
  correo: string;
  rol: UserRole;
}

export interface SolicitudPlanDoc {
  _id: Types.ObjectId;
  usuario_id: string;
  plan_solicitado: AdvisorRecommendedPlan;
  organizacion: string;
  industria: string;
  correo_corporativo: string;
  num_usuarios: number;
  personalizaciones: string[];
  integracion_git: string;
  miembros_iniciales?: SolicitudPlanMemberDoc[];
  estado: PlanRequestState;
  notas_admin: string;
  created_at: Date;
}

const SolicitudMemberSubSchema = new Schema<SolicitudPlanMemberDoc>(
  {
    correo: { type: String, required: true, lowercase: true, trim: true },
    rol: { type: String, enum: USER_ROLES, required: true },
  },
  { _id: false },
);

export const SolicitudPlanSchema = new Schema<SolicitudPlanDoc>(
  {
    usuario_id: { type: String, required: true, index: true },
    plan_solicitado: {
      type: String,
      enum: ADVISOR_RECOMMENDED_PLANS,
      required: true,
    },
    organizacion: { type: String, required: true, trim: true },
    industria: { type: String, default: '', trim: true },
    correo_corporativo: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    num_usuarios: { type: Number, required: true, min: 1 },
    personalizaciones: { type: [String], default: [] },
    integracion_git: { type: String, default: '', trim: true },
    miembros_iniciales: {
      type: [SolicitudMemberSubSchema],
      default: undefined,
    },
    estado: {
      type: String,
      enum: PLAN_REQUEST_STATES,
      default: 'pendiente',
      required: true,
    },
    notas_admin: { type: String, default: '', trim: true },
    created_at: { type: Date, default: Date.now },
  },
  {
    collection: 'solicitudes_planes',
    versionKey: false,
  },
);

export function getSolicitudPlanModel(conn: Connection): Model<SolicitudPlanDoc> {
  return (
    (conn.models.SolicitudPlan as Model<SolicitudPlanDoc> | undefined) ??
    conn.model<SolicitudPlanDoc>('SolicitudPlan', SolicitudPlanSchema)
  );
}
