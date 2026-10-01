// Prisma Client Singleton com inicializacao preguicosa (Lazy Proxy) para Serverless Vercel
import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const isDev = process.env.NODE_ENV === 'development';
    prismaInstance = new PrismaClient({
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

