import type { ProcessingState } from '@/core/constants/plans';
import type { FolderAccessRole, ProjectRecord } from '@/core/types';
import { getProyectoModel, type ProyectoDoc } from '@/infrastructure/models/Proyecto';
import { getWriteConnection } from '@/lib/db/mongodb';

function toProjectRecord(doc: ProyectoDoc): ProjectRecord {
  return {
    id: doc._id.toString(),
    codigo_proyecto: doc.codigo_proyecto,
    nombre_proyecto: doc.nombre_proyecto,
    usuario_correo: doc.usuario_correo,
    archivo_zip: doc.archivo_zip,
    framework: doc.framework,
    estado_procesamiento: doc.estado_procesamiento,
    ...(doc.created_at
      ? {
          created_at:
            doc.created_at instanceof Date
              ? doc.created_at.toISOString()
              : new Date(doc.created_at).toISOString(),
        }
      : {}),
    ...(doc.webhook_url ? { webhook_url: doc.webhook_url } : {}),
    ...(doc.permisos_acceso
      ? {
          permisos_acceso: doc.permisos_acceso.map((entry) => ({
            email: entry.email,
            rol_carpeta: entry.rol_carpeta,
            assigned_at:
              entry.assigned_at instanceof Date
                ? entry.assigned_at.toISOString()
                : new Date(entry.assigned_at).toISOString(),
          })),
        }
      : {}),
  };
}

export interface CreateProjectInput {
  codigo_proyecto: string;
  nombre_proyecto: string;
  usuario_correo: string;
  archivo_zip: string;
  framework: string;
  estado_procesamiento?: ProcessingState;
}

export const projectRepository = {
  async findAll(): Promise<ProjectRecord[]> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const docs = await Proyecto.find()
      .sort({ created_at: -1, _id: -1 })
      .lean<ProyectoDoc[]>();

    return docs.map(toProjectRecord);
  },

  async findByUserEmail(correo: string): Promise<ProjectRecord[]> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const normalized = correo.toLowerCase().trim();
    const docs = await Proyecto.find({
      $or: [
        { usuario_correo: normalized },
        { 'permisos_acceso.email': normalized },
      ],
    })
      .sort({ created_at: -1, _id: -1 })
      .lean<ProyectoDoc[]>();

    return docs.map(toProjectRecord);
  },

  async findByCode(codigo_proyecto: string): Promise<ProjectRecord | null> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const doc = await Proyecto.findOne({ codigo_proyecto }).lean<ProyectoDoc | null>();

    return doc ? toProjectRecord(doc) : null;
  },

  async countMonthlyByUser(
    correo: string,
    referenceDate: Date = new Date(),
  ): Promise<number> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const startOfMonth = new Date(
      Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1, 0, 0, 0, 0),
    );

    return Proyecto.countDocuments({
      usuario_correo: correo.toLowerCase().trim(),
      created_at: { $gte: startOfMonth },
    });
  },

  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const created = await Proyecto.create({
      ...input,
      usuario_correo: input.usuario_correo.toLowerCase().trim(),
      estado_procesamiento: input.estado_procesamiento ?? 'pendiente',
      created_at: new Date(),
    });

    const plain = await Proyecto.findById(created._id).lean<ProyectoDoc | null>();
    if (!plain) {
      throw new Error('Failed to reload created project');
    }

    return toProjectRecord(plain);
  },

  async updateStatus(
    codigo_proyecto: string,
    estado_procesamiento: ProcessingState,
  ): Promise<ProjectRecord | null> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const updated = await Proyecto.findOneAndUpdate(
      { codigo_proyecto },
      { $set: { estado_procesamiento } },
      { new: true },
    ).lean<ProyectoDoc | null>();

    return updated ? toProjectRecord(updated) : null;
  },

  async deleteByCode(codigo_proyecto: string): Promise<boolean> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const result = await Proyecto.deleteOne({ codigo_proyecto });
    return result.deletedCount > 0;
  },

  async getNextProjectCode(): Promise<string> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const docs = await Proyecto.find({}, { codigo_proyecto: 1 })
      .lean<Array<{ codigo_proyecto: string }>>();

    let maxNum = 0;
    for (const doc of docs) {
      const match = /^PRJ-(\d+)$/i.exec(doc.codigo_proyecto);
      if (match) {
        const parsed = Number.parseInt(match[1], 10);
        if (Number.isFinite(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }

    return `PRJ-${String(maxNum + 1).padStart(3, '0')}`;
  },

  async updateWebhookUrl(
    codigo_proyecto: string,
    webhook_url: string,
  ): Promise<ProjectRecord | null> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const updated = await Proyecto.findOneAndUpdate(
      { codigo_proyecto },
      { $set: { webhook_url } },
      { new: true },
    ).lean<ProyectoDoc | null>();

    return updated ? toProjectRecord(updated) : null;
  },

  async updateAccessPermissions(
    codigo_proyecto: string,
    permisos_acceso: Array<{
      email: string;
      rol_carpeta: FolderAccessRole;
      assigned_at: Date;
    }>,
  ): Promise<ProjectRecord | null> {
    const conn = await getWriteConnection();
    const Proyecto = getProyectoModel(conn);
    const updated = await Proyecto.findOneAndUpdate(
      { codigo_proyecto },
      { $set: { permisos_acceso } },
      { new: true },
    ).lean<ProyectoDoc | null>();

    return updated ? toProjectRecord(updated) : null;
  },
};
