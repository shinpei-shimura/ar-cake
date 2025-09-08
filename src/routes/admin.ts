import { Hono } from 'hono';
import { CloudflareBindings, ApiResponse } from '../types';
import { getTokenFromCookie, verifyToken } from '../utils/auth';
import { getAllUsers, getAllImages } from '../utils/database';

export const adminRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// 管理者認証ミドルウェア
const adminMiddleware = async (c: any, next: any) => {
  const token = getTokenFromCookie(c.req.header('Cookie'));
  
  if (!token) {
    return c.json<ApiResponse>({
      success: false,
      message: '管理者認証が必要です'
    }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json<ApiResponse>({
      success: false,
      message: '無効なトークンです'
    }, 401);
  }

  // 管理者権限チェック（管理者用の特定メールアドレスをチェック）
  const adminEmails = ['admin@webapp.com', 'manager@webapp.com'];
  if (!adminEmails.includes(payload.email)) {
    return c.json<ApiResponse>({
      success: false,
      message: '管理者権限がありません'
    }, 403);
  }

  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);
  
  await next();
};

// 管理者用：全ユーザー情報取得
adminRoutes.get('/users', adminMiddleware, async (c) => {
  try {
    const { DB } = c.env;

    const users = await getAllUsers(DB);

    return c.json<ApiResponse>({
      success: true,
      data: users,
      message: `${users.length}名のユーザーが見つかりました`
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: 'ユーザー情報の取得に失敗しました'
    }, 500);
  }
});

// 管理者用：全ユーザーの画像情報取得
adminRoutes.get('/images', adminMiddleware, async (c) => {
  try {
    const { DB } = c.env;

    const images = await getAllImages(DB);

    return c.json<ApiResponse>({
      success: true,
      data: images,
      message: `${images.length}枚の画像が見つかりました`
    });

  } catch (error) {
    console.error('Get all images error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: '画像情報の取得に失敗しました'
    }, 500);
  }
});

// 管理者用：特定ユーザーの詳細情報（画像含む）取得
adminRoutes.get('/users/:userId', adminMiddleware, async (c) => {
  try {
    const { DB } = c.env;
    const userId = parseInt(c.req.param('userId'));

    if (isNaN(userId)) {
      return c.json<ApiResponse>({
        success: false,
        message: '無効なユーザーIDです'
      }, 400);
    }

    // ユーザー情報取得
    const user = await DB.prepare(`
      SELECT id, name, order_number, email, message, created_at, updated_at
      FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json<ApiResponse>({
        success: false,
        message: 'ユーザーが見つかりません'
      }, 404);
    }

    // ユーザーの画像情報取得
    const images = await DB.prepare(`
      SELECT id, user_id, image_number, file_name, file_path, file_size, mime_type, created_at, updated_at
      FROM images WHERE user_id = ? ORDER BY image_number
    `).bind(userId).all();

    return c.json<ApiResponse>({
      success: true,
      data: {
        user,
        images: images.results
      }
    });

  } catch (error) {
    console.error('Get user detail error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: 'ユーザー詳細情報の取得に失敗しました'
    }, 500);
  }
});

// 管理者用：システム統計情報取得
adminRoutes.get('/stats', adminMiddleware, async (c) => {
  try {
    const { DB } = c.env;

    // ユーザー数
    const userCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();

    // 画像数
    const imageCount = await DB.prepare(`
      SELECT COUNT(*) as count FROM images
    `).first();

    // 今日の新規登録数
    const todayUsers = await DB.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE DATE(created_at) = DATE('now')
    `).first();

    // 今日のアップロード数
    const todayImages = await DB.prepare(`
      SELECT COUNT(*) as count FROM images 
      WHERE DATE(created_at) = DATE('now')
    `).first();

    // 画像付きユーザー数
    const usersWithImages = await DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM images
    `).first();

    return c.json<ApiResponse>({
      success: true,
      data: {
        totalUsers: userCount?.count || 0,
        totalImages: imageCount?.count || 0,
        todayNewUsers: todayUsers?.count || 0,
        todayNewImages: todayImages?.count || 0,
        usersWithImages: usersWithImages?.count || 0
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: '統計情報の取得に失敗しました'
    }, 500);
  }
});