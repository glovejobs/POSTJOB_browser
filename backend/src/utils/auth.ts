import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function generateApiKey(): string {
  return `jmp_${randomBytes(32).toString('hex')}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10);
}

export async function verifyApiKey(apiKey: string, hashedApiKey: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hashedApiKey);
}

export function generateJWT(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

export function verifyJWT(token: string): { userId: string } {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
}