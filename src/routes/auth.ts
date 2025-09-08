import { Hono } from 'hono';
import { CloudflareBindings, RegisterRequest, LoginRequest, AuthResponse } from '../types';
import { hashPassword, verifyPassword, createToken, createSession, deleteSession, getTokenFromCookie, setAuthCookie } from '../utils/auth';
import { createUser, getUserByEmail, getUserByOrderNumber } from '../utils/database';

export const authRoutes = new Hono<{ Bindings: CloudflareBindings }>();

// 会員登録
authRoutes.post('/register', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json() as RegisterRequest;

    // バリデーション
    if (!body.name || !body.order_number || !body.email || !body.password) {
      return c.json<AuthResponse>({
        success: false,
        message: '必要な情報が入力されていません'
      }, 400);
    }

    // メールアドレスの重複チェック
    const existingUser = await getUserByEmail(DB, body.email);
    if (existingUser) {
      return c.json<AuthResponse>({
        success: false,
        message: 'このメールアドレスは既に登録されています'
      }, 400);
    }

    // 受注番号の重複チェック
    const existingOrderUser = await getUserByOrderNumber(DB, body.order_number);
    if (existingOrderUser) {
      return c.json<AuthResponse>({
        success: false,
        message: 'この受注番号は既に登録されています'
      }, 400);
    }

    // パスワードハッシュ化
    const passwordHash = await hashPassword(body.password);

    // ユーザー作成
    const user = await createUser(DB, body, passwordHash);
    if (!user) {
      return c.json<AuthResponse>({
        success: false,
        message: 'ユーザー登録に失敗しました'
      }, 500);
    }

    // JWT作成
    const token = await createToken({ userId: user.id, email: user.email });
    
    // セッション保存
    await createSession(DB, user.id, token);

    // レスポンスにCookie設定
    const response = c.json<AuthResponse>({
      success: true,
      token,
      user,
      message: '会員登録が完了しました'
    });

    response.headers.set('Set-Cookie', setAuthCookie(token));
    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return c.json<AuthResponse>({
      success: false,
      message: 'サーバーエラーが発生しました'
    }, 500);
  }
});

// ログイン
authRoutes.post('/login', async (c) => {
  try {
    const { DB } = c.env;
    const body = await c.req.json() as LoginRequest;

    // バリデーション
    if (!body.email || !body.password) {
      return c.json<AuthResponse>({
        success: false,
        message: 'メールアドレスとパスワードを入力してください'
      }, 400);
    }

    // ユーザー取得
    const user = await getUserByEmail(DB, body.email);
    if (!user) {
      return c.json<AuthResponse>({
        success: false,
        message: 'ユーザーが見つかりません'
      }, 401);
    }

    // パスワード検証
    const isValidPassword = await verifyPassword(body.password, user.password_hash);
    if (!isValidPassword) {
      return c.json<AuthResponse>({
        success: false,
        message: 'パスワードが正しくありません'
      }, 401);
    }

    // JWT作成
    const token = await createToken({ userId: user.id, email: user.email });
    
    // セッション保存
    await createSession(DB, user.id, token);

    // パスワードハッシュを除外
    const { password_hash, ...userWithoutPassword } = user;

    // レスポンスにCookie設定
    const response = c.json<AuthResponse>({
      success: true,
      token,
      user: userWithoutPassword,
      message: 'ログインに成功しました'
    });

    response.headers.set('Set-Cookie', setAuthCookie(token));
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return c.json<AuthResponse>({
      success: false,
      message: 'サーバーエラーが発生しました'
    }, 500);
  }
});

// ログアウト
authRoutes.post('/logout', async (c) => {
  try {
    const { DB } = c.env;
    const token = getTokenFromCookie(c.req.header('Cookie'));

    if (token) {
      // セッション削除
      await deleteSession(DB, token);
    }

    // Cookieクリア
    const response = c.json<AuthResponse>({
      success: true,
      message: 'ログアウトしました'
    });

    response.headers.set('Set-Cookie', 'auth_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return c.json<AuthResponse>({
      success: false,
      message: 'サーバーエラーが発生しました'
    }, 500);
  }
});