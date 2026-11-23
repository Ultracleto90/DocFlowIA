import { Schema, type Connection, type Model, type Types } from 'mongoose';
import { PROCESSING_STATES, type ProcessingState } from '@/core/constants/plans';

export interface ProyectoDoc {
  _id: Types.ObjectId;
  codigo_proyecto: string;
  nombre_proyecto: string;
  usuario_correo: string;
  archivo_zip: string;
  framework: string;
  estado_procesamiento: ProcessingState;
  created_at?: Date;
  webhook_url?: string;
}

export const ProyectoSchema = new Schema<ProyectoDoc>(
  {
    codigo_proyecto: { type: String, required: true, unique: true, trim: true },
    nombre_proyecto: { type: String, required: true, trim: true },
    usuario_correo: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    archivo_zip: { type: String, required: true },
    framework: { type: String, required: true },
    estado_procesamiento: {
      type: String,
      enum: PROCESSING_STATES,
      default: 'pendiente',
    },
    created_at: { type: Date, default: Date.now },
    webhook_url: { type: String },
  },
  {
    collection: 'proyectos',
    versionKey: false,
  },
);

export function getProyectoModel(conn: Connection): Model<ProyectoDoc> {
  return (
    (conn.models.Proyecto as Model<ProyectoDoc> | undefined) ??
    conn.model<ProyectoDoc>('Proyecto', ProyectoSchema)
  );
}
