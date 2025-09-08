import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { CloudflareBindings } from './types'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { imageRoutes } from './routes/images'
import { adminRoutes } from './routes/admin'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// CORS設定
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/users', userRoutes)
app.route('/api/images', imageRoutes)
app.route('/api/admin', adminRoutes)

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
                    
                    <a href="/admin" class="block w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors text-center">
                        <i class="fas fa-shield-alt mr-2"></i>
                        管理者ページ
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

// 管理者ページ
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>管理者ページ</title>
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
                        <h1 class="text-3xl font-bold text-gray-800">
                            <i class="fas fa-shield-alt mr-2 text-red-600"></i>
                            管理者ダッシュボード
                        </h1>
                        <p class="text-gray-600 mt-1" id="adminMessage">読み込み中...</p>
                    </div>
                    <div class="flex space-x-3">
                        <a href="/dashboard" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-user mr-2"></i>
                            ユーザーページ
                        </a>
                        <button id="logoutBtn" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-sign-out-alt mr-2"></i>
                            ログアウト
                        </button>
                    </div>
                </div>
            </div>

            <!-- 統計情報 -->
            <div class="grid md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center">
                        <i class="fas fa-users text-3xl text-blue-600 mr-4"></i>
                        <div>
                            <p class="text-sm text-gray-600">総ユーザー数</p>
                            <p class="text-2xl font-bold text-gray-800" id="totalUsers">-</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center">
                        <i class="fas fa-images text-3xl text-purple-600 mr-4"></i>
                        <div>
                            <p class="text-sm text-gray-600">総画像数</p>
                            <p class="text-2xl font-bold text-gray-800" id="totalImages">-</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center">
                        <i class="fas fa-user-plus text-3xl text-green-600 mr-4"></i>
                        <div>
                            <p class="text-sm text-gray-600">今日の新規</p>
                            <p class="text-2xl font-bold text-gray-800" id="todayUsers">-</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow-md p-6">
                    <div class="flex items-center">
                        <i class="fas fa-upload text-3xl text-orange-600 mr-4"></i>
                        <div>
                            <p class="text-sm text-gray-600">今日のアップロード</p>
                            <p class="text-2xl font-bold text-gray-800" id="todayImages">-</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- タブナビゲーション -->
            <div class="bg-white rounded-lg shadow-md mb-6">
                <div class="border-b">
                    <nav class="flex">
                        <button id="usersTab" class="tab-button active px-6 py-4 border-b-2 border-blue-500 text-blue-600 font-medium">
                            <i class="fas fa-users mr-2"></i>
                            ユーザー管理
                        </button>
                        <button id="imagesTab" class="tab-button px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
                            <i class="fas fa-images mr-2"></i>
                            画像管理
                        </button>
                    </nav>
                </div>

                <!-- ユーザー管理タブ -->
                <div id="usersContent" class="tab-content p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-800">登録ユーザー一覧</h3>
                        <button id="refreshUsers" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-sync mr-2"></i>
                            更新
                        </button>
                    </div>
                    <div id="usersList" class="space-y-3">
                        <div class="text-center text-gray-500 py-8">
                            <i class="fas fa-spinner fa-spin text-2xl"></i>
                            <p class="mt-2">読み込み中...</p>
                        </div>
                    </div>
                </div>

                <!-- 画像管理タブ -->
                <div id="imagesContent" class="tab-content hidden p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-800">画像一覧</h3>
                        <button id="refreshImages" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-sync mr-2"></i>
                            更新
                        </button>
                    </div>
                    <div id="imagesList" class="space-y-3">
                        <div class="text-center text-gray-500 py-8">
                            <i class="fas fa-spinner fa-spin text-2xl"></i>
                            <p class="mt-2">読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ユーザー詳細モーダル -->
            <div id="userDetailModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">ユーザー詳細情報</h3>
                            <button id="closeUserDetail" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div id="userDetailContent">
                            <!-- ユーザー詳細内容が動的に挿入される -->
                        </div>
                    </div>
                </div>
            </div>

            <div id="message" class="mt-4 hidden"></div>
        </div>

        <script>
            let currentAdmin = null;
            let allUsers = [];
            let allImages = [];

            // 管理者認証チェック
            async function checkAdminAuth() {
                try {
                    const response = await axios.get('/api/users/me');
                    if (response.data.success) {
                        currentAdmin = response.data.data;
                        // 管理者メールチェック
                        const adminEmails = ['admin@webapp.com', 'manager@webapp.com'];
                        if (!adminEmails.includes(currentAdmin.email)) {
                            showMessage('管理者権限がありません', 'error');
                            setTimeout(() => window.location.href = '/dashboard', 2000);
                            return;
                        }
                        updateAdminUI();
                        loadStats();
                        loadUsers();
                    } else {
                        window.location.href = '/login';
                    }
                } catch (error) {
                    window.location.href = '/login';
                }
            }

            // 管理者UI更新
            function updateAdminUI() {
                document.getElementById('adminMessage').textContent = \`管理者: \${currentAdmin.name}さん\`;
            }

            // 統計情報読み込み
            async function loadStats() {
                try {
                    const response = await axios.get('/api/admin/stats');
                    if (response.data.success) {
                        const stats = response.data.data;
                        document.getElementById('totalUsers').textContent = stats.totalUsers;
                        document.getElementById('totalImages').textContent = stats.totalImages;
                        document.getElementById('todayUsers').textContent = stats.todayNewUsers;
                        document.getElementById('todayImages').textContent = stats.todayNewImages;
                    }
                } catch (error) {
                    console.error('Stats error:', error);
                }
            }

            // ユーザー一覧読み込み
            async function loadUsers() {
                try {
                    const response = await axios.get('/api/admin/users');
                    if (response.data.success) {
                        allUsers = response.data.data;
                        displayUsers();
                    }
                } catch (error) {
                    showMessage('ユーザー情報の読み込みに失敗しました', 'error');
                }
            }

            // ユーザー一覧表示
            function displayUsers() {
                const usersDiv = document.getElementById('usersList');
                
                if (allUsers.length === 0) {
                    usersDiv.innerHTML = \`
                        <div class="text-center text-gray-500 py-8">
                            <i class="fas fa-users text-4xl mb-2"></i>
                            <p>ユーザーが登録されていません</p>
                        </div>
                    \`;
                    return;
                }

                const userCards = allUsers.map(user => \`
                    <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onclick="showUserDetail(\${user.id})">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <div class="bg-blue-100 rounded-full p-2">
                                        <i class="fas fa-user text-blue-600"></i>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-800">\${user.name}</h4>
                                        <p class="text-sm text-gray-600">\${user.email}</p>
                                    </div>
                                </div>
                                <div class="grid md:grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <span class="text-gray-500">受注番号:</span>
                                        <span class="font-medium">\${user.order_number}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">登録日:</span>
                                        <span class="font-medium">\${new Date(user.created_at).toLocaleDateString('ja-JP')}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">メッセージ:</span>
                                        <span class="font-medium">\${user.message || 'なし'}</span>
                                    </div>
                                </div>
                            </div>
                            <button class="text-blue-600 hover:text-blue-700">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                \`).join('');

                usersDiv.innerHTML = userCards;
            }

            // ユーザー詳細表示
            async function showUserDetail(userId) {
                try {
                    const response = await axios.get(\`/api/admin/users/\${userId}\`);
                    if (response.data.success) {
                        const { user, images } = response.data.data;
                        
                        const imageCards = images.length > 0 
                            ? images.map(img => \`
                                <div class="border border-gray-200 rounded-lg p-3">
                                    <div class="flex items-center justify-between mb-2">
                                        <h5 class="font-medium">画像\${img.image_number}</h5>
                                        <div class="flex space-x-2">
                                            <a href="/api/images/\${img.image_number}?userId=\${user.id}" target="_blank" class="text-blue-600 hover:text-blue-700">
                                                <i class="fas fa-external-link-alt"></i>
                                            </a>
                                            <button onclick="copyImageUrl('/api/images/\${img.image_number}?userId=\${user.id}')" class="text-green-600 hover:text-green-700">
                                                <i class="fas fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="text-sm text-gray-600 space-y-1">
                                        <div>ファイル名: \${img.file_name}</div>
                                        <div>サイズ: \${(img.file_size / 1024 / 1024).toFixed(2)}MB</div>
                                        <div>アップロード日: \${new Date(img.created_at).toLocaleDateString('ja-JP')}</div>
                                        <div class="mt-2">
                                            <span class="text-gray-500">URL: </span>
                                            <code class="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                                                \${window.location.origin}/api/images/\${img.image_number}?userId=\${user.id}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            \`).join('')
                            : '<div class="text-center text-gray-500 py-4">画像がアップロードされていません</div>';

                        document.getElementById('userDetailContent').innerHTML = \`
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 class="text-lg font-semibold mb-4">ユーザー情報</h4>
                                    <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                                        <div><strong>名前:</strong> \${user.name}</div>
                                        <div><strong>受注番号:</strong> \${user.order_number}</div>
                                        <div><strong>メール:</strong> \${user.email}</div>
                                        <div><strong>メッセージ:</strong> \${user.message || 'なし'}</div>
                                        <div><strong>登録日:</strong> \${new Date(user.created_at).toLocaleDateString('ja-JP')}</div>
                                        <div><strong>最終更新:</strong> \${new Date(user.updated_at).toLocaleDateString('ja-JP')}</div>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="text-lg font-semibold mb-4">画像一覧 (\${images.length}枚)</h4>
                                    <div class="space-y-3 max-h-96 overflow-y-auto">
                                        \${imageCards}
                                    </div>
                                </div>
                            </div>
                        \`;
                        
                        document.getElementById('userDetailModal').classList.remove('hidden');
                    }
                } catch (error) {
                    showMessage('ユーザー詳細の読み込みに失敗しました', 'error');
                }
            }

            // URL をクリップボードにコピー
            function copyImageUrl(url) {
                const fullUrl = window.location.origin + url;
                navigator.clipboard.writeText(fullUrl).then(() => {
                    showMessage('URLをコピーしました', 'success');
                }).catch(() => {
                    showMessage('URLのコピーに失敗しました', 'error');
                });
            }

            // 画像一覧読み込み
            async function loadImages() {
                try {
                    const response = await axios.get('/api/admin/images');
                    if (response.data.success) {
                        allImages = response.data.data;
                        displayImages();
                    }
                } catch (error) {
                    showMessage('画像情報の読み込みに失敗しました', 'error');
                }
            }

            // 画像一覧表示
            function displayImages() {
                const imagesDiv = document.getElementById('imagesList');
                
                if (allImages.length === 0) {
                    imagesDiv.innerHTML = \`
                        <div class="text-center text-gray-500 py-8">
                            <i class="fas fa-images text-4xl mb-2"></i>
                            <p>画像がアップロードされていません</p>
                        </div>
                    \`;
                    return;
                }

                const imageCards = allImages.map(img => \`
                    <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-2">
                                    <div class="bg-purple-100 rounded-full p-2">
                                        <i class="fas fa-image text-purple-600"></i>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-800">画像\${img.image_number} - \${img.user_name}</h4>
                                        <p class="text-sm text-gray-600">\${img.user_email} (\${img.user_order_number})</p>
                                    </div>
                                </div>
                                <div class="grid md:grid-cols-4 gap-2 text-sm">
                                    <div>
                                        <span class="text-gray-500">ファイル名:</span>
                                        <span class="font-medium">\${img.file_name}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">サイズ:</span>
                                        <span class="font-medium">\${(img.file_size / 1024 / 1024).toFixed(2)}MB</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">アップロード:</span>
                                        <span class="font-medium">\${new Date(img.created_at).toLocaleDateString('ja-JP')}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-500">URL:</span>
                                        <code class="bg-gray-100 px-1 rounded text-xs">/api/images/\${img.image_number}?userId=\${img.user_id}</code>
                                    </div>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <a href="/api/images/\${img.image_number}?userId=\${img.user_id}" target="_blank" class="text-blue-600 hover:text-blue-700 p-1">
                                    <i class="fas fa-external-link-alt"></i>
                                </a>
                                <button onclick="copyImageUrl('/api/images/\${img.image_number}?userId=\${img.user_id}')" class="text-green-600 hover:text-green-700 p-1">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                \`).join('');

                imagesDiv.innerHTML = imageCards;
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
                }, 3000);
            }

            // タブ切り替え
            function switchTab(tabName) {
                // タブボタンの状態更新
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
                    btn.classList.add('border-transparent', 'text-gray-500');
                });
                
                // タブコンテンツの表示切替
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });

                if (tabName === 'users') {
                    document.getElementById('usersTab').classList.add('active', 'border-blue-500', 'text-blue-600');
                    document.getElementById('usersTab').classList.remove('border-transparent', 'text-gray-500');
                    document.getElementById('usersContent').classList.remove('hidden');
                } else if (tabName === 'images') {
                    document.getElementById('imagesTab').classList.add('active', 'border-blue-500', 'text-blue-600');
                    document.getElementById('imagesTab').classList.remove('border-transparent', 'text-gray-500');
                    document.getElementById('imagesContent').classList.remove('hidden');
                    if (allImages.length === 0) {
                        loadImages();
                    }
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

            document.getElementById('usersTab').addEventListener('click', () => switchTab('users'));
            document.getElementById('imagesTab').addEventListener('click', () => switchTab('images'));

            document.getElementById('refreshUsers').addEventListener('click', loadUsers);
            document.getElementById('refreshImages').addEventListener('click', loadImages);

            document.getElementById('closeUserDetail').addEventListener('click', () => {
                document.getElementById('userDetailModal').classList.add('hidden');
            });

            // ウィンドウ関数として公開
            window.showUserDetail = showUserDetail;
            window.copyImageUrl = copyImageUrl;

            // 初期化
            checkAdminAuth();
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
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-semibold text-gray-800">
                            <i class="fas fa-user mr-2 text-green-600"></i>
                            プロフィール
                        </h2>
                        <button id="editToggleBtn" class="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm hidden">
                            <i class="fas fa-edit mr-1"></i>
                            編集
                        </button>
                    </div>
                    
                    <!-- 表示モード -->
                    <div id="profileView" class="space-y-3">
                        <div class="text-center text-gray-500">
                            <i class="fas fa-spinner fa-spin text-2xl"></i>
                            <p class="mt-2">読み込み中...</p>
                        </div>
                    </div>
                    
                    <!-- 編集モード -->
                    <div id="profileEdit" class="space-y-4 hidden">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">名前</label>
                            <input type="text" id="editName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">メッセージ</label>
                            <textarea id="editMessage" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="メッセージを入力してください"></textarea>
                        </div>
                        <div class="flex space-x-3">
                            <button id="saveProfileBtn" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                                <i class="fas fa-save mr-2"></i>
                                保存
                            </button>
                            <button id="cancelEditBtn" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center">
                                <i class="fas fa-times mr-2"></i>
                                キャンセル
                            </button>
                        </div>
                        
                        <!-- 保存ステータス表示 -->
                        <div id="saveStatus" class="hidden">
                            <div class="flex items-center text-sm">
                                <i id="saveIcon" class="mr-2"></i>
                                <span id="saveText"></span>
                            </div>
                        </div>
                    </div>
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
                const profileViewDiv = document.getElementById('profileView');
                profileViewDiv.innerHTML = \`
                    <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                        <div><strong>名前:</strong> \${currentUser.name}</div>
                        <div><strong>受注番号:</strong> \${currentUser.order_number}</div>
                        <div><strong>メールアドレス:</strong> \${currentUser.email}</div>
                        <div><strong>メッセージ:</strong> \${currentUser.message || 'メッセージが設定されていません'}</div>
                        <div><strong>登録日:</strong> \${new Date(currentUser.created_at).toLocaleDateString('ja-JP')}</div>
                    </div>
                \`;
                
                // 編集フォームに現在の値を設定
                document.getElementById('editName').value = currentUser.name;
                document.getElementById('editMessage').value = currentUser.message || '';
                
                document.getElementById('editToggleBtn').classList.remove('hidden');
                setupAutoSave();
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

            // インライン編集機能
            document.getElementById('editToggleBtn').addEventListener('click', () => {
                toggleEditMode(true);
            });

            document.getElementById('cancelEditBtn').addEventListener('click', () => {
                // 元の値に戻す
                document.getElementById('editName').value = currentUser.name;
                document.getElementById('editMessage').value = currentUser.message || '';
                toggleEditMode(false);
            });

            document.getElementById('saveProfileBtn').addEventListener('click', async () => {
                await saveProfile();
            });

            // 編集モード切り替え
            function toggleEditMode(isEditing) {
                const profileView = document.getElementById('profileView');
                const profileEdit = document.getElementById('profileEdit');
                const toggleBtn = document.getElementById('editToggleBtn');

                if (isEditing) {
                    profileView.classList.add('hidden');
                    profileEdit.classList.remove('hidden');
                    toggleBtn.classList.add('hidden');
                } else {
                    profileView.classList.remove('hidden');
                    profileEdit.classList.add('hidden');
                    toggleBtn.classList.remove('hidden');
                }
            }

            // プロフィール保存機能
            async function saveProfile() {
                const name = document.getElementById('editName').value.trim();
                const message = document.getElementById('editMessage').value.trim();

                if (!name) {
                    showMessage('名前を入力してください', 'error');
                    return;
                }

                // 保存ステータス表示
                showSaveStatus('saving');

                try {
                    const updateData = { name, message };
                    const response = await axios.put('/api/users/me', updateData);
                    
                    if (response.data.success) {
                        currentUser = response.data.data;
                        updateUI();
                        toggleEditMode(false);
                        showSaveStatus('success');
                        showMessage('プロフィールを保存しました', 'success');
                    } else {
                        showSaveStatus('error');
                        showMessage('保存に失敗しました', 'error');
                    }
                } catch (error) {
                    showSaveStatus('error');
                    showMessage(error.response?.data?.message || '保存に失敗しました', 'error');
                }
            }

            // 保存ステータス表示
            function showSaveStatus(status) {
                const statusDiv = document.getElementById('saveStatus');
                const saveIcon = document.getElementById('saveIcon');
                const saveText = document.getElementById('saveText');

                statusDiv.classList.remove('hidden');

                switch (status) {
                    case 'saving':
                        saveIcon.className = 'fas fa-spinner fa-spin text-blue-600';
                        saveText.textContent = '保存中...';
                        saveText.className = 'text-blue-600';
                        break;
                    case 'success':
                        saveIcon.className = 'fas fa-check-circle text-green-600';
                        saveText.textContent = '保存完了';
                        saveText.className = 'text-green-600';
                        setTimeout(() => statusDiv.classList.add('hidden'), 3000);
                        break;
                    case 'error':
                        saveIcon.className = 'fas fa-exclamation-circle text-red-600';
                        saveText.textContent = '保存失敗';
                        saveText.className = 'text-red-600';
                        setTimeout(() => statusDiv.classList.add('hidden'), 3000);
                        break;
                    case 'changed':
                        saveIcon.className = 'fas fa-edit text-orange-600';
                        saveText.textContent = '未保存の変更があります';
                        saveText.className = 'text-orange-600';
                        break;
                }
            }

            // 自動保存機能（入力変更検知）
            let autoSaveTimeout = null;
            let hasUnsavedChanges = false;

            function setupAutoSave() {
                const nameInput = document.getElementById('editName');
                const messageInput = document.getElementById('editMessage');

                function handleInputChange() {
                    hasUnsavedChanges = true;
                    showSaveStatus('changed');

                    // 既存のタイマーをクリア
                    if (autoSaveTimeout) {
                        clearTimeout(autoSaveTimeout);
                    }

                    // 3秒後に自動保存
                    autoSaveTimeout = setTimeout(async () => {
                        if (hasUnsavedChanges) {
                            await autoSaveProfile();
                        }
                    }, 3000);
                }

                nameInput.addEventListener('input', handleInputChange);
                messageInput.addEventListener('input', handleInputChange);
            }

            // 自動保存実行
            async function autoSaveProfile() {
                const name = document.getElementById('editName').value.trim();
                const message = document.getElementById('editMessage').value.trim();

                if (!name) {
                    return; // 名前が空の場合は保存しない
                }

                // 変更がない場合はスキップ
                if (name === currentUser.name && message === (currentUser.message || '')) {
                    hasUnsavedChanges = false;
                    document.getElementById('saveStatus').classList.add('hidden');
                    return;
                }

                showSaveStatus('saving');

                try {
                    const updateData = { name, message };
                    const response = await axios.put('/api/users/me', updateData);
                    
                    if (response.data.success) {
                        currentUser = response.data.data;
                        hasUnsavedChanges = false;
                        showSaveStatus('success');
                        
                        // プロフィール表示も更新（編集モード中でも）
                        const profileViewDiv = document.getElementById('profileView');
                        profileViewDiv.innerHTML = \`
                            <div class="space-y-3 bg-gray-50 p-4 rounded-lg">
                                <div><strong>名前:</strong> \${currentUser.name}</div>
                                <div><strong>受注番号:</strong> \${currentUser.order_number}</div>
                                <div><strong>メールアドレス:</strong> \${currentUser.email}</div>
                                <div><strong>メッセージ:</strong> \${currentUser.message || 'メッセージが設定されていません'}</div>
                                <div><strong>登録日:</strong> \${new Date(currentUser.created_at).toLocaleDateString('ja-JP')}</div>
                            </div>
                        \`;
                    } else {
                        showSaveStatus('error');
                    }
                } catch (error) {
                    showSaveStatus('error');
                    console.error('Auto-save error:', error);
                }
            }

            // キーボードショートカット（Ctrl+S で保存）
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    if (!document.getElementById('profileEdit').classList.contains('hidden')) {
                        saveProfile();
                    }
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
