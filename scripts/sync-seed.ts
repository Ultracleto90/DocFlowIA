import bcrypt from 'bcryptjs';
import { getUsuarioModel } from '@/infrastructure/models/Usuario';
import { getWriteConnection } from '@/lib/db/mongodb';

const TARGET_EMAILS = ['emiliano@docuflow.ia', 'nadia@docuflow.ia'] as const;
const DEFAULT_DEV_PASSWORD = 'DocuFlow2026!';
const BCRYPT_PREFIXES = ['$2a$', '$2b$'] as const;

function isValidBcryptHash(hash: string | undefined): boolean {
  if (!hash) {
    return false;
  }
  return BCRYPT_PREFIXES.some((prefix) => hash.startsWith(prefix));
}

async function runSafeSeedSync(): Promise<void> {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is required to run sync-seed.');
  }

  const conn = await getWriteConnection();
  const Usuario = getUsuarioModel(conn);

  console.log('[sync-seed] Connected to DocuFlowAI as worker_ia_service (readWrite).');

  // 1. Replace non-bcrypt placeholder password hashes for seed accounts without deleting data
  for (const correo of TARGET_EMAILS) {
    const user = await Usuario.findOne({ correo })
      .select('+password_hash')
      .lean<{ correo: string; password_hash?: string } | null>();

    if (!user) {
      console.log(`[sync-seed] SKIP: User ${correo} not found.`);
      continue;
    }

    if (isValidBcryptHash(user.password_hash)) {
      console.log(`[sync-seed] OK: ${correo} already has a valid bcrypt hash.`);
      continue;
    }

    const realHash = await bcrypt.hash(DEFAULT_DEV_PASSWORD, 10);
    await Usuario.updateOne({ correo }, { $set: { password_hash: realHash } });
    console.log(
      `[sync-seed] UPDATED: ${correo} password_hash migrated to real bcryptjs hash.`,
    );
  }

  // 2. Align existing Pro plans from legacy 199.99 / 15 -> 399 / 10
  const proResult = await Usuario.updateMany(
    {
      'plan.nombre': 'Pro',
      $or: [
        { 'plan.precio': { $ne: 399 } },
        { 'plan.max_proyectos_mes': { $ne: 10 } },
      ],
    },
    {
      $set: {
        'plan.precio': 399,
        'plan.max_proyectos_mes': 10,
      },
    },
  );

  console.log(
    `[sync-seed] Pro plan alignment: matched=${proResult.matchedCount}, modified=${proResult.modifiedCount}.`,
  );

  const totalUsers = await Usuario.countDocuments();
  console.log(`[sync-seed] Completed safely. Total usuarios preserved: ${totalUsers}.`);

  await conn.close();
}

runSafeSeedSync()
  .then(() => {
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error('[sync-seed] Error:', err);
    process.exit(1);
  });
