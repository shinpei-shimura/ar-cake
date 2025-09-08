import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { CloudflareBindings } from './types'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { imageRoutes } from './routes/images'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// CORS設定
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/users', userRoutes)
app.route('/api/images', imageRoutes)

// メインページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>会員登録・ファイル管理システム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-users mr-2 text-blue-600"></i>
                        会員システム
                    </h1>
                    <p class="text-gray-600">ファイル管理システムへようこそ</p>
                </div>
                
                <div class="space-y-4">
                    <a href="/register" class="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center">
                        <i class="fas fa-user-plus mr-2"></i>
                        新規会員登録
                    </a>
                    
                    <a href="/login" class="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center">
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        ログイン
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
})

// 会員登録ページ
app.get('/register', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>会員登録</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center mb-6">
                    <a href="/" class="text-blue-600 hover:text-blue-700 mr-4">
                        <i class="fas fa-arrow-left"></i> 戻る
                    </a>
                    <h1 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-user-plus mr-2 text-blue-600"></i>
                        新規会員登録
                    </h1>
                </div>

                <form id="registerForm" enctype="multipart/form-data">
                    <div class="grid md:grid-cols-2 gap-6">
                        <!-- 基本情報 -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-gray-700">基本情報</h3>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">名前 *</label>
                                <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">受注番号 *</label>
                                <input type="text" name="order_number" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">メールアドレス *</label>
                                <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">パスワード *</label>
                                <input type="password" name="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">メッセージ</label>
                                <textarea name="message" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ご自由にメッセージをご記入ください"></textarea>
                            </div>
                        </div>

                        <!-- 画像アップロード -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-gray-700">画像アップロード（最大5枚）</h3>
                            
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">画像1</label>
                                    <input type="file" name="image_1" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">画像2</label>
                                    <input type="file" name="image_2" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">画像3</label>
                                    <input type="file" name="image_3" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">画像4</label>
                                    <input type="file" name="image_4" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">画像5</label>
                                    <input type="file" name="image_5" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 pt-4 border-t">
                        <button type="submit" id="submitBtn" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-user-plus mr-2"></i>
                            会員登録
                        </button>
                    </div>
                </form>

                <div id="message" class="mt-4 hidden"></div>
            </div>
        </div>

        <script>
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                const messageDiv = document.getElementById('message');
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登録中...';
                
                try {
                    // まず基本情報を登録
                    const formData = new FormData(e.target);
                    const userData = {
                        name: formData.get('name'),
                        order_number: formData.get('order_number'),
                        email: formData.get('email'),
                        password: formData.get('password'),
                        message: formData.get('message')
                    };

                    const registerResponse = await axios.post('/api/auth/register', userData);
                    
                    if (registerResponse.data.success) {
                        // 画像がある場合はアップロード
                        const hasImages = Array.from({length: 5}, (_, i) => 
                            formData.get(\`image_\${i+1}\`) && formData.get(\`image_\${i+1}\`).size > 0
                        ).some(Boolean);

                        if (hasImages) {
                            const imageFormData = new FormData();
                            for (let i = 1; i <= 5; i++) {
                                const file = formData.get(\`image_\${i}\`);
                                if (file && file.size > 0) {
                                    imageFormData.append(\`image_\${i}\`, file);
                                }
                            }

                            const uploadResponse = await axios.post('/api/images/upload', imageFormData, {
                                headers: {
                                    'Content-Type': 'multipart/form-data'
                                }
                            });

                            if (uploadResponse.data.success) {
                                messageDiv.className = 'mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded';
                                messageDiv.textContent = '会員登録と画像アップロードが完了しました！';
                            } else {
                                messageDiv.className = 'mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded';
                                messageDiv.textContent = '会員登録は完了しましたが、画像のアップロードに失敗しました。';
                            }
                        } else {
                            messageDiv.className = 'mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded';
                            messageDiv.textContent = '会員登録が完了しました！';
                        }

                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 2000);
                    } else {
                        throw new Error(registerResponse.data.message);
                    }
                } catch (error) {
                    messageDiv.className = 'mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded';
                    messageDiv.textContent = error.response?.data?.message || error.message || '登録に失敗しました';
                } finally {
                    messageDiv.classList.remove('hidden');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>会員登録';
                }
            });
        </script>
    </body>
    </html>
  `)
})

// ログインページ
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ログイン</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center mb-6">
                    <a href="/" class="text-blue-600 hover:text-blue-700 mr-4">
                        <i class="fas fa-arrow-left"></i> 戻る
                    </a>
                    <h1 class="text-2xl font-bold text-gray-800">
                        <i class="fas fa-sign-in-alt mr-2 text-green-600"></i>
                        ログイン
                    </h1>
                </div>

                <form id="loginForm">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                            <input type="email" name="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
                            <input type="password" name="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        </div>

                        <button type="submit" id="submitBtn" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-sign-in-alt mr-2"></i>
                            ログイン
                        </button>
                    </div>
                </form>

                <div id="message" class="mt-4 hidden"></div>

                <div class="mt-6 text-center">
                    <p class="text-sm text-gray-600">
                        アカウントをお持ちでない場合は
                        <a href="/register" class="text-blue-600 hover:text-blue-700">こちらから登録</a>
                    </p>
                </div>
            </div>
        </div>

        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submitBtn');
                const messageDiv = document.getElementById('message');
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>ログイン中...';
                
                try {
                    const formData = new FormData(e.target);
                    const loginData = {
                        email: formData.get('email'),
                        password: formData.get('password')
                    };

                    const response = await axios.post('/api/auth/login', loginData);
                    
                    if (response.data.success) {
                        messageDiv.className = 'mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded';
                        messageDiv.textContent = 'ログインに成功しました！';
                        
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1000);
                    } else {
                        throw new Error(response.data.message);
                    }
                } catch (error) {
                    messageDiv.className = 'mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded';
                    messageDiv.textContent = error.response?.data?.message || error.message || 'ログインに失敗しました';
                } finally {
                    messageDiv.classList.remove('hidden');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>ログイン';
                }
            });
        </script>
    </body>
    </html>
  `)
})

// ダッシュボードページ
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ダッシュボード</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100 min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <!-- ヘッダー -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">
                            <i class="fas fa-tachometer-alt mr-2 text-blue-600"></i>
                            ダッシュボード
                        </h1>
                        <p class="text-gray-600 mt-1" id="welcomeMessage">読み込み中...</p>
                    </div>
                    <button id="logoutBtn" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <i class="fas fa-sign-out-alt mr-2"></i>
                        ログアウト
                    </button>
                </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-6">
                <!-- プロフィール情報 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-user mr-2 text-green-600"></i>
                        プロフィール
                    </h2>
                    <div id="profileInfo" class="space-y-3">
                        <div class="text-center text-gray-500">
                            <i class="fas fa-spinner fa-spin text-2xl"></i>
                            <p class="mt-2">読み込み中...</p>
                        </div>
                    </div>
                    <button id="editProfileBtn" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors hidden">
                        <i class="fas fa-edit mr-2"></i>
                        編集
                    </button>
                </div>

                <!-- 画像管理 -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">
                        <i class="fas fa-images mr-2 text-purple-600"></i>
                        画像管理（5枚まで）
                    </h2>
                    <div id="imageGallery" class="space-y-3">
                        <div class="text-center text-gray-500">
                            <i class="fas fa-spinner fa-spin text-2xl"></i>
                            <p class="mt-2">読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- プロフィール編集モーダル -->
            <div id="editModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 class="text-lg font-semibold mb-4">プロフィール編集</h3>
                        <form id="editForm">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">名前</label>
                                    <input type="text" id="editName" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">メッセージ</label>
                                    <textarea id="editMessage" name="message" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                </div>
                            </div>
                            <div class="flex space-x-3 mt-6">
                                <button type="submit" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                    保存
                                </button>
                                <button type="button" id="cancelEdit" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                                    キャンセル
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div id="message" class="mt-4 hidden"></div>
        </div>

        <script>
            let currentUser = null;
            let currentImages = [];

            // 認証チェック
            async function checkAuth() {
                try {
                    const response = await axios.get('/api/users/me');
                    if (response.data.success) {
                        currentUser = response.data.data;
                        updateUI();
                    } else {
                        window.location.href = '/login';
                    }
                } catch (error) {
                    window.location.href = '/login';
                }
            }

            // UI更新
            function updateUI() {
                document.getElementById('welcomeMessage').textContent = \`\${currentUser.name}さん、お疲れさまです\`;
                
                // プロフィール情報表示
                const profileDiv = document.getElementById('profileInfo');
                profileDiv.innerHTML = \`
                    <div class="space-y-2">
                        <div><strong>名前:</strong> \${currentUser.name}</div>
                        <div><strong>受注番号:</strong> \${currentUser.order_number}</div>
                        <div><strong>メールアドレス:</strong> \${currentUser.email}</div>
                        <div><strong>メッセージ:</strong> \${currentUser.message || 'なし'}</div>
                        <div><strong>登録日:</strong> \${new Date(currentUser.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                \`;
                
                document.getElementById('editProfileBtn').classList.remove('hidden');
                loadImages();
            }

            // 画像読み込み
            async function loadImages() {
                try {
                    const response = await axios.get('/api/images/my-images');
                    if (response.data.success) {
                        currentImages = response.data.data;
                        displayImages();
                    }
                } catch (error) {
                    console.error('Error loading images:', error);
                    showMessage('画像の読み込みに失敗しました', 'error');
                }
            }

            // 画像表示（5つのスロット表示）
            function displayImages() {
                const galleryDiv = document.getElementById('imageGallery');
                
                // 5つのスロットを作成
                const slots = [];
                for (let i = 1; i <= 5; i++) {
                    const existingImage = currentImages.find(img => img.image_number === i);
                    
                    if (existingImage) {
                        // 既存画像がある場合
                        slots.push(\`
                            <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                                <div class="flex items-center space-x-3">
                                    <div class="bg-green-100 rounded-lg p-2">
                                        <i class="fas fa-image text-2xl text-green-600"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium text-green-800">画像\${i}</p>
                                        <p class="text-sm text-gray-600">\${existingImage.file_name}</p>
                                        <p class="text-xs text-gray-500">\${(existingImage.file_size / 1024 / 1024).toFixed(2)}MB</p>
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <a href="/api/images/\${i}" target="_blank" class="text-blue-600 hover:text-blue-700 p-1">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                    <button onclick="deleteImage(\${i})" class="text-red-600 hover:text-red-700 p-1">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        \`);
                    } else {
                        // 空きスロットの場合
                        slots.push(\`
                            <div class="flex items-center justify-between p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div class="flex items-center space-x-3">
                                    <div class="bg-gray-200 rounded-lg p-2">
                                        <i class="fas fa-plus text-2xl text-gray-400"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-600">画像\${i}</p>
                                        <p class="text-sm text-gray-500">未アップロード</p>
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <input type="file" id="imageInput\${i}" accept="image/*" class="hidden" onchange="uploadSingleImage(\${i}, this)">
                                    <button onclick="document.getElementById('imageInput\${i}').click()" class="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors text-sm">
                                        <i class="fas fa-upload mr-1"></i>
                                        選択
                                    </button>
                                </div>
                            </div>
                        \`);
                    }
                }

                galleryDiv.innerHTML = slots.join('');
            }

            // メッセージ表示
            function showMessage(text, type = 'info') {
                const messageDiv = document.getElementById('message');
                const className = {
                    'success': 'bg-green-100 border-green-400 text-green-700',
                    'error': 'bg-red-100 border-red-400 text-red-700',
                    'info': 'bg-blue-100 border-blue-400 text-blue-700'
                }[type];
                
                messageDiv.className = \`mt-4 p-3 border rounded \${className}\`;
                messageDiv.textContent = text;
                messageDiv.classList.remove('hidden');
                
                setTimeout(() => {
                    messageDiv.classList.add('hidden');
                }, 5000);
            }

            // 画像削除
            async function deleteImage(imageNumber) {
                if (!confirm('この画像を削除しますか？')) return;
                
                try {
                    const response = await axios.delete(\`/api/images/\${imageNumber}\`);
                    if (response.data.success) {
                        showMessage('画像を削除しました', 'success');
                        loadImages();
                    } else {
                        showMessage('画像の削除に失敗しました', 'error');
                    }
                } catch (error) {
                    showMessage(error.response?.data?.message || '画像の削除に失敗しました', 'error');
                }
            }

            // イベントリスナー
            document.getElementById('logoutBtn').addEventListener('click', async () => {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/';
                } catch (error) {
                    console.error('Logout error:', error);
                    window.location.href = '/';
                }
            });

            document.getElementById('editProfileBtn').addEventListener('click', () => {
                document.getElementById('editName').value = currentUser.name;
                document.getElementById('editMessage').value = currentUser.message || '';
                document.getElementById('editModal').classList.remove('hidden');
            });

            document.getElementById('cancelEdit').addEventListener('click', () => {
                document.getElementById('editModal').classList.add('hidden');
            });

            document.getElementById('editForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const formData = new FormData(e.target);
                    const updateData = {
                        name: formData.get('name'),
                        message: formData.get('message')
                    };

                    const response = await axios.put('/api/users/me', updateData);
                    if (response.data.success) {
                        currentUser = response.data.data;
                        updateUI();
                        document.getElementById('editModal').classList.add('hidden');
                        showMessage('プロフィールを更新しました', 'success');
                    }
                } catch (error) {
                    showMessage(error.response?.data?.message || '更新に失敗しました', 'error');
                }
            });

            // 個別画像アップロード機能（グローバル関数として定義）
            window.uploadSingleImage = async function(imageNumber, inputElement) {
                const file = inputElement.files[0];
                if (!file) return;

                // ファイルタイプチェック
                if (!file.type.startsWith('image/')) {
                    showMessage('画像ファイルを選択してください', 'error');
                    inputElement.value = '';
                    return;
                }

                // ファイルサイズチェック（10MB制限）
                if (file.size > 10 * 1024 * 1024) {
                    showMessage('ファイルサイズが大きすぎます（10MB以下にしてください）', 'error');
                    inputElement.value = '';
                    return;
                }

                const formData = new FormData();
                formData.append(\`image_\${imageNumber}\`, file);

                try {
                    showMessage(\`画像\${imageNumber}をアップロード中...\`, 'info');
                    
                    const response = await axios.post('/api/images/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    
                    if (response.data.success) {
                        showMessage(\`画像\${imageNumber}をアップロードしました\`, 'success');
                        loadImages();
                    }
                } catch (error) {
                    showMessage(error.response?.data?.message || \`画像\${imageNumber}のアップロードに失敗しました\`, 'error');
                } finally {
                    inputElement.value = '';
                }
            }

            // 初期化
            checkAuth();
        </script>
    </body>
    </html>
  `)
})

export default app
