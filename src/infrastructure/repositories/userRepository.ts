import type { UserRole } from '@/core/constants/plans';
import type {
  AuthProvider,
  UserPlanEmbedded,
  UserRecord,
  UserWithPasswordRecord,
  WhiteLabelConfig,
} from '@/core/types';
import { getUsuarioModel, type UsuarioDoc } from '@/infrastructure/models/Usuario';
import { getWriteConnection } from '@/lib/db/mongodb';

function toUserRecord(doc: UsuarioDoc): UserRecord {
  const hasLocalPassword = Boolean(doc.password_hash && doc.password_hash.length > 0);
  const authProvider: AuthProvider =
    doc.auth_provider ?? (doc.google_id ? (hasLocalPassword ? 'hybrid' : 'google') : 'local');

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
    auth_provider: authProvider,
    has_local_password: hasLocalPassword,
    ...(doc.google_id ? { google_id: doc.google_id } : {}),
    ...(doc.avatar_url ? { avatar_url: doc.avatar_url } : {}),
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

export interface CreateGoogleUserInput {
  nombre: string;
  correo: string;
  google_id: string;
  avatar_url?: string;
  rol: UserRole;
  plan: UserPlanEmbedded;
}

export const userRepository = {
  async findByEmail(correo: string): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const doc = await Usuario.findOne({ correo: correo.toLowerCase().trim() })
      .select('+password_hash')
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
    const doc = await Usuario.findById(id)
      .select('+password_hash')
      .lean<UsuarioDoc | null>();

    return doc ? toUserRecord(doc) : null;
  },

  async findByGoogleId(googleId: string): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const doc = await Usuario.findOne({ google_id: googleId.trim() })
      .select('+password_hash')
      .lean<UsuarioDoc | null>();

    return doc ? toUserRecord(doc) : null;
  },

  async create(input: CreateUserInput): Promise<UserRecord> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const created = await Usuario.create({
      nombre: input.nombre.trim(),
      correo: input.correo.toLowerCase().trim(),
      password_hash: input.password_hash,
      auth_provider: 'local',
      rol: input.rol,
      plan: input.plan,
      is_active: true,
      created_at: new Date(),
    });

    const plain = await Usuario.findById(created._id)
      .select('+password_hash')
      .lean<UsuarioDoc | null>();
    if (!plain) {
      throw new Error('Failed to reload created user');
    }

    return toUserRecord(plain);
  },

  async createGoogleUser(input: CreateGoogleUserInput): Promise<UserRecord> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const created = await Usuario.create({
      nombre: input.nombre.trim(),
      correo: input.correo.toLowerCase().trim(),
      google_id: input.google_id.trim(),
      ...(input.avatar_url ? { avatar_url: input.avatar_url.trim() } : {}),
      auth_provider: 'google',
      rol: input.rol,
      plan: input.plan,
      is_active: true,
      created_at: new Date(),
    });

    const plain = await Usuario.findById(created._id)
      .select('+password_hash')
      .lean<UsuarioDoc | null>();
    if (!plain) {
      throw new Error('Failed to reload created Google user');
    }

    return toUserRecord(plain);
  },

  async linkGoogleAccount(
    userId: string,
    patch: {
      google_id: string;
      avatar_url?: string;
      auth_provider: AuthProvider;
    },
  ): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const setFields: Record<string, unknown> = {
      google_id: patch.google_id.trim(),
      auth_provider: patch.auth_provider,
    };
    if (patch.avatar_url) {
      setFields.avatar_url = patch.avatar_url.trim();
    }

    const updated = await Usuario.findByIdAndUpdate(
      userId,
      { $set: setFields },
      { new: true },
    )
      .select('+password_hash')
      .lean<UsuarioDoc | null>();

    return updated ? toUserRecord(updated) : null;
  },

  async unlinkGoogleAccount(userId: string): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const updated = await Usuario.findByIdAndUpdate(
      userId,
      {
        $unset: { google_id: '' },
        $set: { auth_provider: 'local' },
      },
      { new: true },
    )
      .select('+password_hash')
      .lean<UsuarioDoc | null>();

    return updated ? toUserRecord(updated) : null;
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
    )
      .select('+password_hash')
      .lean<UsuarioDoc | null>();

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

  async updateEnterpriseConfig(
    correo: string,
    patch: { white_label?: WhiteLabelConfig; api_key?: string },
  ): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const updateFields: Record<string, unknown> = {};

    if (patch.white_label !== undefined) {
      updateFields.white_label = patch.white_label;
    }
    if (patch.api_key !== undefined) {
      updateFields.api_key = patch.api_key;
    }

    const updated = await Usuario.findOneAndUpdate(
      { correo: correo.toLowerCase().trim() },
      { $set: updateFields },
      { new: true },
    )
      .select('+password_hash')
      .lean<UsuarioDoc | null>();

    return updated ? toUserRecord(updated) : null;
  },

  async updateTeamMembers(
    correo: string,
    team_members: Array<{ correo: string; rol: UserRole; invited_at: Date }>,
  ): Promise<UserRecord | null> {
    const conn = await getWriteConnection();
    const Usuario = getUsuarioModel(conn);
    const updated = await Usuario.findOneAndUpdate(
      { correo: correo.toLowerCase().trim() },
      { $set: { team_members } },
      { new: true },
    )
      .select('+password_hash')
      .lean<UsuarioDoc | null>();

    return updated ? toUserRecord(updated) : null;
  },
};
