import type { UserRole } from '@/core/constants/plans';
import type {
  UserPlanEmbedded,
  UserRecord,
  UserWithPasswordRecord,
} from '@/core/types';
import { getUsuarioModel, type UsuarioDoc } from '@/infrastructure/models/Usuario';
import { getWriteConnection } from '@/lib/db/mongodb';

function toUserRecord(doc: Omit<UsuarioDoc, 'password_hash'>): UserRecord {
  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    correo: doc.correo,
    rol: doc.rol,
    plan: {
      nombre: doc.plan.nombre,
      precio: doc.plan.precio,
      max_proyectos_mes: doc.plan.max_proyectos_mes,
    },
    is_active: doc.is_active,
    created_at:
      doc.created_at instanceof Date
        ? doc.created_at.toISOString()
        : new Date(doc.created_at).toISOString(),
    ...(doc.team_members
      ? {
          team_members: doc.team_members.map((m) => ({
            correo: m.correo,
            rol: m.rol,
            invited_at:
              m.invited_at instanceof Date
                ? m.invited_at.toISOString()
                : new Date(m.invited_at).toISOString(),
          })),
        }
      : {}),
    ...(doc.white_label ? { white_label: { ...doc.white_label } } : {}),
    ...(doc.api_key ? { api_key: doc.api_key } : {}),
  };
}

export interface CreateUserInput {
  nombre: string;
  correo: string;
  password_hash: string;
  rol: UserRole;
  plan: UserPlanEmbedded;
}

export const userRepository = {
  async findByEmail(correo: string): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const doc = await Usuario.findOne({ correo: correo.toLowerCase().trim() })
      .lean<UsuarioDoc | null>();

    return doc ? toUserRecord(doc) : null;
  },

  async findByEmailWithPassword(
    correo: string,
  ): Promise<UserWithPasswordRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const doc = await Usuario.findOne({ correo: correo.toLowerCase().trim() })
      .select('+password_hash')
      .lean<UsuarioDoc | null>();

    if (!doc) {
      return null;
    }

    return {
      ...toUserRecord(doc),
      password_hash: doc.password_hash,
    };
  },

  async findById(id: string): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const doc = await Usuario.findById(id).lean<UsuarioDoc | null>();

    return doc ? toUserRecord(doc) : null;
  },

  async create(input: CreateUserInput): Promise<UserRecord> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const created = await Usuario.create({
      nombre: input.nombre.trim(),
      correo: input.correo.toLowerCase().trim(),
      password_hash: input.password_hash,
      rol: input.rol,
      plan: input.plan,
      is_active: true,
      created_at: new Date(),
    });

    const plain = await Usuario.findById(created._id).lean<UsuarioDoc | null>();
    if (!plain) {
      throw new Error('Failed to reload created user');
    }

    return toUserRecord(plain);
  },

  async updatePlan(
    correo: string,
    plan: UserPlanEmbedded,
  ): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const updated = await Usuario.findOneAndUpdate(
      { correo: correo.toLowerCase().trim() },
      { $set: { plan } },
      { new: true },
    ).lean<UsuarioDoc | null>();

    return updated ? toUserRecord(updated) : null;
  },

  async updatePasswordHash(
    correo: string,
    password_hash: string,
  ): Promise<boolean> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const result = await Usuario.updateOne(
      { correo: correo.toLowerCase().trim() },
      { $set: { password_hash } },
    );

    return result.matchedCount > 0;
  },
};
