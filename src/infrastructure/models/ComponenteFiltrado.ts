import { Schema, type Connection, type Model, type Types } from 'mongoose';
import {
  SVM_CLASSIFICATIONS,
  type SvmClassification,
} from '@/core/constants/plans';

export interface ComponenteFiltradoDoc {
  _id: Types.ObjectId;
  codigo_proyecto: string;
  archivo_blade: string;
  ruta_web: string;
  elementos_detectados: string[];
  etiqueta_svm: 0 | 1;
  clasificacion: SvmClassification;
}

export const ComponenteFiltradoSchema = new Schema<ComponenteFiltradoDoc>(
  {
    codigo_proyecto: { type: String, required: true, index: true },
    archivo_blade: { type: String, required: true },
    ruta_web: { type: String, required: true },
    elementos_detectados: { type: [String], default: [] },
    etiqueta_svm: { type: Number, enum: [0, 1], required: true },
    clasificacion: {
      type: String,
      enum: SVM_CLASSIFICATIONS,
      required: true,
    },
  },
  {
    collection: 'componentes_filtrados',
    versionKey: false,
  },
);

export function getComponenteFiltradoModel(
  conn: Connection,
): Model<ComponenteFiltradoDoc> {
  return (
    (conn.models.ComponenteFiltrado as Model<ComponenteFiltradoDoc> | undefined) ??
    conn.model<ComponenteFiltradoDoc>(
      'ComponenteFiltrado',
      ComponenteFiltradoSchema,
    )
  );
}
