import { Hono } from 'hono';
import { CloudflareBindings, ApiResponse, Image } from '../types';
import { getTokenFromCookie, verifyToken } from '../utils/auth';
import { getUserImages, saveImageRecord, deleteImageRecord } from '../utils/database';

export const imageRoutes = new Hono<{ Bindings: CloudflareBindings }>();

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
  await next();
};

// ユーザーの画像一覧取得
imageRoutes.get('/my-images', authMiddleware, async (c) => {
  try {
    const { DB } = c.env;
    const userId = c.get('userId');

    const images = await getUserImages(DB, userId);

    return c.json<ApiResponse<Image[]>>({
      success: true,
      data: images
    });

  } catch (error) {
    console.error('Get images error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: 'サーバーエラーが発生しました'
    }, 500);
  }
});

// 画像アップロード（最大5枚）
imageRoutes.post('/upload', authMiddleware, async (c) => {
  try {
    const { DB, R2 } = c.env;
    const userId = c.get('userId');

    // FormDataから画像を取得
    const formData = await c.req.formData();
    const uploadedImages: Image[] = [];

    // 既存画像数をチェック
    const existingImages = await getUserImages(DB, userId);
    
    for (let i = 1; i <= 5; i++) {
      const file = formData.get(`image_${i}`) as File;
      if (!file || file.size === 0) continue;

      // ファイルタイプチェック
      if (!file.type.startsWith('image/')) {
        return c.json<ApiResponse>({
          success: false,
          message: `画像${i}: 画像ファイルを選択してください`
        }, 400);
      }

      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        return c.json<ApiResponse>({
          success: false,
          message: `画像${i}: ファイルサイズが大きすぎます（10MB以下にしてください）`
        }, 400);
      }

      try {
        // R2ストレージにアップロード
        const fileName = `user_${userId}_${String(i).padStart(2, '0')}.${file.type.split('/')[1]}`;
        const filePath = `users/${userId}/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        await R2.put(filePath, arrayBuffer, {
          httpMetadata: {
            contentType: file.type,
          },
        });

        // データベースに記録保存
        const success = await saveImageRecord(
          DB,
          userId,
          i,
          file.name,
          filePath,
          file.size,
          file.type
        );

        if (success) {
          uploadedImages.push({
            id: 0, // 仮のID
            user_id: userId,
            image_number: i,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (uploadError) {
        console.error(`Upload error for image ${i}:`, uploadError);
        return c.json<ApiResponse>({
          success: false,
          message: `画像${i}のアップロードに失敗しました`
        }, 500);
      }
    }

    if (uploadedImages.length === 0) {
      return c.json<ApiResponse>({
        success: false,
        message: 'アップロードする画像がありません'
      }, 400);
    }

    return c.json<ApiResponse<Image[]>>({
      success: true,
      data: uploadedImages,
      message: `${uploadedImages.length}枚の画像をアップロードしました`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: 'サーバーエラーが発生しました'
    }, 500);
  }
});

// 画像削除
imageRoutes.delete('/:imageNumber', authMiddleware, async (c) => {
  try {
    const { DB, R2 } = c.env;
    const userId = c.get('userId');
    const imageNumber = parseInt(c.req.param('imageNumber'));

    if (imageNumber < 1 || imageNumber > 5) {
      return c.json<ApiResponse>({
        success: false,
        message: '画像番号は1-5の範囲で指定してください'
      }, 400);
    }

    // 既存画像情報を取得
    const images = await getUserImages(DB, userId);
    const imageToDelete = images.find(img => img.image_number === imageNumber);

    if (imageToDelete) {
      // R2から削除
      try {
        await R2.delete(imageToDelete.file_path);
      } catch (r2Error) {
        console.error('R2 delete error:', r2Error);
      }
    }

    // データベースから削除
    const success = await deleteImageRecord(DB, userId, imageNumber);

    return c.json<ApiResponse>({
      success: success,
      message: success ? '画像を削除しました' : '画像の削除に失敗しました'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    return c.json<ApiResponse>({
      success: false,
      message: 'サーバーエラーが発生しました'
    }, 500);
  }
});

// 画像取得（R2から直接配信）
imageRoutes.get('/:imageNumber', authMiddleware, async (c) => {
  try {
    const { DB, R2 } = c.env;
    let userId = c.get('userId');
    const imageNumber = parseInt(c.req.param('imageNumber'));

    // 管理者の場合は、userIdクエリパラメータを許可
    const queryUserId = c.req.query('userId');
    if (queryUserId) {
      // 管理者権限チェック
      const userEmail = c.get('userEmail');
      const adminEmails = ['admin@webapp.com', 'manager@webapp.com'];
      if (adminEmails.includes(userEmail)) {
        userId = parseInt(queryUserId);
      }
    }

    if (imageNumber < 1 || imageNumber > 5) {
      return c.notFound();
    }

    // 画像情報を取得
    const images = await getUserImages(DB, userId);
    const image = images.find(img => img.image_number === imageNumber);

    if (!image) {
      return c.notFound();
    }

    // R2から画像を取得
    const object = await R2.get(image.file_path);
    if (!object) {
      return c.notFound();
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': image.mime_type || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400'
      }
    });

  } catch (error) {
    console.error('Get image error:', error);
    return c.notFound();
  }
});