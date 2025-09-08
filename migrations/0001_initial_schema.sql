-- Users table (会員登録情報)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                    -- 名前
  order_number TEXT NOT NULL UNIQUE,     -- 受注番号
  email TEXT NOT NULL UNIQUE,            -- メールアドレス
  password_hash TEXT NOT NULL,           -- パスワードハッシュ
  message TEXT,                          -- メッセージ（テキスト）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Images table (画像管理)
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  image_number INTEGER NOT NULL,         -- 01, 02, 03, 04, 05 (1-5)
  file_name TEXT NOT NULL,              -- 元のファイル名
  file_path TEXT NOT NULL,              -- R2ストレージのパス
  file_size INTEGER,                    -- ファイルサイズ
  mime_type TEXT,                       -- MIMEタイプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, image_number)         -- ユーザーごとに連番で管理
);

-- Sessions table (ログインセッション管理)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,            -- JWT token
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_order_number ON users(order_number);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);