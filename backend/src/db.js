/**
 * Shared Prisma client. Prisma 7 requires a driver adapter instead of
 * reading `url` from schema.prisma.
 */
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { Prisma, PrismaClient } from '@prisma/client';

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
});

export const prisma = new PrismaClient({ adapter });
export { Prisma };
