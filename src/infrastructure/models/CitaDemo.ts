import { Schema, type Connection, type Model, type Types } from 'mongoose';
import {
  ADVISOR_RECOMMENDED_PLANS,
  DEMO_APPOINTMENT_STATES,
  type AdvisorRecommendedPlan,
  type DemoAppointmentState,
} from '@/core/types';

export interface CitaDemoDoc {
  _id: Types.ObjectId;
  nombre: string;
  correo: string;
  organizacion: string;
  plan_recomendado: AdvisorRecommendedPlan;
  tamano_equipo: string;
  fecha_preferida: string;
  notas?: string;
  estado: DemoAppointmentState;
  created_at: Date;
}

export const CitaDemoSchema = new Schema<CitaDemoDoc>(
  {
    nombre: { type: String, required: true, trim: true },
    correo: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    organizacion: { type: String, required: true, trim: true },
    plan_recomendado: {
      type: String,
      enum: ADVISOR_RECOMMENDED_PLANS,
      required: true,
    },
    tamano_equipo: { type: String, required: true, trim: true },
    fecha_preferida: { type: String, required: true, trim: true },
    notas: { type: String, trim: true, default: undefined },
    estado: {
      type: String,
      enum: DEMO_APPOINTMENT_STATES,
      default: 'pendiente',
      required: true,
    },
    created_at: { type: Date, default: Date.now },
  },
  {
    collection: 'citas_demo',
    versionKey: false,
  },
);

export function getCitaDemoModel(conn: Connection): Model<CitaDemoDoc> {
  return (
    (conn.models.CitaDemo as Model<CitaDemoDoc> | undefined) ??
    conn.model<CitaDemoDoc>('CitaDemo', CitaDemoSchema)
  );
}
