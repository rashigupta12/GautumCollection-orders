// import { neon } from '@neondatabase/serverless'
// import { drizzle } from 'drizzle-orm/neon-http'
// import * as schema from './schema'

// const sql = neon(process.env.DATABASE_URL!)
// export const db = drizzle(sql, { schema })

// lib/db.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = neon(connectionString);
export const db = drizzle(client, { schema });
export type DB = typeof db;