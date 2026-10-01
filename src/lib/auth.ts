// Utilitários de Segurança e Autenticação — Concha Literária
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'concha_literaria_super_secret_jwt_key_32_chars_min'
);

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

// 1. Hash de senha seguro com bcryptjs
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 2. Assinatura de JWT com jose
export async function createSessionToken(payload: TokenPayload, expiresIn = '7d'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

// 3. Verificação de JWT
export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      username: payload.username as string
    };
  } catch (error) {
    return null;
  }
}

// 4. Extração e validação do usuário em requisições HTTP da API Vercel
export async function getAuthenticatedUser(req: any): Promise<TokenPayload | null> {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    // Tenta também recuperar de cookies se presente
    const cookieHeader = req.headers?.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/concha_session=([^;]+)/);
      if (match && match[1]) {
        return verifySessionToken(match[1]);
      }
    }
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return verifySessionToken(parts[1]);
}
