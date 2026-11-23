import type { SvmClassification } from '@/core/constants/plans';
import type { FilteredComponentRecord } from '@/core/types';
import {
  getComponenteFiltradoModel,
  type ComponenteFiltradoDoc,
} from '@/infrastructure/models/ComponenteFiltrado';
import { getWriteConnection } from '@/lib/db/mongodb';

function toComponentRecord(doc: ComponenteFiltradoDoc): FilteredComponentRecord {
  return {
    id: doc._id.toString(),
    codigo_proyecto: doc.codigo_proyecto,
    archivo_blade: doc.archivo_blade,
    ruta_web: doc.ruta_web,
    elementos_detectados: [...doc.elementos_detectados],
    etiqueta_svm: doc.etiqueta_svm,
    clasificacion: doc.clasificacion,
  };
}

export interface CreateFilteredComponentInput {
  codigo_proyecto: string;
  archivo_blade: string;
  ruta_web: string;
  elementos_detectados: string[];
  etiqueta_svm: 0 | 1;
  clasificacion: SvmClassification;
}

export const componentRepository = {
  async findByProjectCode(
    codigo_proyecto: string,
  ): Promise<FilteredComponentRecord[]> {
    const conn = await getWriteConnection();
    const ComponenteFiltrado = getComponenteFiltradoModel(conn);
    const docs = await ComponenteFiltrado.find({ codigo_proyecto })
      .sort({ etiqueta_svm: -1, archivo_blade: 1 })
      .lean<ComponenteFiltradoDoc[]>();

    return docs.map(toComponentRecord);
  },

  async insertMany(
    items: CreateFilteredComponentInput[],
  ): Promise<FilteredComponentRecord[]> {
    if (items.length === 0) {
      return [];
    }

    const conn = await getWriteConnection();
    const ComponenteFiltrado = getComponenteFiltradoModel(conn);
    const inserted = await ComponenteFiltrado.insertMany(items);
    const ids = inserted.map((doc) => doc._id);
    const docs = await ComponenteFiltrado.find({ _id: { $in: ids } }).lean<
      ComponenteFiltradoDoc[]
    >();

    return docs.map(toComponentRecord);
  },

  async deleteByProjectCode(codigo_proyecto: string): Promise<number> {
    const conn = await getWriteConnection();
    const ComponenteFiltrado = getComponenteFiltradoModel(conn);
    const result = await ComponenteFiltrado.deleteMany({ codigo_proyecto });
    return result.deletedCount;
  },
};
