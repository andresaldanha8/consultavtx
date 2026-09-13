import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'VitoriaDoXingu2026!Admin';
const SECRET_KEY = process.env.ADMIN_SESSION_SECRET || 'vitoria-do-xingu-100-vozes-secret-2026';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthTokenPayload {
  username: string;
  issuedAt: number;
  expiresAt: number;
}

export function verifyAdminCredentials(user: string, pass: string): boolean {
  if (!user || !pass) return false;
  // Constant-time comparison using fixed 32-byte SHA-256 hashes to prevent timing attacks
  const userHash = crypto.createHash('sha256').update(user).digest();
  const expectedUserHash = crypto.createHash('sha256').update(ADMIN_USER).digest();

  const passHash = crypto.createHash('sha256').update(pass).digest();
  const expectedPassHash = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest();

  const userMatch = crypto.timingSafeEqual(userHash, expectedUserHash);
  const passMatch = crypto.timingSafeEqual(passHash, expectedPassHash);

  return userMatch && passMatch;
}

export function generateAdminToken(username: string): string {
  const now = Date.now();
  const payload: AuthTokenPayload = {
    username,
    issuedAt: now,
    expiresAt: now + TOKEN_TTL_MS,
  };
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [base64Payload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(base64Payload)
      .digest('base64url');

    const sigHash = crypto.createHash('sha256').update(signature).digest();
    const expectedSigHash = crypto.createHash('sha256').update(expectedSig).digest();

    if (!crypto.timingSafeEqual(sigHash, expectedSigHash)) {
      return false;
    }

    const payload: AuthTokenPayload = JSON.parse(
      Buffer.from(base64Payload, 'base64url').toString('utf-8')
    );

    if (Date.now() > payload.expiresAt) {
      return false;
    }

    return payload.username === ADMIN_USER;
  } catch (err) {
    return false;
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  let token: string | undefined;

  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({
      error: 'Acesso não autorizado. Por favor, autentique-se no painel administrativo.',
    });
    return;
  }

  next();
}
