import { Hono } from 'hono';
import { CloudflareBindings, ApiResponse, User } from '../types';
import { getTokenFromCookie, verifyToken } from '../utils/auth';
import { getUserById, updateUser } from '../utils/database';

export const userRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// 認証ミドルウェア
const authMiddleware = async (c: any, next: any) => {
  const token = getTokenFromCookie(c.req.header('Cookie'));
  
  if (!token) {
    return c.json<ApiResponse>({
      success: false,
      message: '認証が必要です'
    }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json<ApiResponse>({
      success: false,
      message: '無効なトークンです'
    }, 401);
  }

  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);
  
  await next();
};

// 現在のユーザー情報取得
userRoutes.get('/me', authMiddleware, async (c) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');

    const user = await getUserById(DB, userId);
    if (!user) {
      return c.json<ApiResponse>({
        success: false,
        message: 'ユーザーが見つかりません'
      }, 404);
    }

    return c.json<ApiResponse<User>>({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: 'サーバーエラーが発生しました'
    }, 500);
  }
});

// ユーザー情報更新
userRoutes.put('/me', authMiddleware, async (c) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');
    const body = await c.req.json();

    // 更新可能なフィールドのみ許可
    const updates: { name?: string; message?: string } = {};
    if (body.name) updates.name = body.name;
    if (body.message !== undefined) updates.message = body.message;

    const success = await updateUser(DB, userId, updates);
    if (!success) {
      return c.json<ApiResponse>({
        success: false,
        message: 'ユーザー情報の更新に失敗しました'
      }, 500);
    }

    // 更新後のユーザー情報を取得
    const updatedUser = await getUserById(DB, userId);

    return c.json<ApiResponse<User>>({
      success: true,
      data: updatedUser,
      message: 'ユーザー情報を更新しました'
    });

  } catch (error) {
    console.error('Update user error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: 'サーバーエラーが発生しました'
    }, 500);
  }
});