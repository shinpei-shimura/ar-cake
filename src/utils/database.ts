import { User, Image, RegisterRequest } from '../types';

// ユーザー関連のデータベース操作

export async function createUser(db: D1Database, userData: RegisterRequest, passwordHash: string): Promise<User | null> {
  try {
    const result = await db.prepare(`
      INSERT INTO users (name, order_number, email, password_hash, message)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userData.name,
      userData.order_number,
      userData.email,
      passwordHash,
      userData.message || null
    ).run();

    if (!result.success) {
      return null;
    }

    return await getUserById(db, result.meta.last_row_id as number);
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  try {
    const user = await db.prepare(`
      SELECT id, name, order_number, email, message, created_at, updated_at
      FROM users WHERE id = ?
    `).bind(id).first();

    return user ? user as User : null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

export async function getUserByEmail(db: D1Database, email: string): Promise<(User & { password_hash: string }) | null> {
  try {
    const user = await db.prepare(`
      SELECT id, name, order_number, email, password_hash, message, created_at, updated_at
      FROM users WHERE email = ?
    `).bind(email).first();

    return user ? user as (User & { password_hash: string }) : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

export async function getUserByOrderNumber(db: D1Database, orderNumber: string): Promise<User | null> {
  try {
    const user = await db.prepare(`
      SELECT id, name, order_number, email, message, created_at, updated_at
      FROM users WHERE order_number = ?
    `).bind(orderNumber).first();

    return user ? user as User : null;
  } catch (error) {
    console.error('Error getting user by order number:', error);
    return null;
  }
}

export async function updateUser(db: D1Database, userId: number, updates: Partial<Pick<User, 'name' | 'message'>>): Promise<boolean> {
  try {
    const setParts: string[] = [];
    const bindings: any[] = [];

    if (updates.name !== undefined) {
      setParts.push('name = ?');
      bindings.push(updates.name);
    }
    
    if (updates.message !== undefined) {
      setParts.push('message = ?');
      bindings.push(updates.message);
    }

    if (setParts.length === 0) {
      return true; // 更新する内容がない
    }

    setParts.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(userId);

    const result = await db.prepare(`
      UPDATE users SET ${setParts.join(', ')} WHERE id = ?
    `).bind(...bindings).run();

    return result.success;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
}

// 画像関連のデータベース操作

export async function getUserImages(db: D1Database, userId: number): Promise<Image[]> {
  try {
    const images = await db.prepare(`
      SELECT id, user_id, image_number, file_name, file_path, file_size, mime_type, created_at, updated_at
      FROM images WHERE user_id = ? ORDER BY image_number
    `).bind(userId).all();

    return images.results as Image[];
  } catch (error) {
    console.error('Error getting user images:', error);
    return [];
  }
}

export async function saveImageRecord(
  db: D1Database, 
  userId: number, 
  imageNumber: number, 
  fileName: string, 
  filePath: string, 
  fileSize?: number, 
  mimeType?: string
): Promise<boolean> {
  try {
    const result = await db.prepare(`
      INSERT OR REPLACE INTO images (user_id, image_number, file_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, imageNumber, fileName, filePath, fileSize || null, mimeType || null).run();

    return result.success;
  } catch (error) {
    console.error('Error saving image record:', error);
    return false;
  }
}

export async function deleteImageRecord(db: D1Database, userId: number, imageNumber: number): Promise<boolean> {
  try {
    const result = await db.prepare(`
      DELETE FROM images WHERE user_id = ? AND image_number = ?
    `).bind(userId, imageNumber).run();

    return result.success;
  } catch (error) {
    console.error('Error deleting image record:', error);
    return false;
  }
}

// 管理者用：全ユーザー取得
export async function getAllUsers(db: D1Database): Promise<User[]> {
  try {
    const users = await db.prepare(`
      SELECT id, name, order_number, email, message, created_at, updated_at
      FROM users ORDER BY created_at DESC
    `).all();

    return users.results as User[];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// 管理者用：全画像取得（ユーザー情報付き）
export async function getAllImages(db: D1Database): Promise<any[]> {
  try {
    const images = await db.prepare(`
      SELECT 
        i.id,
        i.user_id,
        i.image_number,
        i.file_name,
        i.file_path,
        i.file_size,
        i.mime_type,
        i.created_at,
        i.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.order_number as user_order_number
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
    `).all();

    return images.results as any[];
  } catch (error) {
    console.error('Error getting all images:', error);
    return [];
  }
}