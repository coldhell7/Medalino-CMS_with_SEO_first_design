import postgres from "postgres";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { orders } from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let client: ReturnType<typeof postgres> | null = null;

export function getDb(connectionString?: string): Database {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!client) {
    client = postgres(url, { max: 10, prepare: false });
  }
  return drizzle(client, { schema });
}

export async function countOrders(): Promise<number> {
  const db = getDb();
  const [row] = await db.select({ value: count() }).from(orders);
  return Number(row?.value ?? 0);
}

export { schema };
export * from "./schema";
