import type {
  DemoAppointmentRecord,
  ScheduleDemoRequestDTO,
} from '@/core/types';
import {
  getCitaDemoModel,
  type CitaDemoDoc,
} from '@/infrastructure/models/CitaDemo';
import { getWriteConnection } from '@/lib/db/mongodb';

function toDemoAppointmentRecord(doc: CitaDemoDoc): DemoAppointmentRecord {
  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    correo: doc.correo,
    organizacion: doc.organizacion,
    plan_recomendado: doc.plan_recomendado,
    tamano_equipo: doc.tamano_equipo,
    fecha_preferida: doc.fecha_preferida,
    ...(doc.notas ? { notas: doc.notas } : {}),
    estado: doc.estado,
    created_at:
      doc.created_at instanceof Date
        ? doc.created_at.toISOString()
        : new Date(doc.created_at).toISOString(),
  };
}

export const demoAppointmentRepository = {
  async create(input: ScheduleDemoRequestDTO): Promise<DemoAppointmentRecord> {
    const conn = await getWriteConnection();
    const CitaDemo = getCitaDemoModel(conn);
    const created = await CitaDemo.create({
      nombre: input.nombre.trim(),
      correo: input.correo.toLowerCase().trim(),
      organizacion: input.organizacion.trim(),
      plan_recomendado: input.plan_recomendado,
      tamano_equipo: input.tamano_equipo.trim(),
      fecha_preferida: input.fecha_preferida.trim(),
      ...(input.notas?.trim() ? { notas: input.notas.trim() } : {}),
      estado: 'pendiente',
      created_at: new Date(),
    });

    const plain = await CitaDemo.findById(created._id).lean<CitaDemoDoc | null>();
    if (!plain) {
      throw new Error('Failed to reload created demo appointment');
    }

    return toDemoAppointmentRecord(plain);
  },

  async listRecentByEmail(correo: string): Promise<DemoAppointmentRecord[]> {
    const conn = await getWriteConnection();
    const CitaDemo = getCitaDemoModel(conn);
    const docs = await CitaDemo.find({ correo: correo.toLowerCase().trim() })
      .sort({ created_at: -1 })
      .limit(20)
      .lean<CitaDemoDoc[]>();

    return docs.map(toDemoAppointmentRecord);
  },
};
