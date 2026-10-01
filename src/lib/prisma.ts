// Prisma Client Singleton com inicializacao preguicosa (Lazy Proxy) para Serverless Vercel
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.STORAGE_PRISMA_URL ||
    process.env.STORAGE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL
  );
}

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const isDev = process.env.NODE_ENV === 'development';
    const dbUrl = getDatabaseUrl();
    if (dbUrl && !process.env.DATABASE_URL) {
      process.env.DATABASE_URL = dbUrl;
    }
    prismaInstance = new PrismaClient({
      datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
      log: isDev ? ['query', 'error', 'warn'] : ['error']
    });
  }
  return prismaInstance;
}

// Proxy transparente: Prisma só instancia quando um método é realmente invocado
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export default prisma;

