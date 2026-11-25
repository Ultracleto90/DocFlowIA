import type {
  CreatePlanRequestDTO,
  PlanRequestInitialMember,
  PlanRequestRecord,
} from '@/core/types';
import {
  getSolicitudPlanModel,
  type SolicitudPlanDoc,
} from '@/infrastructure/models/SolicitudPlan';
import { getWriteConnection } from '@/lib/db/mongodb';

function toPlanRequestRecord(doc: SolicitudPlanDoc): PlanRequestRecord {
  return {
    id: doc._id.toString(),
    usuario_id: doc.usuario_id,
    plan_solicitado: doc.plan_solicitado,
    organizacion: doc.organizacion,
    industria: doc.industria ?? '',
    correo_corporativo: doc.correo_corporativo,
    num_usuarios: doc.num_usuarios,
    personalizaciones: Array.isArray(doc.personalizaciones)
      ? [...doc.personalizaciones]
      : [],
    integracion_git: doc.integracion_git ?? '',
    ...(doc.miembros_iniciales
      ? {
          miembros_iniciales: doc.miembros_iniciales.map((m) => ({
            correo: m.correo,
            rol: m.rol,
          })),
        }
      : {}),
    estado: doc.estado,
    notas_admin: doc.notas_admin ?? '',
    created_at:
      doc.created_at instanceof Date
        ? doc.created_at.toISOString()
        : new Date(doc.created_at).toISOString(),
  };
}

export interface CreatePlanRequestInput extends CreatePlanRequestDTO {
  usuario_id: string;
  miembros_iniciales?: PlanRequestInitialMember[];
}

export const planRequestRepository = {
  async create(input: CreatePlanRequestInput): Promise<PlanRequestRecord> {
    const conn = await getWriteConnection();
    const SolicitudPlan = getSolicitudPlanModel(conn);

    const created = await SolicitudPlan.create({
      usuario_id: input.usuario_id,
      plan_solicitado: input.plan_solicitado,
      organizacion: input.organizacion.trim(),
      industria: input.industria?.trim() ?? '',
      correo_corporativo: input.correo_corporativo.toLowerCase().trim(),
      num_usuarios: input.num_usuarios,
      personalizaciones: input.personalizaciones ?? [],
      integracion_git: input.integracion_git?.trim() ?? '',
      ...(input.miembros_iniciales && input.miembros_iniciales.length > 0
        ? {
            miembros_iniciales: input.miembros_iniciales.map((m) => ({
              correo: m.correo.toLowerCase().trim(),
              rol: m.rol,
            })),
          }
        : {}),
      estado: 'pendiente',
      notas_admin: '',
      created_at: new Date(),
    });

    const plain = await SolicitudPlan.findById(
      created._id,
    ).lean<SolicitudPlanDoc | null>();
    if (!plain) {
      throw new Error('Failed to reload created plan request');
    }

    return toPlanRequestRecord(plain);
  },

  async findByUserId(userId: string): Promise<PlanRequestRecord[]> {
    const conn = await getWriteConnection();
    const SolicitudPlan = getSolicitudPlanModel(conn);

    const docs = await SolicitudPlan.find({ usuario_id: userId })
      .sort({ created_at: -1 })
      .limit(30)
      .lean<SolicitudPlanDoc[]>();

    return docs.map(toPlanRequestRecord);
  },

  async findAll(limit: number = 100): Promise<PlanRequestRecord[]> {
    const conn = await getWriteConnection();
    const SolicitudPlan = getSolicitudPlanModel(conn);

    const docs = await SolicitudPlan.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .lean<SolicitudPlanDoc[]>();

    return docs.map(toPlanRequestRecord);
  },

  async findById(id: string): Promise<PlanRequestRecord | null> {
    const conn = await getWriteConnection();
    const SolicitudPlan = getSolicitudPlanModel(conn);
    const doc = await SolicitudPlan.findById(id).lean<SolicitudPlanDoc | null>();
    return doc ? toPlanRequestRecord(doc) : null;
  },

  async updateDecision(
    id: string,
    patch: { estado: 'aprobada' | 'rechazada'; notas_admin: string },
  ): Promise<PlanRequestRecord | null> {
    const conn = await getWriteConnection();
    const SolicitudPlan = getSolicitudPlanModel(conn);
    const updated = await SolicitudPlan.findByIdAndUpdate(
      id,
      {
        $set: {
          estado: patch.estado,
          notas_admin: patch.notas_admin.trim(),
        },
      },
      { new: true },
    ).lean<SolicitudPlanDoc | null>();

    return updated ? toPlanRequestRecord(updated) : null;
  },
};
