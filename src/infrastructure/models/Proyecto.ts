import { Schema, type Connection, type Model, type Types } from 'mongoose';
import { PROCESSING_STATES, type ProcessingState } from '@/core/constants/plans';
import { FOLDER_ACCESS_ROLES, type FolderAccessRole } from '@/core/types';

export interface ProyectoPermisoAccesoDoc {
  email: string;
  rol_carpeta: FolderAccessRole;
  assigned_at: Date;
}

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
  permisos_acceso?: ProyectoPermisoAccesoDoc[];
}

const PermisoAccesoSubSchema = new Schema<ProyectoPermisoAccesoDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    rol_carpeta: { type: String, enum: FOLDER_ACCESS_ROLES, required: true },
    assigned_at: { type: Date, default: Date.now },
  },
  { _id: false },
);

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
    permisos_acceso: { type: [PermisoAccesoSubSchema], default: undefined },
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
