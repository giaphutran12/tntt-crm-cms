import "server-only";
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getRequiredDatabaseUrl } from "@/lib/env";

declare global {
  var __tnttPool: Pool | undefined;
}

export function getDatabaseSslConfig(databaseUrl = getRequiredDatabaseUrl()) {
  const parsedUrl = new URL(databaseUrl);
  const sslMode = parsedUrl.searchParams.get("sslmode")?.toLowerCase();
  const hostname = parsedUrl.hostname.toLowerCase();
  const isLocalDatabaseHost =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  if (sslMode === "disable" || isLocalDatabaseHost) {
    return false;
  }

  return { rejectUnauthorized: false };
}

function createPool() {
  return new Pool({
    connectionString: getRequiredDatabaseUrl(),
    max: 10,
    ssl: getDatabaseSslConfig(),
  });
}

export function getDbPool() {
  if (!global.__tnttPool) {
    global.__tnttPool = createPool();
  }

  return global.__tnttPool;
}

export type DbAccessContext = {
  role?: "anon" | "authenticated";
  userId?: string | null;
};

export function buildDbAccessClaims(
  accessContext: DbAccessContext,
) {
  const role = accessContext.role ?? "authenticated";

  return {
    claims: JSON.stringify({
      role,
      sub: accessContext.userId ?? null,
    }),
    role,
    userId: accessContext.userId ?? "",
  };
}

async function applyDbAccessContext(
  client: PoolClient,
  accessContext?: DbAccessContext,
) {
  if (!accessContext) {
    return;
  }

  const { claims, role, userId } = buildDbAccessClaims(accessContext);

  await client.query(`set local role ${role}`);
  await client.query(
    `
      select
        set_config('request.jwt.claim.role', $1, true),
        set_config('request.jwt.claim.sub', $2, true),
        set_config('request.jwt.claims', $3, true)
    `,
    [role, userId, claims],
  );
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
  accessContext?: DbAccessContext,
) {
  if (!accessContext) {
    const pool = getDbPool();

    return pool.query<T>(text, values);
  }

  const client = await getDbPool().connect();

  try {
    await client.query("begin");
    await applyDbAccessContext(client, accessContext);
    const result = await client.query<T>(text, values);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  accessContext?: DbAccessContext,
) {
  const client = await getDbPool().connect();

  try {
    await client.query("begin");
    await applyDbAccessContext(client, accessContext);
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export type SqlQueryResult<T extends QueryResultRow = QueryResultRow> = QueryResult<T>;
