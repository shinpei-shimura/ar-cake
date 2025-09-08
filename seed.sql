-- テスト用データ（パスワードは "password123" のハッシュ）
-- bcryptjs でハッシュ化: $2b$10$sFhq9g8pCZT0YLNo66eODeUNPqlheTawMFV0UZKaaeIjFJ1OmnQpC

INSERT OR IGNORE INTO users (name, order_number, email, password_hash, message) VALUES 
  ('田中太郎', 'ORD001', 'tanaka@example.com', '$2b$10$sFhq9g8pCZT0YLNo66eODeUNPqlheTawMFV0UZKaaeIjFJ1OmnQpC', 'テスト用のメッセージです。'),
  ('佐藤花子', 'ORD002', 'sato@example.com', '$2b$10$sFhq9g8pCZT0YLNo66eODeUNPqlheTawMFV0UZKaaeIjFJ1OmnQpC', 'こちらもテスト用のメッセージです。'),
  ('管理者', 'ADMIN001', 'admin@webapp.com', '$2b$10$sFhq9g8pCZT0YLNo66eODeUNPqlheTawMFV0UZKaaeIjFJ1OmnQpC', '管理者アカウントです。');

-- テスト用の画像データ（実際のファイルはR2ストレージに保存）
INSERT OR IGNORE INTO images (user_id, image_number, file_name, file_path, file_size, mime_type) VALUES 
  (1, 1, 'sample1.jpg', 'users/tanaka_taro/01.jpg', 1024000, 'image/jpeg'),
  (1, 2, 'sample2.jpg', 'users/tanaka_taro/02.jpg', 2048000, 'image/jpeg'),
  (2, 1, 'photo1.jpg', 'users/sato_hanako/01.jpg', 1536000, 'image/jpeg');