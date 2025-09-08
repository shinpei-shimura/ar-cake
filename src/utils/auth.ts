import * as bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';

// JWT Secret (本番環境では環境変数から取得)
const JWT_SECRET = 'your-secret-key-change-this-in-production';

// パスワードハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// パスワード検証
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// JWT作成
export async function createToken(payload: { userId: number; email: string }): Promise<string> {
  const expiresIn = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24時間
  
  return await sign({
    ...payload,
    exp: expiresIn,
    iat: Math.floor(Date.now() / 1000)
  }, JWT_SECRET);
}

// JWT検証
export async function verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const payload = await verify(token, JWT_SECRET) as any;
    
    // 有効期限チェック
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      userId: payload.userId,
      email: payload.email
    };
  } catch (error) {
    return null;
  }
}

// セッション管理ヘルパー
export async function createSession(db: D1Database, userId: number, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後
  
  await db.prepare(`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).bind(userId, token, expiresAt.toISOString()).run();
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare(`
    DELETE FROM sessions WHERE token = ?
  `).bind(token).run();
}

export async function validateSession(db: D1Database, token: string): Promise<number | null> {
  const session = await db.prepare(`
    SELECT user_id FROM sessions 
    WHERE token = ? AND expires_at > datetime('now')
  `).bind(token).first();
  
  return session ? session.user_id as number : null;
}

// Cookieからトークンを取得
export function getTokenFromCookie(cookie: string | undefined): string | null {
  if (!cookie) return null;
  
  const cookies = cookie.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('auth_token='));
  
  return authCookie ? authCookie.split('=')[1] : null;
}

// Cookieにトークンを設定
export function setAuthCookie(token: string): string {
  const maxAge = 24 * 60 * 60; // 24時間（秒）
  return `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`;
}