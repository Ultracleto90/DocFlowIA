import mongoose, { type ConnectOptions, type Connection } from 'mongoose';

export interface DatabaseConnectionStatus {
  account: 'worker_ia_service' | 'auditor_qa_docuflow';
  privilege: 'readWrite' | 'read';
  status: 'connected' | 'error';
  latencyMs: number;
  error?: string;
}

export interface DatabaseHealthReport {
  healthy: boolean;
  connections: {
    write: DatabaseConnectionStatus;
    readonly: DatabaseConnectionStatus;
  };
}

interface MongoConnectionCache {
  writeConn: Connection | null;
  writePromise: Promise<Connection> | null;
  readonlyConn: Connection | null;
  readonlyPromise: Promise<Connection> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __docuflowMongoCache: MongoConnectionCache | undefined;
}

const MONGO_OPTIONS: ConnectOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  maxPoolSize: 10,
  bufferCommands: false,
};

function getCache(): MongoConnectionCache {
  if (!globalThis.__docuflowMongoCache) {
    globalThis.__docuflowMongoCache = {
      writeConn: null,
      writePromise: null,
      readonlyConn: null,
      readonlyPromise: null,
    };
  }
  return globalThis.__docuflowMongoCache;
}

async function resolveConnection(
  uriEnvKey: 'MONGO_URI' | 'MONGO_URI_READONLY',
  connKey: 'writeConn' | 'readonlyConn',
  promiseKey: 'writePromise' | 'readonlyPromise',
): Promise<Connection> {
  const uri = process.env[uriEnvKey];
  if (!uri) {
    throw new Error(`Missing required environment variable: ${uriEnvKey}`);
  }

  const cache = getCache();
  const existing = cache[connKey];
  if (existing && existing.readyState === 1) {
    return existing;
  }

  if (existing && existing.readyState !== 1) {
    cache[connKey] = null;
  }

  if (!cache[promiseKey]) {
    const connection = mongoose.createConnection(uri, MONGO_OPTIONS);
    cache[promiseKey] = connection.asPromise().catch((err: unknown) => {
      cache[promiseKey] = null;
      cache[connKey] = null;
      throw err;
    });
  }

  const connected = await cache[promiseKey];
  cache[connKey] = connected;
  return connected;
}

/**
 * Returns the isolated Mongoose connection for `worker_ia_service` (readWrite).
 */
export async function getWriteConnection(): Promise<Connection> {
  return resolveConnection('MONGO_URI', 'writeConn', 'writePromise');
}

/**
 * Returns the isolated Mongoose connection for `auditor_qa_docuflow` (read-only).
 */
export async function getReadOnlyConnection(): Promise<Connection> {
  return resolveConnection('MONGO_URI_READONLY', 'readonlyConn', 'readonlyPromise');
}

async function pingConnection(
  account: DatabaseConnectionStatus['account'],
  privilege: DatabaseConnectionStatus['privilege'],
  connector: () => Promise<Connection>,
): Promise<DatabaseConnectionStatus> {
  const startedAt = Date.now();
  try {
    const conn = await connector();
    if (!conn.db) {
      throw new Error('MongoDB database handle is not initialized');
    }
    await conn.db.command({ ping: 1 });
    return {
      account,
      privilege,
      status: 'connected',
      latencyMs: Date.now() - startedAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown MongoDB connection error';
    return {
      account,
      privilege,
      status: 'error',
      latencyMs: Date.now() - startedAt,
      error: message,
    };
  }
}

/**
 * Verifies both least-privilege MongoDB connections (`readWrite` and `read`) with scoped ping.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthReport> {
  const [write, readonly] = await Promise.all([
    pingConnection('worker_ia_service', 'readWrite', getWriteConnection),
    pingConnection('auditor_qa_docuflow', 'read', getReadOnlyConnection),
  ]);

  return {
    healthy: write.status === 'connected' && readonly.status === 'connected',
    connections: {
      write,
      readonly,
    },
  };
}
