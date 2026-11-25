import { Schema, type Connection, type Model, type Types } from 'mongoose';
import {
  PLAN_NAMES,
  USER_ROLES,
  type PlanName,
  type UserRole,
} from '@/core/constants/plans';
import { AUTH_PROVIDERS, type AuthProvider } from '@/core/types';

export interface UsuarioPlanDoc {
  nombre: PlanName;
  precio: number;
  max_proyectos_mes: number;
}

export interface UsuarioTeamMemberDoc {
  correo: string;
  rol: UserRole;
  invited_at: Date;
}

export interface UsuarioWhiteLabelDoc {
  enabled: boolean;
  brand_name: string;
  logo_url?: string;
}

export interface UsuarioDoc {
  _id: Types.ObjectId;
  nombre: string;
  correo: string;
  password_hash?: string;
  google_id?: string;
  avatar_url?: string;
  auth_provider?: AuthProvider;
  rol: UserRole;
  plan: UsuarioPlanDoc;
  is_active: boolean;
  created_at: Date;
  team_members?: UsuarioTeamMemberDoc[];
  white_label?: UsuarioWhiteLabelDoc;
  api_key?: string;
}

const PlanSubSchema = new Schema<UsuarioPlanDoc>(
  {
    nombre: { type: String, enum: PLAN_NAMES, default: 'Freemium', required: true },
    precio: { type: Number, default: 0, required: true },
    max_proyectos_mes: { type: Number, default: 2, required: true },
  },
  { _id: false },
);

const TeamMemberSubSchema = new Schema<UsuarioTeamMemberDoc>(
  {
    correo: { type: String, required: true, lowercase: true, trim: true },
    rol: { type: String, enum: USER_ROLES, required: true },
    invited_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const WhiteLabelSubSchema = new Schema<UsuarioWhiteLabelDoc>(
  {
    enabled: { type: Boolean, default: false },
    brand_name: { type: String, default: '' },
    logo_url: { type: String },
  },
  { _id: false },
);

export const UsuarioSchema = new Schema<UsuarioDoc>(
  {
    nombre: { type: String, required: true, trim: true },
    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: { type: String, required: false, select: false },
    google_id: { type: String, unique: true, sparse: true, trim: true },
    avatar_url: { type: String, trim: true },
    auth_provider: { type: String, enum: AUTH_PROVIDERS, default: 'local' },
    rol: { type: String, enum: USER_ROLES, default: 'Desarrollador' },
    plan: {
      type: PlanSubSchema,
      default: () => ({
        nombre: 'Freemium' as PlanName,
        precio: 0,
        max_proyectos_mes: 2,
      }),
    },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    team_members: { type: [TeamMemberSubSchema], default: undefined },
    white_label: { type: WhiteLabelSubSchema, default: undefined },
    api_key: { type: String },
  },
  {
    collection: 'usuarios',
    versionKey: false,
  },
);

export function getUsuarioModel(conn: Connection): Model<UsuarioDoc> {
  return (
    (conn.models.Usuario as Model<UsuarioDoc> | undefined) ??
    conn.model<UsuarioDoc>('Usuario', UsuarioSchema)
  );
}
