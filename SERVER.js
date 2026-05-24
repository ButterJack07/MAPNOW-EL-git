// 文件开头大约第1-10行
const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

// ⭐ 修复：添加缺失的 https 依赖
const https = require("https");

// ⭐ 注意：SSL配置是可选的，如果不需要HTTPS可以注释掉
// 如果你确实需要SSL，确保服务器上有这些文件
// const SSL_CONFIG = {
//     cert: fs.readFileSync('./server.crt'),
//     key: fs.readFileSync('./server.key')
// };


// ==================== 数据库初始化 ====================
const DB_FILE = path.join(__dirname, "users.db");
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("❌ 数据库连接失败:", err);
  } else {
    console.log("✅ 数据库连接成功:", DB_FILE);
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  const schema = `
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '👤',
      created_at INTEGER NOT NULL,
      last_login INTEGER,
      gender TEXT DEFAULT '保密',
      birthday TEXT,
      region TEXT DEFAULT '未设置',
      bio TEXT DEFAULT '',
      background TEXT DEFAULT '#667eea',
      theme TEXT DEFAULT 'light',
      verified INTEGER DEFAULT 0,
      merchant_verified INTEGER DEFAULT 0,
      is_vip INTEGER DEFAULT 0,
      vip_expire_time INTEGER DEFAULT 0,
      vip_type TEXT DEFAULT 'none'
    );
    
    CREATE INDEX IF NOT EXISTS idx_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_id ON users(id);
    
    -- 气泡表
    CREATE TABLE IF NOT EXISTS bubbles (
      id TEXT PRIMARY KEY,
      author TEXT NOT NULL,
      author_id TEXT NOT NULL,
      avatar TEXT DEFAULT '👤',
      type TEXT NOT NULL,
      room_code TEXT,
      title TEXT NOT NULL,
      content TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      activity_tags TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      duration_minutes INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_bubbles_author_id ON bubbles(author_id);
    CREATE INDEX IF NOT EXISTS idx_bubbles_type ON bubbles(type);
    CREATE INDEX IF NOT EXISTS idx_bubbles_expires_at ON bubbles(expires_at);
    CREATE INDEX IF NOT EXISTS idx_bubbles_is_active ON bubbles(is_active);
    CREATE INDEX IF NOT EXISTS idx_bubbles_location ON bubbles(lat, lng);
    
    -- ⭐ 新增：用户统计表
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY,
      published_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      favorites_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      status_text TEXT DEFAULT '正在路上',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    -- ⭐ 新增：气泡点赞表
    CREATE TABLE IF NOT EXISTS bubble_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bubble_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (bubble_id) REFERENCES bubbles(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(bubble_id, user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_bubble_likes_bubble_id ON bubble_likes(bubble_id);
    CREATE INDEX IF NOT EXISTS idx_bubble_likes_user_id ON bubble_likes(user_id);
    
    -- ⭐ 新增：气泡收藏表
    CREATE TABLE IF NOT EXISTS bubble_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bubble_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (bubble_id) REFERENCES bubbles(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(bubble_id, user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_bubble_favorites_bubble_id ON bubble_favorites(bubble_id);
    CREATE INDEX IF NOT EXISTS idx_bubble_favorites_user_id ON bubble_favorites(user_id);
    
    -- ⭐ 新增：气泡评论表
    CREATE TABLE IF NOT EXISTS bubble_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bubble_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (bubble_id) REFERENCES bubbles(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_bubble_comments_bubble_id ON bubble_comments(bubble_id);
    CREATE INDEX IF NOT EXISTS idx_bubble_comments_user_id ON bubble_comments(user_id);
    
    -- ⭐ 新增：浏览记录表
    CREATE TABLE IF NOT EXISTS bubble_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bubble_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      viewed_at INTEGER NOT NULL,
      FOREIGN KEY (bubble_id) REFERENCES bubbles(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_bubble_views_bubble_id ON bubble_views(bubble_id);
    CREATE INDEX IF NOT EXISTS idx_bubble_views_user_id ON bubble_views(user_id);
    CREATE INDEX IF NOT EXISTS idx_bubble_views_viewed_at ON bubble_views(viewed_at);
    
    -- ⭐ 新增：通知表
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      bubble_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      from_user_name TEXT NOT NULL,
      from_user_avatar TEXT DEFAULT '👤',
      content TEXT,
      is_read INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (bubble_id) REFERENCES bubbles(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
    
    -- ⭐ v9.4.0: 私聊消息表
    CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      is_read INTEGER DEFAULT 0
    );
    
    CREATE INDEX IF NOT EXISTS idx_private_messages_from_user ON private_messages(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_private_messages_to_user ON private_messages(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at);
  `;
  
  db.exec(schema, (err) => {
    if (err) {
      console.error("❌ 数据库初始化失败:", err);
    } else {
      console.log("✅ 数据库表初始化成功（用户表+气泡表+统计表+互动表）");
      
      // 插入测试用户
      db.run(`INSERT OR IGNORE INTO users (id, phone, username, password, avatar, created_at) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        ['testuser', '13800138000', '测试用户', '123456', '😊', Date.now()],
        (err) => {
          if (err) {
            console.log("测试用户已存在");
          } else {
            console.log("✅ 已创建测试用户: testuser / 13800138000 / 密码:123456");
          }
        }
      );
      
      // ⭐ 数据库迁移：添加theme字段（如果不存在）
      db.run(`ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light'`, (err) => {
        if (err) {
          // 字段已存在，忽略错误
          console.log("theme字段已存在");
        } else {
          console.log("✅ 已添加theme字段");
        }
      });
      
      // ⭐ 数据库迁移：添加images字段（如果不存在）
      db.run(`ALTER TABLE bubbles ADD COLUMN images TEXT`, (err) => {
        if (err) {
          // 字段已存在，忽略错误
          console.log("images字段已存在");
        } else {
          console.log("✅ 已添加images字段");
        }
      });
      
      // 启动气泡过期清理任务
      startBubbleCleanupTask();
    }
  });
}

// ==================== 气泡数据库操作函数 ====================

// 保存气泡到数据库
function saveBubble(bubble, callback) {
  // 先尝试使用新格式（包含images）
  const sqlWithImages = `INSERT INTO bubbles 
    (id, author, author_id, avatar, type, room_code, title, content, lat, lng, activity_tags, images, created_at, expires_at, duration_minutes, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const sqlOld = `INSERT INTO bubbles 
    (id, author, author_id, avatar, type, room_code, title, content, lat, lng, activity_tags, created_at, expires_at, duration_minutes, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  // 准备数据
  const paramsWithImages = [
    bubble.id,
    bubble.author,
    bubble.authorId,
    bubble.avatar,
    bubble.type,
    bubble.roomCode,
    bubble.title,
    bubble.content,
    bubble.lat,
    bubble.lng,
    JSON.stringify(bubble.activityTags),
    JSON.stringify(bubble.images || []), // ⭐ 新增：保存图片数组
    bubble.createdAt,
    bubble.expiresAt,
    bubble.durationMinutes,
    1
  ];
  
  const paramsOld = [
    bubble.id,
    bubble.author,
    bubble.authorId,
    bubble.avatar,
    bubble.type,
    bubble.roomCode,
    bubble.title,
    bubble.content,
    bubble.lat,
    bubble.lng,
    JSON.stringify(bubble.activityTags),
    bubble.createdAt,
    bubble.expiresAt,
    bubble.durationMinutes,
    1
  ];
  
  // 先尝试新格式
  db.run(sqlWithImages, paramsWithImages, function(err) {
    if (err && err.message && err.message.includes('no column named images')) {
      // 如果images字段不存在，使用旧格式
      db.run(sqlOld, paramsOld, function(err2) {
        if (err2) {
          console.error("❌ 保存气泡失败:", err2);
          if (callback) callback(false);
        } else {
          console.log(`✅ 气泡已保存到数据库: ${bubble.id} (旧格式)`);
          if (callback) callback(true);
        }
      });
    } else if (err) {
      console.error("❌ 保存气泡失败:", err);
      if (callback) callback(false);
    } else {
      console.log(`✅ 气泡已保存到数据库: ${bubble.id}`);
      if (callback) callback(true);
    }
  });
}

// 查询活跃气泡（附近）
function queryActiveBubbles(lat, lng, radius, callback) {
  const now = Date.now();
  const sql = `SELECT * FROM bubbles WHERE is_active = 1 AND expires_at > ? ORDER BY created_at DESC`;
  
  db.all(sql, [now], (err, rows) => {
    if (err) {
      console.error("❌ 查询气泡失败:", err);
      return callback([]);
    }
    
    // 过滤距离并计算
    const results = rows
      .map(row => {
        const dist = calculateDistance(lat, lng, row.lat, row.lng);
        if (dist <= radius) {
          return {
            id: row.id,
            author: row.author,
            authorId: row.author_id,
            avatar: row.avatar,
            type: row.type,
            roomCode: row.room_code,
            title: row.title,
            content: row.content,
            lat: row.lat,
            lng: row.lng,
            activityTags: JSON.parse(row.activity_tags || '[]'),
            images: row.images ? JSON.parse(row.images) : [], // ⭐ 安全解析图片数组
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            durationMinutes: row.duration_minutes,
            distance: Math.round(dist)
          };
        }
        return null;
      })
      .filter(b => b !== null)
      .sort((a, b) => a.distance - b.distance);
    
    callback(results);
  });
}

// 获取所有活跃气泡（用于监控页面）
function getAllActiveBubbles(callback) {
  const now = Date.now();
  const sql = `SELECT * FROM bubbles WHERE is_active = 1 AND expires_at > ? ORDER BY created_at DESC`;
  
  db.all(sql, [now], (err, rows) => {
    if (err) {
      console.error("❌ 查询所有气泡失败:", err);
      return callback([]);
    }
    
    const results = rows.map(row => ({
      id: row.id,
      author: row.author,
      authorId: row.author_id,
      avatar: row.avatar,
      type: row.type,
      roomCode: row.room_code,
      title: row.title,
      content: row.content,
      lat: row.lat,
      lng: row.lng,
      activityTags: JSON.parse(row.activity_tags || '[]'),
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      durationMinutes: row.duration_minutes
    }));
    
    callback(results);
  });
}

// 获取气泡总数
function getBubbleCount(callback) {
  db.get(`SELECT COUNT(*) as count FROM bubbles WHERE is_active = 1`, (err, row) => {
    if (err) {
      console.error("❌ 统计气泡失败:", err);
      callback(0);
    } else {
      callback(row.count);
    }
  });
}

// 清理过期气泡（定期任务）
function cleanupExpiredBubbles() {
  const now = Date.now();
  db.run(`UPDATE bubbles SET is_active = 0 WHERE expires_at <= ? AND is_active = 1`, [now], function(err) {
    if (err) {
      console.error("❌ 清理过期气泡失败:", err);
    } else if (this.changes > 0) {
      console.log(`🧹 已清理 ${this.changes} 个过期气泡`);
    }
  });
}

// 启动气泡清理任务（每分钟检查一次）
function startBubbleCleanupTask() {
  setInterval(() => {
    cleanupExpiredBubbles();
  }, 60000); // 每60秒检查一次
  console.log("✅ 气泡过期清理任务已启动（每分钟检查）");
}

// 清除所有气泡
function clearAllBubblesDB(callback) {
  db.run(`UPDATE bubbles SET is_active = 0 WHERE is_active = 1`, function(err) {
    if (err) {
      console.error("❌ 清除所有气泡失败:", err);
      callback(false, 0);
    } else {
      console.log(`🧹 已清除所有气泡，共 ${this.changes} 个`);
      callback(true, this.changes);
    }
  });
}

// ==================== 用户认证函数 ====================

// 注册新用户
function registerUser(data, callback) {
  const { id, phone, username, password } = data;
  
  // 验证手机号格式（11位数字）
  if (!/^1\d{10}$/.test(phone)) {
    return callback({ success: false, message: "手机号格式错误，需要11位数字" });
  }
  
  // 验证ID格式（不能为空，长度3-20）
  if (!id || id.length < 3 || id.length > 20) {
    return callback({ success: false, message: "ID长度应为3-20个字符" });
  }
  
  // 验证密码（至少6位）
  if (!password || password.length < 6) {
    return callback({ success: false, message: "密码至少需要6位" });
  }
  
  // ⭐ 验证用户名长度（1-20字符）
  if (username && username.length > 20) {
    return callback({ success: false, message: "用户名不能超过20个字符" });
  }
  
  // 检查ID是否已存在
  db.get("SELECT id FROM users WHERE id = ?", [id], (err, row) => {
    if (err) {
      return callback({ success: false, message: "数据库查询错误" });
    }
    
    if (row) {
      return callback({ success: false, message: "该ID已被使用" });
    }
    
    // 检查手机号是否已存在
    db.get("SELECT phone FROM users WHERE phone = ?", [phone], (err, row) => {
      if (err) {
        return callback({ success: false, message: "数据库查询错误" });
      }
      
      if (row) {
        return callback({ success: false, message: "该手机号已被注册" });
      }
      
      // 创建新用户
      const finalUsername = username || id; // 默认用户名为ID
      const avatar = '👤';
      const createdAt = Date.now();
      
      db.run(
        `INSERT INTO users (id, phone, username, password, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, phone, finalUsername, password, avatar, createdAt],
        function(err) {
          if (err) {
            return callback({ success: false, message: "注册失败：" + err.message });
          }
          
          console.log(`\n✅ 新用户注册成功: ${id} / ${phone} / ${finalUsername}`);
          callback({
            success: true,
            message: "注册成功！",
            user: {
              id: id,
              phone: phone,
              username: finalUsername,
              avatar: avatar
            }
          });
        }
      );
    });
  });
}

// 用户登录
// 用户登录
function loginUser(data, callback) {
  const { loginId, password } = data;
  
  // 判断loginId是手机号还是ID
  const isPhone = /^1\d{10}$/.test(loginId);
  const query = isPhone 
    ? "SELECT * FROM users WHERE phone = ?" 
    : "SELECT * FROM users WHERE id = ?";
  
  db.get(query, [loginId], (err, user) => {
    if (err) {
      return callback({ success: false, message: "数据库查询错误" });
    }
    
    if (!user) {
      return callback({ success: false, message: "用户不存在" });
    }
    
    if (user.password !== password) {
      return callback({ success: false, message: "密码错误" });
    }
    
    // 更新最后登录时间
    db.run("UPDATE users SET last_login = ? WHERE id = ?", [Date.now(), user.id]);
    
    console.log(`\n✅ 用户登录成功: ${user.username} (ID: ${user.id})`);
    callback({
      success: true,
      message: "登录成功！",
      user: {
        userId: user.id,           // 前端需要 userId
        id: user.id,                // 保留 id 字段兼容
        phone: user.phone,
        username: user.username,    // 前端需要 username
        nickname: user.username,    // 保留 nickname 字段兼容
        avatar: user.avatar || '👤',
        gender: user.gender || '保密',
        birthday: user.birthday || '',
        region: user.region || '未设置',
        bio: user.bio || '',
        background: user.background || '#667eea',
        verified: user.verified || 0,
        merchant_verified: user.merchant_verified || 0,
        isVip: user.is_vip ? true : false,
        vipExpireTime: user.vip_expire_time || 0,
        vipType: user.vip_type || 'none',
        theme: user.theme || 'light',
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  });
}

// ==================== 简单的内存存储 ====================
const bubbles = new Map(); // 所有气泡
const onlineUsers = new Map(); // 在线用户
const socketUser = new Map(); // WebSocket -> User
const userSocket = new Map(); // UserID -> WebSocket

// 统计
let stats = {
  totalPublished: 0,
  totalQueried: 0,
  totalMessages: 0,
  lastCleared: null,
  clearedBy: null
};

// 管理员密码（可以修改）
const ADMIN_PASSWORD = "admin123"; // ⭐ 添加管理员密码

// 备份文件路径
const BACKUP_FILE = path.join(__dirname, "bubbles_backup.json");

// ==================== 启动时加载备份 ====================
function loadBackup() {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
      data.forEach(bubble => {
        if (bubble.expiresAt > Date.now()) {
          bubbles.set(bubble.id, bubble);
        }
      });
      console.log(`✅ 从备份恢复了 ${bubbles.size} 个气泡`);
    }
  } catch (error) {
    console.error("备份加载失败:", error);
  }
}


// 编辑地区（数据库版）
let currentProvinceId = null;
let selectedProvince = '';
let selectedCity = '';

function editRegion() {
    const currentRegion = currentUser.region || '';
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 20px;
            padding: 25px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
        ">
            <h3 style="color: #052659; margin-bottom: 20px; font-size: 18px;">选择地区</h3>
            
            <!-- 当前选择显示 -->
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f7ff; border-radius: 8px;">
                <div style="color: #666; font-size: 12px; margin-bottom: 5px;">当前选择</div>
                <div style="font-weight: 600; color: #052659;" id="selectedRegion">${escapeHtml(currentRegion) || '未选择'}</div>
            </div>
            
            <!-- 搜索框 -->
            <input type="text" id="regionSearchInput" 
                   placeholder="搜索省份或城市..." 
                   style="
                       width: 100%;
                       padding: 12px 15px;
                       border: 2px solid #e0e0e0;
                       border-radius: 10px;
                       font-size: 14px;
                       margin-bottom: 15px;
                       outline: none;
                   "
                   onfocus="this.style.borderColor='#667eea'"
                   onblur="this.style.borderColor='#e0e0e0'"
                   oninput="searchRegion(this.value)">
            
            <!-- 省份列表 -->
            <div id="provinceList" style="margin-bottom: 15px;">
                <div style="color: #666; font-size: 12px; margin-bottom: 8px;">选择省份</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;" id="provinceContainer">
                    <div style="grid-column: span 2; text-align: center; padding: 20px; color: #999;">加载中...</div>
                </div>
            </div>
            
            <!-- 城市列表（初始隐藏） -->
            <div id="cityList" style="display: none; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <button onclick="backToProvinceList()" 
                            style="
                                padding: 5px 10px;
                                background: none;
                                border: none;
                                color: #667eea;
                                cursor: pointer;
                                font-size: 14px;
                            ">
                        ← 返回省份列表
                    </button>
                </div>
                <div style="color: #666; font-size: 12px; margin-bottom: 8px;" id="selectedProvinceName"></div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;" id="cityContainer"></div>
            </div>
            
            <!-- 搜索结果列表（初始隐藏） -->
            <div id="searchResultList" style="display: none; margin-bottom: 15px; max-height: 300px; overflow-y: auto;"></div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="this.closest('div').parentElement.remove()" 
                        style="
                            flex: 1;
                            padding: 12px;
                            background: #f0f0f0;
                            border: none;
                            border-radius: 10px;
                            color: #666;
                            font-weight: 600;
                            cursor: pointer;
                        ">取消</button>
                <button onclick="saveRegionFromPicker(this)" 
                        style="
                            flex: 1;
                            padding: 12px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            border: none;
                            border-radius: 10px;
                            color: white;
                            font-weight: 600;
                            cursor: pointer;
                        ">保存</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 加载省份列表
    loadProvinces();
}

// 加载省份列表
function loadProvinces() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        showNetworkStatus('网络未连接', 2000);
        return;
    }
    
    socket.send(JSON.stringify({
        type: "getProvinces"
    }));
}

// 接收省份列表
function handleProvincesResult(provinces) {
    const container = document.getElementById('provinceContainer');
    if (!container) return;
    
    if (provinces.length === 0) {
        container.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 20px; color: #999;">暂无数据</div>';
        return;
    }
    
    container.innerHTML = provinces.map(province => `
        <div onclick="selectProvince(${province.id}, '${province.name}')" 
             style="
                padding: 10px;
                background: #f8f9fa;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
             "
             onmouseover="this.style.background='#e9ecef';this.style.borderColor='#667eea';"
             onmouseout="this.style.background='#f8f9fa';this.style.borderColor='#e0e0e0';">
            ${province.name}
        </div>
    `).join('');
}

// 选择省份
function selectProvince(provinceId, provinceName) {
    currentProvinceId = provinceId;
    selectedProvince = provinceName;
    
    document.getElementById('provinceList').style.display = 'none';
    document.getElementById('cityList').style.display = 'block';
    document.getElementById('searchResultList').style.display = 'none';
    document.getElementById('regionSearchInput').value = '';
    
    document.getElementById('selectedProvinceName').innerHTML = `<span style="font-weight: 600; color: #052659;">${provinceName}</span>`;
    
    const cityContainer = document.getElementById('cityContainer');
    cityContainer.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 20px; color: #999;">加载中...</div>';
    
    // 请求城市列表
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "getCitiesByProvince",
            provinceId: provinceId
        }));
    }
}

// 接收城市列表
function handleCitiesResult(provinceId, cities) {
    const cityContainer = document.getElementById('cityContainer');
    if (!cityContainer) return;
    
    if (cities.length === 0) {
        cityContainer.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 20px; color: #999;">暂无城市</div>';
        return;
    }
    
    cityContainer.innerHTML = cities.map(city => `
        <div onclick="selectCity('${city.name}')" 
             class="city-item"
             data-city="${city.name}"
             style="
                padding: 10px;
                background: #f8f9fa;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
             "
             onmouseover="this.style.background='#e9ecef';this.style.borderColor='#667eea';"
             onmouseout="this.style.background='#f8f9fa';this.style.borderColor='#e0e0e0';">
            ${city.name}
        </div>
    `).join('');
}

// 选择城市
function selectCity(cityName) {
    selectedCity = cityName;
    
    // 高亮选中的城市
    document.querySelectorAll('.city-item').forEach(item => {
        if (item.getAttribute('data-city') === cityName) {
            item.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            item.style.color = 'white';
            item.style.borderColor = '#667eea';
        } else {
            item.style.background = '#f8f9fa';
            item.style.color = '#333';
            item.style.borderColor = '#e0e0e0';
        }
    });
    
    // 保存选择的地区
    const fullRegion = `${selectedProvince} ${cityName}`;
    window.selectedRegion = fullRegion;
    document.getElementById('selectedRegion').textContent = fullRegion;
}

// 返回省份列表
function backToProvinceList() {
    document.getElementById('provinceList').style.display = 'block';
    document.getElementById('cityList').style.display = 'none';
    document.getElementById('searchResultList').style.display = 'none';
    document.getElementById('regionSearchInput').value = '';
    selectedCity = '';
}

// 搜索地区
let searchTimeout = null;
function searchRegion(keyword) {
    clearTimeout(searchTimeout);
    
    if (!keyword.trim()) {
        document.getElementById('provinceList').style.display = 'block';
        document.getElementById('cityList').style.display = 'none';
        document.getElementById('searchResultList').style.display = 'none';
        return;
    }
    
    searchTimeout = setTimeout(() => {
        document.getElementById('provinceList').style.display = 'none';
        document.getElementById('cityList').style.display = 'none';
        document.getElementById('searchResultList').style.display = 'block';
        
        const resultContainer = document.getElementById('searchResultList');
        resultContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">搜索中...</div>';
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "searchCities",
                keyword: keyword
            }));
        }
    }, 300);
}

// 接收搜索结果
function handleSearchResults(results) {
    const resultContainer = document.getElementById('searchResultList');
    if (!resultContainer) return;
    
    if (results.length === 0) {
        resultContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">未找到相关地区</div>';
        return;
    }
    
    resultContainer.innerHTML = results.map(item => `
        <div onclick="selectSearchResult('${item.province_name}', '${item.name}')" 
             style="
                padding: 12px;
                margin-bottom: 5px;
                background: #f8f9fa;
                border-radius: 8px;
                cursor: pointer;
             "
             onmouseover="this.style.background='#e9ecef'"
             onmouseout="this.style.background='#f8f9fa'">
            <div style="font-weight: 600;">${item.name}</div>
            <div style="font-size: 11px; color: #999;">${item.province_name}</div>
        </div>
    `).join('');
}

// 选择搜索结果
function selectSearchResult(provinceName, cityName) {
    selectedProvince = provinceName;
    selectedCity = cityName;
    
    const fullRegion = `${provinceName} ${cityName}`;
    window.selectedRegion = fullRegion;
    document.getElementById('selectedRegion').textContent = fullRegion;
    
    // 清空搜索，返回省份列表
    document.getElementById('regionSearchInput').value = '';
    document.getElementById('provinceList').style.display = 'block';
    document.getElementById('cityList').style.display = 'none';
    document.getElementById('searchResultList').style.display = 'none';
}

// 保存地区（从选择器）
function saveRegionFromPicker(btn) {
    const modal = btn.closest('div').parentElement;
    const newRegion = window.selectedRegion || document.getElementById('selectedRegion').textContent;
    
    if (newRegion === '未选择' || newRegion === currentUser.region) {
        modal.remove();
        return;
    }
    
    updateUserInfo('region', newRegion);
    modal.remove();
    showNetworkStatus('地区已更新', 2000);
}





// ==================== 定期保存备份 ====================
function saveBackup() {
  try {
    const data = Array.from(bubbles.values());
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 已备份 ${data.length} 个气泡`);
  } catch (error) {
    console.error("备份保存失败:", error);
  }
}

// ==================== 工具函数 ====================
function genUserId() {
  return Math.random().toString(36).slice(2, 10);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function broadcast(data) {
    const msg = JSON.stringify(data);
    let successCount = 0;
    let failCount = 0;
    
    onlineUsers.forEach(({ ws }) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(msg);
                successCount++;
            } catch (error) {
                failCount++;
                console.error("❌ 广播失败:", error);
            }
        }
    });
    
    if (failCount > 0) {
        console.log(`📡 广播结果: ${successCount}成功, ${failCount}失败`);
    }
}

// ⭐⭐⭐ 新功能：清除所有气泡
function clearAllBubbles(initiator = "管理员") {
  // ⭐ 使用数据库版本清除气泡
  clearAllBubblesDB((success, clearedCount) => {
    if (success) {
      const userCount = onlineUsers.size;
      
      // 记录统计信息
      stats.lastCleared = new Date().toISOString();
      stats.clearedBy = initiator;
      
      // 广播清除通知给所有在线用户
      broadcast({
        type: "bubblesCleared",
        message: `所有气泡已被 ${initiator} 清除`,
        clearedCount: clearedCount,
        timestamp: Date.now()
      });
      
      console.log("\n" + "=".repeat(60));
      console.log("🗑️  气泡清除操作");
      console.log("=".repeat(60));
      console.log(`   执行者: ${initiator}`);
      console.log(`   清除数量: ${clearedCount} 个气泡`);
      console.log(`   在线用户: ${userCount} 人`);
      console.log(`   时间: ${new Date().toLocaleString('zh-CN')}`);
      console.log("=".repeat(60));
    } else {
      console.error("❌ 清除气泡失败");
    }
  });
  
  return {
    success: true,
    message: "清除操作已执行",
    timestamp: new Date().toISOString()
  };
}

// ==================== WebSocket 服务器 ====================
// ⭐ 创建 HTTP 服务器
const httpServerForWS = http.createServer();
const PRIMARY_DOMAIN = "mapnow.top";
const WS_PORT = 3000;

// ⭐ 添加更多 WebSocket 服务器选项以提高连接稳定性
const wss = new WebSocket.Server({ 
    server: httpServerForWS,
    // 允许 mapnow.top / localhost / 无 Origin（APP/脚本）
    verifyClient: (info, cb) => {
        try {
            const origin = info.origin || "";

            if (!origin) {
                cb(true);
                return;
            }

            const originHost = new URL(origin).hostname;
            const allowed =
                originHost === PRIMARY_DOMAIN ||
                originHost.endsWith(`.${PRIMARY_DOMAIN}`) ||
                originHost === "localhost" ||
                originHost === "127.0.0.1";

            if (!allowed) {
                console.log(`⛔ 拒绝非法Origin: ${origin}`);
            }

            cb(allowed, allowed ? 200 : 403, allowed ? "OK" : "Forbidden origin");
        } catch (error) {
            console.log(`⛔ Origin校验失败: ${info.origin || "unknown"}`);
            cb(false, 403, "Forbidden origin");
        }
    },
    // 禁用压缩以兼容更多客户端
    perMessageDeflate: false,
    // 客户端跟踪
    clientTracking: true,
    path: "/ws"
});

// ⭐ 添加错误处理
wss.on('error', (error) => {
    console.error("❌ WebSocket服务器错误:", error);
});

// ⭐ 添加心跳检测间隔
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            console.log("💔 连接超时，关闭连接");
            return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
    });
}, 30000); // 每30秒检测一次

wss.on('close', () => {
    clearInterval(heartbeatInterval);
});

// ⭐ 监听所有网络接口
httpServerForWS.listen(WS_PORT, "0.0.0.0", () => {
    console.log("\n" + "=".repeat(60));
    console.log("✅ WebSocket服务器启动成功");
    console.log("=".repeat(60));
    console.log(`   监听地址: 0.0.0.0:${WS_PORT}`);
    console.log(`   本地访问: ws://localhost:${WS_PORT}`);
    console.log(`   反向代理: wss://${PRIMARY_DOMAIN}/ws`);
    console.log(`   WS路径要求: /ws`);
    console.log(`   域名访问: https://${PRIMARY_DOMAIN}`);
    console.log("=".repeat(60) + "\n");
});

// ⭐ WebSocket 连接处理
wss.on("connection", (ws, req) => {
    // 设置心跳标志
    ws.isAlive = true;
    
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log("\n" + "=".repeat(60));
    console.log(`🔌 新连接: ${ip}`);
    console.log(`   当前连接数: ${wss.clients.size}`);
    console.log("=".repeat(60));

    // 发送连接成功消息
    try {
        ws.send(JSON.stringify({
            type: "connectionEstablished",
            message: "WebSocket连接成功",
            timestamp: Date.now(),
            serverTime: new Date().toISOString()
        }));
    } catch (error) {
        console.error("❌ 发送欢迎消息失败:", error);
    }

  

    ws.on("message", (msg) => {
        let data;
        try {
            data = JSON.parse(msg);
        } catch (error) {
            console.error("❌ 消息解析失败:", error);
            try {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "无效的JSON格式"
                }));
            } catch (e) {}
            return;
        }

        // 添加调试日志
        const user = socketUser.get(ws);
        console.log(`\n📨 收到消息 [类型: ${data.type}] 来自: ${user?.nickname || '未登录用户'}`);

        // Ping-Pong
        if (data.type === "ping") {
            try {
                ws.send(JSON.stringify({ 
                    type: "pong", 
                    timestamp: Date.now() 
                }));
            } catch (error) {
                console.error("❌ 发送pong失败:", error);
            }
            return;
        }

    // ⭐⭐⭐ 用户注册
    if (data.type === "register") {
      registerUser(data, (result) => {
        ws.send(JSON.stringify({
          type: "registerResponse",
          ...result
        }));
      });
      return;
    }

// ⭐ 新增：查询用户信息（用于登录界面显示头像）
if (data.type === "queryUserByIdOrPhone") {
  const loginId = data.loginId;
  const isPhone = /^1\d{10}$/.test(loginId);
  const query = isPhone 
    ? "SELECT * FROM users WHERE phone = ?"   // ⭐ 改为 SELECT * 获取完整信息
    : "SELECT * FROM users WHERE id = ?";
  
  db.get(query, [loginId], (err, user) => {
    if (err) {
      console.error("❌ 查询用户信息失败:", err);
    } else if (user) {
      ws.send(JSON.stringify({
        type: "userInfoResult",
        user: {
          userId: user.id,           // ⭐ 添加 userId
          id: user.id,                // 保留 id 兼容
          username: user.username,
          nickname: user.username,     // 保留 nickname 兼容
          avatar: user.avatar || '👤',
          gender: user.gender || '保密',
          birthday: user.birthday || '',
          region: user.region || '未设置',
          bio: user.bio || '',
          status: 2,                   // 默认状态
          isVip: user.is_vip ? true : false
        }
      }));
      console.log(`🔍 查询用户信息: ${user.username} (${loginId})`);
    }
    // 如果用户不存在，不返回任何消息
  });
  return;
}


// ⭐⭐⭐ 用户登录（新的认证登录）
if (data.type === "authLogin") {
  loginUser(data, (result) => {
    if (result.success) {
      const dbUser = result.user;
      const user = {
        userId: dbUser.userId,     // ⭐ 添加 userId
        id: dbUser.id,
        nickname: dbUser.username,
        username: dbUser.username,
        phone: dbUser.phone,
        avatar: dbUser.avatar,
        gender: dbUser.gender,
        birthday: dbUser.birthday,
        region: dbUser.region,
        bio: dbUser.bio,
        background: dbUser.background,
        theme: dbUser.theme || 'light',
        verified: dbUser.verified,
        merchant_verified: dbUser.merchant_verified,
        isVip: dbUser.isVip,
        vipExpireTime: dbUser.vipExpireTime,
        vipType: dbUser.vipType,
        lat: null,
        lng: null,
      };

      // 如果用户已登录，关闭旧连接
      if (userSocket.has(user.id)) {
        try {
          userSocket.get(user.id).close();
        } catch {}
      }

      socketUser.set(ws, user);
      userSocket.set(user.id, ws);
      onlineUsers.set(user.id, { user, ws });

      console.log(`\n👤 登录: ${user.nickname} (ID: ${user.id})`);
      console.log(`📊 在线: ${onlineUsers.size} 人`);

      ws.send(JSON.stringify({ 
        type: "loginSuccess", 
        user: user,
        message: result.message
      }));
      
      // ⭐ 广播新用户上线
      broadcast({
        type: "userJoined",
        userId: user.id,
        nickname: user.nickname,
        avatar: user.avatar
      });
      broadcast({ type: "onlineCount", count: onlineUsers.size });
    } else {
      ws.send(JSON.stringify({
        type: "loginFailed",
        message: result.message
      }));
    }
  });
  return;
}

    // ⭐⭐⭐ 新功能：清除气泡命令
    if (data.type === "adminCommand") {
      const user = socketUser.get(ws);
      
      // 验证密码
      if (data.password !== ADMIN_PASSWORD) {
        console.log(`❌ 管理员密码错误: ${data.command} (来自: ${user ? user.nickname : ip})`);
        ws.send(JSON.stringify({
          type: "adminResponse",
          success: false,
          message: "管理员密码错误"
        }));
        return;
      }
      
      console.log(`🔐 管理员命令: ${data.command} (来自: ${user ? user.nickname : ip})`);
      
      // 处理不同的管理命令
      switch(data.command) {
        case "clearBubbles":
          const result = clearAllBubbles(user ? user.nickname : "管理员");
          ws.send(JSON.stringify({
            type: "adminResponse",
            success: result.success,
            message: result.message || result.error,
            clearedCount: result.clearedCount,
            timestamp: result.timestamp
          }));
          break;
          
        case "getStats":
          ws.send(JSON.stringify({
            type: "adminResponse",
            success: true,
            stats: {
              bubbleCount: bubbles.size,
              onlineUsers: onlineUsers.size,
              totalPublished: stats.totalPublished,
              totalQueried: stats.totalQueried,
              totalMessages: stats.totalMessages,
              lastCleared: stats.lastCleared,
              clearedBy: stats.clearedBy
            }
          }));
          break;
          
        case "saveBackup":
          saveBackup();
          ws.send(JSON.stringify({
            type: "adminResponse",
            success: true,
            message: `已保存备份，共 ${bubbles.size} 个气泡`
          }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: "adminResponse",
            success: false,
            message: "未知的管理员命令"
          }));
      }
      return;
    }

    // ⭐⭐⭐ 客户端清除气泡请求（兼容旧版本）
    if (data.type === "clearBubbles") {
      const user = socketUser.get(ws);
      if (!user) {
        ws.send(JSON.stringify({
          type: "clearBubblesResponse",
          success: false,
          message: "用户未登录"
        }));
        return;
      }
      
      console.log(`🗑️  客户端清除气泡请求: ${user.nickname}`);
      
      // 可以在这里添加权限验证
      if (data.clearAll) {
        const result = clearAllBubbles(user.nickname);
        
        ws.send(JSON.stringify({
          type: "clearBubblesResponse",
          success: result.success,
          message: result.message || result.error,
          clearedCount: result.clearedCount
        }));
      }
      return;
    }

    // 旧版登录（兼容性保留，但建议使用authLogin）
    if (data.type === "login") {
      const user = {
        id: data.userId || genUserId(),
        nickname: data.nickname || "用户" + Math.floor(Math.random() * 10000),
        phone: data.phone,
        avatar: data.avatar || "👤",
        lat: null,
        lng: null,
      };

      // 如果用户已登录，关闭旧连接
      if (userSocket.has(user.id)) {
        try {
          userSocket.get(user.id).close();
        } catch {}
      }

      socketUser.set(ws, user);
      userSocket.set(user.id, ws);
      onlineUsers.set(user.id, { user, ws });

      console.log(`\n👤 登录: ${user.nickname} (ID: ${user.id})`);
      console.log(`📊 在线: ${onlineUsers.size} 人`);

      ws.send(JSON.stringify({ type: "loginSuccess", user: user }));
      
      // ⭐ 广播新用户上线
      broadcast({
        type: "userJoined",
        userId: user.id,
        nickname: user.nickname,
        avatar: user.avatar
      });
      broadcast({ type: "onlineCount", count: onlineUsers.size });
    }

    // 位置更新
    if (data.type === "position") {
      const user = socketUser.get(ws);
      if (user) {
        user.lat = data.lat;
        user.lng = data.lng;
        user.range = data.range || 1000; // ⭐ 保存用户的局域范围
        console.log(`📍 ${user.nickname}: ${user.lat.toFixed(4)}, ${user.lng.toFixed(4)} (范围: ${user.range}米)`);
        
        // ⭐ 广播位置给其他用户（包含范围信息）
        broadcast({
          type: "userPosition",
          userId: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          lat: user.lat,
          lng: user.lng,
          range: user.range  // ⭐ 广播用户的范围
        });
      }
    }

    // 公屏聊天
    if (data.type === "publicChat") {
      const user = socketUser.get(ws);
      if (!user) return;

      const msgObj = {
        type: "publicChat",
        from: user.nickname,
        fromId: user.id,
        avatar: user.avatar,
        msg: data.msg,
        time: Date.now(),
      };

      stats.totalMessages++;
      console.log(`💬 [公屏] ${user.nickname}: ${data.msg}`);
      broadcast(msgObj);
    }

    // 聊天室消息
    if (data.type === "chatroomMsg") {
      const user = socketUser.get(ws);
      if (!user) return;

      const msgObj = {
        type: "chatroomMsg",
        from: user.nickname,
        fromId: user.id,
        avatar: user.avatar,
        msg: data.msg,
        roomCode: data.roomCode,
        time: Date.now(),
      };

      stats.totalMessages++;
      console.log(`💬 [房间 ${data.roomCode}] ${user.nickname}: ${data.msg}`);
      
      // 广播给所有在同一房间的用户
      onlineUsers.forEach(({ user: u, ws: w }) => {
        if (w.readyState === WebSocket.OPEN) {
          w.send(JSON.stringify(msgObj));
        }
      });
    }

if (data.type === "getUserFullInfo") {
  const user = socketUser.get(ws);
  if (!user) return;
  
  db.get("SELECT * FROM users WHERE id = ?", [user.id], (err, userData) => {
    if (err) {
      console.error("❌ 查询用户信息失败:", err);
      return;
    }
    
    ws.send(JSON.stringify({
      type: "userFullInfo",
      user: {
        userId: userData.id,
        id: userData.id,
        phone: userData.phone,
        username: userData.username,
        nickname: userData.username,
        avatar: userData.avatar || '👤',
        gender: userData.gender || '保密',
        birthday: userData.birthday || '',
        region: userData.region || '未设置',
        bio: userData.bio || '',
        background: userData.background || '#667eea',
        theme: userData.theme || 'light',
        isVip: userData.is_vip ? true : false,
        vipExpireTime: userData.vip_expire_time || 0,
        vipType: userData.vip_type || 'none',
        created_at: userData.created_at,
        last_login: userData.last_login
      }
    }));
  });
}



    // 私聊
    if (data.type === "privateChat") {
      const user = socketUser.get(ws);
      if (!user) return;

      const targetWs = userSocket.get(data.to);
      const msgObj = {
        type: "privateChat",
        from: user.nickname,
        fromId: user.id,
        to: data.to,
        avatar: user.avatar,
        msg: data.msg,
        time: Date.now(),
      };

      stats.totalMessages++;
      console.log(`🔒 [私聊] ${user.nickname} → ${data.to}: ${data.msg}`);

      // 发给目标
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify(msgObj));
      }

      // 回显给自己
      ws.send(JSON.stringify(msgObj));
    }

    // 发布气泡
    if (data.type === "publishBubble") {
      const user = socketUser.get(ws);
      if (!user) return;

      // ⭐ 字段长度校验
      if (!data.title || data.title.trim().length === 0) {
        ws.send(JSON.stringify({
          type: "publishError",
          message: "气泡标题不能为空"
        }));
        return;
      }
      
      if (data.title.length > 100) {
        ws.send(JSON.stringify({
          type: "publishError",
          message: "气泡标题不能超过100个字符"
        }));
        return;
      }
      
      if (data.content && data.content.length > 1000) {
        ws.send(JSON.stringify({
          type: "publishError",
          message: "气泡内容不能超过1000个字符"
        }));
        return;
      }

      // ⭐ 支持用户选择的时间（分钟），默认60分钟
      const durationMinutes = data.durationMinutes || 60;
      const durationMs = durationMinutes * 60 * 1000;

      const bubble = {
        id: Math.random().toString(36).slice(2),
        author: user.nickname,
        authorId: user.id,
        avatar: user.avatar,
        type: data.bubbleType || "recommend",
        roomCode: data.roomCode || null,
        title: data.title,
        content: data.content || "",
        lat: data.lat,
        lng: data.lng,
        activityTags: data.activityTags || [],
        images: data.images || [], // ⭐ 新增：图片数组
        createdAt: Date.now(),
        expiresAt: Date.now() + durationMs,
        durationMinutes: durationMinutes // ⭐ 新增：存储时长
      };

      // ⭐ 保存到数据库而不是内存Map
      saveBubble(bubble, (success) => {
        if (success) {
          stats.totalPublished++;
          console.log(`🎈 发布气泡: [${bubble.type}] ${bubble.title} by ${user.nickname}${bubble.roomCode ? ' (房间: ' + bubble.roomCode + ')' : ''} - 有效期${durationMinutes}分钟`);

          // ⭐ 立即广播给所有在线用户（包括发布者）
          const broadcastBubble = {
            type: "newBubble",
            bubble: {
              id: bubble.id,
              author: bubble.author,
              authorId: bubble.authorId,
              avatar: bubble.avatar,
              type: bubble.type,
              roomCode: bubble.roomCode,
              title: bubble.title,
              content: bubble.content,
              lat: bubble.lat,
              lng: bubble.lng,
              activityTags: bubble.activityTags,
              images: bubble.images || [], // ⭐ 包含图片数据
              createdAt: bubble.createdAt,
              expiresAt: bubble.expiresAt,
              durationMinutes: bubble.durationMinutes,
              distance: 0 // 发布者距离为0
            }
          };
          
          broadcast(broadcastBubble);
          console.log(`📡 已广播新气泡给 ${onlineUsers.size} 个在线用户`);

          ws.send(JSON.stringify({
            type: "publishSuccess",
            bubbleId: bubble.id,
            message: `气泡发布成功！有效期${durationMinutes}分钟`
          }));
        } else {
          ws.send(JSON.stringify({
            type: "publishError",
            message: "发布失败，请重试"
          }));
        }
      });
    }

    // 查询气泡
    if (data.type === "queryBubbles") {
      const user = socketUser.get(ws);
      if (!user) return;

      // ⭐ 使用数据库查询
      queryActiveBubbles(data.lat, data.lng, data.radius || 5000, (results) => {
        stats.totalQueried++;
        console.log(`🔍 查询气泡: ${user.nickname} 找到 ${results.length} 个`);

        ws.send(JSON.stringify({
          type: "queryResult",
          bubbles: results,
        }));
      });
    }
    
    // ⭐ 新增：更新气泡内容
    if (data.type === "updateBubble") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const bubbleId = data.bubbleId;
      const title = data.title;
      const content = data.content;
      
      // 检查气泡是否存在且是否为本人发布
      db.get(`SELECT * FROM bubbles WHERE id = ? AND author_id = ?`, 
        [bubbleId, user.id], (err, bubble) => {
          if (err) {
            console.error("❌ 查询气泡失败:", err);
            ws.send(JSON.stringify({
              type: "bubbleUpdateError",
              message: "更新失败"
            }));
            return;
          }
          
          if (!bubble) {
            console.log(`⚠️ 气泡不存在或无权编辑: ${bubbleId}`);
            ws.send(JSON.stringify({
              type: "bubbleUpdateError",
              message: "气泡不存在或无权编辑"
            }));
            return;
          }
          
          // 更新气泡
          db.run(`UPDATE bubbles SET title = ?, content = ? WHERE id = ?`,
            [title, content, bubbleId], (err) => {
              if (err) {
                console.error("❌ 更新气泡失败:", err);
                ws.send(JSON.stringify({
                  type: "bubbleUpdateError",
                  message: "更新失败"
                }));
              } else {
                console.log(`✅ 气泡已更新: ${bubbleId} by ${user.nickname}`);
                
                // 通知客户端更新成功
                ws.send(JSON.stringify({
                  type: "bubbleUpdated",
                  bubbleId: bubbleId,
                  title: title,
                  content: content,
                  message: "更新成功"
                }));
                
                // ⭐ 广播给所有在线用户
                broadcast({
                  type: "bubbleUpdated",
                  bubbleId: bubbleId,
                  title: title,
                  content: content
                });
              }
            }
          );
        }
      );
    }
    
    // ⭐ 新增：更新头像
    if (data.type === "updateAvatar") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      user.avatar = data.avatar;
      console.log(`🎭 更新头像: ${user.nickname} -> ${data.avatar}`);
      
      // 广播给其他用户
      broadcast({
        type: "userAvatarUpdated",
        userId: user.id,
        avatar: data.avatar
      });
    }
    
    // ⭐ 新增：更新状态
    if (data.type === "updateStatus") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      db.run(`INSERT OR REPLACE INTO user_stats (user_id, status, status_text) 
              VALUES (?, ?, ?)`,
        [user.id, data.status, data.statusText],
        (err) => {
          if (err) {
            console.error("❌ 更新状态失败:", err);
          } else {
            console.log(`✨ 更新状态: ${user.nickname} -> ${data.statusText}`);
          }
        }
      );
    }
    
    // ⭐ 新增：点赞气泡
    if (data.type === "likeBubble") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      if (data.liked) {
        // 添加点赞
        db.run(`INSERT OR IGNORE INTO bubble_likes (bubble_id, user_id, created_at) 
                VALUES (?, ?, ?)`,
          [data.bubbleId, user.id, Date.now()],
          (err) => {
            if (err) {
              console.error("❌ 点赞失败:", err);
            } else {
              console.log(`❤️ ${user.nickname} 点赞了气泡: ${data.bubbleId}`);
              // 更新用户统计
              db.run(`UPDATE user_stats SET likes_count = likes_count + 1 WHERE user_id = ?`, [user.id]);
              
              // ⭐ 创建通知
              db.get(`SELECT author_id FROM bubbles WHERE id = ?`, [data.bubbleId], (err, row) => {
                if (!err && row && row.author_id !== user.id) {
                  db.run(`INSERT INTO notifications (user_id, type, bubble_id, from_user_id, from_user_name, from_user_avatar, is_read, created_at)
                          VALUES (?, 'like', ?, ?, ?, ?, 0, ?)`,
                    [row.author_id, data.bubbleId, user.id, user.nickname, user.avatar, Date.now()],
                    (err) => {
                      if (!err) {
                        console.log(`🔔 创建点赞通知: ${user.nickname} -> ${row.author_id}`);
                      }
                    }
                  );
                }
              });
            }
          }
        );
      } else {
        // 取消点赞
        db.run(`DELETE FROM bubble_likes WHERE bubble_id = ? AND user_id = ?`,
          [data.bubbleId, user.id],
          (err) => {
            if (err) {
              console.error("❌ 取消点赞失败:", err);
            } else {
              console.log(`💔 ${user.nickname} 取消点赞: ${data.bubbleId}`);
              // 更新用户统计
              db.run(`UPDATE user_stats SET likes_count = likes_count - 1 WHERE user_id = ?`, [user.id]);
            }
          }
        );
      }
    }
    
    // ⭐ 新增：收藏气泡
    if (data.type === "favoriteBubble") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      if (data.favorited) {
        // 添加收藏
        db.run(`INSERT OR IGNORE INTO bubble_favorites (bubble_id, user_id, created_at) 
                VALUES (?, ?, ?)`,
          [data.bubbleId, user.id, Date.now()],
          (err) => {
            if (err) {
              console.error("❌ 收藏失败:", err);
            } else {
              console.log(`⭐ ${user.nickname} 收藏了气泡: ${data.bubbleId}`);
              // 更新用户统计
              db.run(`UPDATE user_stats SET favorites_count = favorites_count + 1 WHERE user_id = ?`, [user.id]);
              
              // ⭐ 创建通知
              db.get(`SELECT author_id FROM bubbles WHERE id = ?`, [data.bubbleId], (err, row) => {
                if (!err && row && row.author_id !== user.id) {
                  db.run(`INSERT INTO notifications (user_id, type, bubble_id, from_user_id, from_user_name, from_user_avatar, is_read, created_at)
                          VALUES (?, 'favorite', ?, ?, ?, ?, 0, ?)`,
                    [row.author_id, data.bubbleId, user.id, user.nickname, user.avatar, Date.now()],
                    (err) => {
                      if (!err) {
                        console.log(`🔔 创建收藏通知: ${user.nickname} -> ${row.author_id}`);
                      }
                    }
                  );
                }
              });
            }
          }
        );
      } else {
        // 取消收藏
        db.run(`DELETE FROM bubble_favorites WHERE bubble_id = ? AND user_id = ?`,
          [data.bubbleId, user.id],
          (err) => {
            if (err) {
              console.error("❌ 取消收藏失败:", err);
            } else {
              console.log(`☆ ${user.nickname} 取消收藏: ${data.bubbleId}`);
              // 更新用户统计
              db.run(`UPDATE user_stats SET favorites_count = favorites_count - 1 WHERE user_id = ?`, [user.id]);
            }
          }
        );
      }
    }
    
// ⭐ 新增：评论气泡
if (data.type === "commentBubble") {
  const user = socketUser.get(ws);
  if (!user) return;
  
  let commentText = '';
  let commentAuthor = user.nickname;
  let commentTime = Date.now();
  
  // 兼容两种格式：直接字符串 或 对象格式
  if (typeof data.comment === 'string') {
    // 前端发送的是直接字符串
    commentText = data.comment;
    console.log(`📝 收到字符串格式评论: ${commentText}`);
  } else if (typeof data.comment === 'object' && data.comment !== null) {
    // 前端发送的是对象格式（包含 author, text, time）
    commentText = data.comment.text || '';
    commentAuthor = data.comment.author || user.nickname;
    commentTime = data.comment.time || Date.now();
    console.log(`📝 收到对象格式评论: ${commentText}`);
  } else {
    console.error("❌ 评论格式错误:", data.comment);
    return;
  }
  
  if (!commentText.trim()) {
    console.error("❌ 评论内容为空");
    return;
  }
  
  db.run(`INSERT INTO bubble_comments (bubble_id, user_id, author_name, comment_text, created_at) 
          VALUES (?, ?, ?, ?, ?)`,
    [data.bubbleId, user.id, commentAuthor, commentText, commentTime],
    function(err) {
      if (err) {
        console.error("❌ 评论失败:", err);
        ws.send(JSON.stringify({
          type: "commentError",
          message: "评论失败"
        }));
      } else {
        console.log(`✅ 评论成功，ID: ${this.lastID}`);
        console.log(`💬 ${user.nickname} 评论了气泡: ${data.bubbleId} - "${commentText}"`);
        
        // 更新用户统计
        db.run(`UPDATE user_stats SET comments_count = comments_count + 1 WHERE user_id = ?`, [user.id]);
        
        // 查询最新的评论列表
        db.all(`
          SELECT c.id, c.comment_text, c.created_at, c.user_id,
                 u.username, u.avatar
          FROM bubble_comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.bubble_id = ?
          ORDER BY c.created_at DESC
          LIMIT 50
        `, [data.bubbleId], (err, comments) => {
          if (!err) {
            // 广播新评论给所有在线用户
            broadcast({
              type: "bubbleCommentsResult",
              bubbleId: data.bubbleId,
              comments: comments
            });
          }
        });
        
        // ⭐ 创建通知
        db.get(`SELECT author_id FROM bubbles WHERE id = ?`, [data.bubbleId], (err, row) => {
          if (!err && row && row.author_id !== user.id) {
            db.run(`INSERT INTO notifications (user_id, type, bubble_id, from_user_id, from_user_name, from_user_avatar, content, is_read, created_at)
                    VALUES (?, 'comment', ?, ?, ?, ?, ?, 0, ?)`,
              [row.author_id, data.bubbleId, user.id, user.nickname, user.avatar, commentText, Date.now()],
              (err) => {
                if (!err) {
                  console.log(`🔔 创建评论通知: ${user.nickname} -> ${row.author_id}`);
                }
              }
            );
          }
        });
      }
    }
  );
}


    // ⭐ 新增：查询用户的点赞记录
    if (data.type === "queryUserLikes") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const query = `
        SELECT 
          l.bubble_id,
          l.created_at as liked_at,
          b.title,
          b.content,
          b.type,
          b.author,
          b.avatar as author_avatar,
          b.lat,
          b.lng,
          b.created_at as bubble_created_at,
          b.is_active
        FROM bubble_likes l
        LEFT JOIN bubbles b ON l.bubble_id = b.id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC
      `;
      
      db.all(query, [user.id], (err, rows) => {
        if (err) {
          console.error("❌ 查询点赞记录失败:", err);
          ws.send(JSON.stringify({
            type: "userLikesResult",
            likes: []
          }));
        } else {
          console.log(`📊 查询点赞记录: ${user.nickname} 共 ${rows.length} 条`);
          ws.send(JSON.stringify({
            type: "userLikesResult",
            likes: rows
          }));
        }
      });
    }
    
    // ⭐ 新增：查询用户的收藏记录
    if (data.type === "queryUserFavorites") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const query = `
        SELECT 
          f.bubble_id,
          f.created_at as favorited_at,
          b.title,
          b.content,
          b.type,
          b.author,
          b.avatar as author_avatar,
          b.lat,
          b.lng,
          b.created_at as bubble_created_at,
          b.is_active
        FROM bubble_favorites f
        LEFT JOIN bubbles b ON f.bubble_id = b.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `;
      
      db.all(query, [user.id], (err, rows) => {
        if (err) {
          console.error("❌ 查询收藏记录失败:", err);
          ws.send(JSON.stringify({
            type: "userFavoritesResult",
            favorites: []
          }));
        } else {
          console.log(`📊 查询收藏记录: ${user.nickname} 共 ${rows.length} 条`);
          ws.send(JSON.stringify({
            type: "userFavoritesResult",
            favorites: rows
          }));
        }
      });
    }
    
    // ⭐ 新增：查询用户的评论记录
    if (data.type === "queryUserComments") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const query = `
        SELECT 
          c.id as comment_id,
          c.bubble_id,
          c.comment_text,
          c.created_at as commented_at,
          b.title,
          b.content,
          b.type,
          b.author,
          b.avatar as author_avatar,
          b.lat,
          b.lng,
          b.created_at as bubble_created_at,
          b.is_active
        FROM bubble_comments c
        LEFT JOIN bubbles b ON c.bubble_id = b.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `;
      
      db.all(query, [user.id], (err, rows) => {
        if (err) {
          console.error("❌ 查询评论记录失败:", err);
          ws.send(JSON.stringify({
            type: "userCommentsResult",
            comments: []
          }));
        } else {
          console.log(`📊 查询评论记录: ${user.nickname} 共 ${rows.length} 条`);
          ws.send(JSON.stringify({
            type: "userCommentsResult",
            comments: rows
          }));
        }
      });
    }
    
    // ⭐ 新增：查询用户统计数据
    if (data.type === "queryUserStats") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      // 并行查询所有统计数据
      Promise.all([
        // 查询发布数量
        new Promise((resolve) => {
          db.get(`SELECT COUNT(*) as count FROM bubbles WHERE author_id = ?`, [user.id], (err, row) => {
            resolve(err ? 0 : row.count);
          });
        }),
        // 查询点赞数量
        new Promise((resolve) => {
          db.get(`SELECT COUNT(*) as count FROM bubble_likes WHERE user_id = ?`, [user.id], (err, row) => {
            resolve(err ? 0 : row.count);
          });
        }),
        // 查询收藏数量
        new Promise((resolve) => {
          db.get(`SELECT COUNT(*) as count FROM bubble_favorites WHERE user_id = ?`, [user.id], (err, row) => {
            resolve(err ? 0 : row.count);
          });
        }),
        // 查询评论数量
        new Promise((resolve) => {
          db.get(`SELECT COUNT(*) as count FROM bubble_comments WHERE user_id = ?`, [user.id], (err, row) => {
            resolve(err ? 0 : row.count);
          });
        })
      ]).then(([published, likes, favorites, comments]) => {
        const stats = {
          publishedCount: published,
          likesCount: likes,
          favoritesCount: favorites,
          commentsCount: comments
        };
        
        console.log(`📊 查询统计数据: ${user.nickname}`, stats);
        ws.send(JSON.stringify({
          type: "userStatsResult",
          stats: stats
        }));
      });
    }
    
    // ⭐ 新增：查询我发布的气泡
    if (data.type === "queryUserPublished") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const query = `
        SELECT * FROM bubbles 
        WHERE author_id = ? 
        ORDER BY created_at DESC
      `;
      
      db.all(query, [user.id], (err, rows) => {
        if (err) {
          console.error("❌ 查询发布记录失败:", err);
          ws.send(JSON.stringify({
            type: "userPublishedResult",
            bubbles: []
          }));
        } else {
          console.log(`📊 查询发布记录: ${user.nickname} 共 ${rows.length} 条`);
          ws.send(JSON.stringify({
            type: "userPublishedResult",
            bubbles: rows
          }));
        }
      });
    }
    
    // ⭐ 新增：查询浏览记录
    if (data.type === "queryUserViews") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const query = `
        SELECT 
          v.viewed_at,
          b.*
        FROM bubble_views v
        LEFT JOIN bubbles b ON v.bubble_id = b.id
        WHERE v.user_id = ?
        ORDER BY v.viewed_at DESC
        LIMIT 100
      `;
      
      db.all(query, [user.id], (err, rows) => {
        if (err) {
          console.error("❌ 查询浏览记录失败:", err);
          ws.send(JSON.stringify({
            type: "userViewsResult",
            views: []
          }));
        } else {
          console.log(`📊 查询浏览记录: ${user.nickname} 共 ${rows.length} 条`);
          ws.send(JSON.stringify({
            type: "userViewsResult",
            views: rows
          }));
        }
      });
    }
    
    // ⭐ 新增：搜索记录
    if (data.type === "searchRecords") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const section = data.section; // 'all', 'likes', 'favorites', 'comments', 'published', 'views'
      const keyword = data.keyword;
      
      // ⭐ 如果是搜索全部
      if (section === 'all') {
        const allQueries = [
          // 点赞
          new Promise((resolve) => {
            db.all(`
              SELECT 'like' as source, l.created_at as time, b.*
              FROM bubble_likes l
              LEFT JOIN bubbles b ON l.bubble_id = b.id
              WHERE l.user_id = ? AND (b.title LIKE ? OR b.content LIKE ?)
            `, [user.id, `%${keyword}%`, `%${keyword}%`], (err, rows) => {
              resolve(err ? [] : rows);
            });
          }),
          // 收藏
          new Promise((resolve) => {
            db.all(`
              SELECT 'favorite' as source, f.created_at as time, b.*
              FROM bubble_favorites f
              LEFT JOIN bubbles b ON f.bubble_id = b.id
              WHERE f.user_id = ? AND (b.title LIKE ? OR b.content LIKE ?)
            `, [user.id, `%${keyword}%`, `%${keyword}%`], (err, rows) => {
              resolve(err ? [] : rows);
            });
          }),
          // 评论
          new Promise((resolve) => {
            db.all(`
              SELECT 'comment' as source, c.comment_text, c.created_at as time, b.*
              FROM bubble_comments c
              LEFT JOIN bubbles b ON c.bubble_id = b.id
              WHERE c.user_id = ? AND (b.title LIKE ? OR b.content LIKE ? OR c.comment_text LIKE ?)
            `, [user.id, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`], (err, rows) => {
              resolve(err ? [] : rows);
            });
          }),
          // 我发布的
          new Promise((resolve) => {
            db.all(`
              SELECT 'published' as source, created_at as time, * FROM bubbles
              WHERE author_id = ? AND (title LIKE ? OR content LIKE ?)
            `, [user.id, `%${keyword}%`, `%${keyword}%`], (err, rows) => {
              resolve(err ? [] : rows);
            });
          }),
          // 浏览记录
          new Promise((resolve) => {
            db.all(`
              SELECT 'view' as source, v.viewed_at as time, b.*
              FROM bubble_views v
              LEFT JOIN bubbles b ON v.bubble_id = b.id
              WHERE v.user_id = ? AND (b.title LIKE ? OR b.content LIKE ?)
            `, [user.id, `%${keyword}%`, `%${keyword}%`], (err, rows) => {
              resolve(err ? [] : rows);
            });
          })
        ];
        
        Promise.all(allQueries).then(results => {
          const allResults = results.flat().sort((a, b) => b.time - a.time);
          console.log(`🔍 搜索全部: ${user.nickname} 找到 ${allResults.length} 条`);
          ws.send(JSON.stringify({
            type: "searchResult",
            section: "all",
            keyword: keyword,
            results: allResults
          }));
        });
        return;
      }
      
      let query = '';
      let params = [user.id, `%${keyword}%`, `%${keyword}%`];
      
      switch(section) {
        case 'likes':
          query = `
            SELECT l.created_at as liked_at, b.*
            FROM bubble_likes l
            LEFT JOIN bubbles b ON l.bubble_id = b.id
            WHERE l.user_id = ? AND (b.title LIKE ? OR b.content LIKE ?)
            ORDER BY l.created_at DESC
          `;
          break;
        case 'favorites':
          query = `
            SELECT f.created_at as favorited_at, b.*
            FROM bubble_favorites f
            LEFT JOIN bubbles b ON f.bubble_id = b.id
            WHERE f.user_id = ? AND (b.title LIKE ? OR b.content LIKE ?)
            ORDER BY f.created_at DESC
          `;
          break;
        case 'comments':
          query = `
            SELECT c.comment_text, c.created_at as commented_at, b.*
            FROM bubble_comments c
            LEFT JOIN bubbles b ON c.bubble_id = b.id
            WHERE c.user_id = ? AND (b.title LIKE ? OR b.content LIKE ? OR c.comment_text LIKE ?)
            ORDER BY c.created_at DESC
          `;
          params = [user.id, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`];
          break;
        case 'published':
          query = `
            SELECT * FROM bubbles
            WHERE author_id = ? AND (title LIKE ? OR content LIKE ?)
            ORDER BY created_at DESC
          `;
          break;
        case 'views':
          query = `
            SELECT v.viewed_at, b.*
            FROM bubble_views v
            LEFT JOIN bubbles b ON v.bubble_id = b.id
            WHERE v.user_id = ? AND (b.title LIKE ? OR b.content LIKE ?)
            ORDER BY v.viewed_at DESC
          `;
          break;
        default:
          ws.send(JSON.stringify({
            type: "searchResult",
            results: []
          }));
          return;
      }
      
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error("❌ 搜索失败:", err);
          ws.send(JSON.stringify({
            type: "searchResult",
            results: []
          }));
        } else {
          console.log(`🔍 搜索结果: ${user.nickname} 在 ${section} 中找到 ${rows.length} 条`);
          ws.send(JSON.stringify({
            type: "searchResult",
            section: section,
            keyword: keyword,
            results: rows
          }));
        }
      });
    }
    
    // ⭐ 新增：查询未读通知
    if (data.type === "queryUnreadNotifications") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      // 查询未读通知数量
      db.get(`SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`, 
        [user.id], (err, countRow) => {
          if (err) {
            console.error("❌ 查询未读数量失败:", err);
            return;
          }
          
          // 查询最新的未读通知（最多10条）
          db.all(`
            SELECT n.*, b.title as bubble_title
            FROM notifications n
            LEFT JOIN bubbles b ON n.bubble_id = b.id
            WHERE n.user_id = ? AND n.is_read = 0
            ORDER BY n.created_at DESC
            LIMIT 10
          `, [user.id], (err, rows) => {
            if (err) {
              console.error("❌ 查询未读通知失败:", err);
            } else {
              console.log(`🔔 查询未读通知: ${user.nickname} 共 ${countRow.count} 条`);
              ws.send(JSON.stringify({
                type: "unreadNotificationsResult",
                count: countRow.count,
                notifications: rows
              }));
            }
          });
        }
      );
    }
    
    // ⭐ 新增：标记通知已读
    if (data.type === "markNotificationRead") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      if (data.notificationId) {
        // 标记单条通知已读
        db.run(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
          [data.notificationId, user.id], (err) => {
            if (err) {
              console.error("❌ 标记通知已读失败:", err);
            } else {
              console.log(`✅ 通知已读: ${data.notificationId}`);
            }
          }
        );
      } else {
        // 标记所有通知已读
        db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
          [user.id], (err) => {
            if (err) {
              console.error("❌ 标记所有通知已读失败:", err);
            } else {
              console.log(`✅ 所有通知已读: ${user.nickname || user.username}`);
            }
          }
        );
      }
    }
    
    // ⭐ 新增：查询收件箱未读数（按类型分组）
    if (data.type === "queryInboxUnread") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      db.all(`
        SELECT type, COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ? AND is_read = 0 
        GROUP BY type
      `, [user.id], (err, rows) => {
        if (err) {
          console.error("❌ 查询收件箱未读失败:", err);
        } else {
          const counts = {
            like: 0,
            favorite: 0,
            comment: 0
          };
          
          rows.forEach(row => {
            counts[row.type] = row.count;
          });
          
          const totalCount = counts.like + counts.favorite + counts.comment;
          
          console.log(`📨 收件箱未读: ${user.nickname || user.username} - 总计${totalCount}条`);
          
          ws.send(JSON.stringify({
            type: "inboxUnreadResult",
            counts: counts,
            total: totalCount
          }));
        }
      });
    }
    
    // ⭐ 新增：查询某类型的通知列表
    // ⭐ 新增：查询某类型的通知列表（只查未读）

if (data.type === "queryNotificationsByType") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const notificationType = data.notificationType;
      
      // ⭐ 查询所有通知（包含已读和未读）
      db.all(`
        SELECT n.*, b.title as bubble_title
        FROM notifications n
        LEFT JOIN bubbles b ON n.bubble_id = b.id
        WHERE n.user_id = ? AND n.type = ?
        ORDER BY n.created_at DESC
        LIMIT 50
      `, [user.id, notificationType], (err, rows) => {
        if (err) {
          console.error("❌ 查询通知列表失败:", err);
        } else {
          console.log(`📨 查询${notificationType}通知: ${user.nickname || user.username} 共${rows.length}条（含已读）`);
          
          ws.send(JSON.stringify({
            type: "notificationsByTypeResult",
            notificationType: notificationType,
            notifications: rows
          }));
          
          // ⭐ 查看后标记未读为已读（但已读的保留不变）
          db.run(`
            UPDATE notifications 
            SET is_read = 1 
            WHERE user_id = ? AND type = ? AND is_read = 0
          `, [user.id, notificationType], (err) => {
            if (err) {
              console.error("❌ 标记通知已读失败:", err);
            } else {
              console.log(`✅ ${notificationType}通知已标记为已读`);
            }
          });
        }
      });
    }

    // ⭐ 新增：记录气泡浏览
    if (data.type === "recordBubbleView") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      db.run(`INSERT INTO bubble_views (bubble_id, user_id, viewed_at) VALUES (?, ?, ?)`,
        [data.bubbleId, user.id, Date.now()], (err) => {
          if (err) {
            console.error("❌ 记录浏览失败:", err);
          } else {
            console.log(`👁️ 记录浏览: ${user.nickname} 查看了 ${data.bubbleId}`);
          }
        }
      );
    }
    
    // ⭐ 新增：更新用户信息
    if (data.type === "updateUserInfo") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const field = data.field;
      const value = data.value;
      const allowedFields = ['username', 'gender', 'birthday', 'region', 'bio', 'background', 'theme', 'avatar'];
      
      if (!allowedFields.includes(field)) {
        console.error("❌ 不允许更新的字段:", field);
        ws.send(JSON.stringify({
          type: "updateError",
          field: field,
          message: "不允许更新该字段"
        }));
        return;
      }
      
      // ⭐ 字段长度校验
      const fieldLimits = {
        username: 20,
        gender: 10,
        birthday: 20,
        region: 50,
        bio: 200,
        background: 50,
        theme: 20,
        avatar: 10
      };
      
      if (typeof value === 'string' && fieldLimits[field] && value.length > fieldLimits[field]) {
        ws.send(JSON.stringify({
          type: "updateError",
          field: field,
          message: `${field}字段不能超过${fieldLimits[field]}个字符`
        }));
        return;
      }
      
      // 使用参数化查询防止SQL注入
      const sql = `UPDATE users SET ${field} = ? WHERE id = ?`;
      
      db.run(sql, [value, user.id], function(err) {
        if (err) {
          console.error(`❌ 更新${field}失败:`, err);
          ws.send(JSON.stringify({
            type: "updateError",
            field: field,
            message: err.message
          }));
        } else {
          console.log(`⚙️ ${user.nickname || user.username} 更新${field}: ${value}`);
          user[field] = value;
          
          ws.send(JSON.stringify({
            type: "userInfoUpdated",
            field: field,
            value: value,
            success: true
          }));
        }
      });
    }
    
    // ⭐ 新增：激活会员
    if (data.type === "activateVip") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const duration = data.duration; // 毫秒
      const now = Date.now();
      
      // 获取当前会员到期时间
      db.get(`SELECT vip_expire_time FROM users WHERE id = ?`, [user.id], (err, row) => {
        if (err) {
          console.error("❌ 查询会员信息失败:", err);
          return;
        }
        
        const currentExpire = row.vip_expire_time || 0;
        // 如果已经是会员且未过期，在现有时间基础上累加
        const newExpire = Math.max(currentExpire, now) + duration;
        
        db.run(`UPDATE users SET is_vip = 1, vip_expire_time = ?, vip_type = ? WHERE id = ?`,
          [newExpire, data.vipType, user.id],
          (err) => {
            if (err) {
              console.error("❌ 激活会员失败:", err);
            } else {
              const expireDate = new Date(newExpire);
              console.log(`💎 ${user.nickname} 激活${data.vipType}会员，到期: ${expireDate.toLocaleString()}`);
              
              // 更新用户对象
              user.isVip = true;
              user.vipExpireTime = newExpire;
              user.vipType = data.vipType;
              
              // 返回会员信息
              ws.send(JSON.stringify({
                type: "vipActivated",
                isVip: true,
                expireTime: newExpire,
                vipType: data.vipType
              }));
            }
          }
        );
      });
    }
    
    // ⭐ 新增：查询会员状态
    if (data.type === "queryVipStatus") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      db.get(`SELECT is_vip, vip_expire_time, vip_type FROM users WHERE id = ?`,
        [user.id], (err, row) => {
          if (err) {
            console.error("❌ 查询会员状态失败:", err);
          } else {
            const now = Date.now();
            const isVip = row.is_vip && row.vip_expire_time > now;
            
            ws.send(JSON.stringify({
              type: "vipStatusResult",
              isVip: isVip,
              expireTime: row.vip_expire_time,
              vipType: row.vip_type
            }));
            
            console.log(`💎 ${user.nickname} 会员状态: ${isVip ? '会员' : '非会员'}`);
          }
        }
      );
    }
    
    // ⭐ 新增：删除记录
    if (data.type === "deleteRecords") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const section = data.section;
      const recordIds = data.recordIds;
      
      if (!recordIds || recordIds.length === 0) return;
      
      let tableName, idField;
      switch(section) {
        case 'published':
          tableName = 'bubbles';
          idField = 'id';
          break;
        case 'likes':
          tableName = 'bubble_likes';
          idField = 'bubble_id';
          break;
        case 'favorites':
          tableName = 'bubble_favorites';
          idField = 'bubble_id';
          break;
        case 'comments':
          tableName = 'bubble_comments';
          idField = 'id';
          break;
        case 'history':
          tableName = 'bubble_views';
          idField = 'bubble_id';
          break;
        default:
          return;
      }
      
      // 构建删除SQL
      const placeholders = recordIds.map(() => '?').join(',');
      let sql;
      
      if (section === 'published') {
        sql = `DELETE FROM ${tableName} WHERE ${idField} IN (${placeholders}) AND author_id = ?`;
      } else if (section === 'comments') {
        sql = `DELETE FROM ${tableName} WHERE ${idField} IN (${placeholders}) AND user_id = ?`;
      } else {
        sql = `DELETE FROM ${tableName} WHERE ${idField} IN (${placeholders}) AND user_id = ?`;
      }
      
      const params = [...recordIds, user.id];
      
      db.run(sql, params, function(err) {
        if (err) {
          console.error(`❌ 删除${section}记录失败:`, err);
        } else {
          console.log(`🗑️ ${user.nickname} 删除了${this.changes}条${section}记录`);
          
          ws.send(JSON.stringify({
            type: "recordsDeleted",
            section: section,
            count: this.changes
          }));
        }
      });
    }
    
    // ==================== ⭐ v9.4.0: 私聊系统接口 ====================
    
    // 发送私聊消息
    if (data.type === "sendPrivateMessage") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const toUserId = data.toUserId;
      const message = data.message;
      
      if (!toUserId || !message) {
        console.log("❌ 私聊消息参数不完整");
        return;
      }
      
      const now = Date.now();
      
      // 保存消息到数据库
      db.run(`
        INSERT INTO private_messages (from_user_id, to_user_id, message, created_at, is_read)
        VALUES (?, ?, ?, ?, 0)
      `, [user.id, toUserId, message, now], function(err) {
        if (err) {
          console.error("❌ 发送私聊消息失败:", err);
          ws.send(JSON.stringify({
            type: "error",
            message: "发送消息失败"
          }));
        } else {
          console.log(`💬 私聊: ${user.nickname || user.username} → ${toUserId}: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`);
          
          // 返回发送成功
          ws.send(JSON.stringify({
            type: "privateMessageSent",
            messageId: this.lastID,
            toUserId: toUserId,
            message: message,
            createdAt: now
          }));
          
          // 推送给接收者（如果在线）
          const toUserWs = userSocket.get(toUserId);
          if (toUserWs && toUserWs.readyState === WebSocket.OPEN) {
            toUserWs.send(JSON.stringify({
              type: "privateMessageReceived",
              messageId: this.lastID,
              fromUserId: user.id,
              fromUserName: user.nickname || user.username,
              fromUserAvatar: user.avatar,
              message: message,
              createdAt: now
            }));
            console.log(`📨 已推送消息给 ${toUserId}`);
          }
        }
      });
    }
    
    // 查询私聊列表
    if (data.type === "queryPrivateChats") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      console.log(`💬 ${user.nickname || user.username} 查询私聊列表`);
      
      // 查询所有有私聊记录的用户
      db.all(`
        SELECT DISTINCT
          CASE 
            WHEN from_user_id = ? THEN to_user_id
            ELSE from_user_id
          END as other_user_id
        FROM private_messages
        WHERE from_user_id = ? OR to_user_id = ?
      `, [user.id, user.id, user.id], (err, rows) => {
        if (err) {
          console.error("❌ 查询私聊列表失败:", err);
          ws.send(JSON.stringify({
            type: "privateChatsResult",
            chats: []
          }));
          return;
        }
        
        if (rows.length === 0) {
          console.log("📭 私聊列表为空");
          ws.send(JSON.stringify({
            type: "privateChatsResult",
            chats: []
          }));
          return;
        }
        
        // 获取每个用户的详细信息和最后消息
        const promises = rows.map(row => {
          return new Promise((resolve) => {
            const otherUserId = row.other_user_id;
            
            // 查询对方用户信息
            db.get(`SELECT id, username, avatar FROM users WHERE id = ?`, 
              [otherUserId], (err, userInfo) => {
                if (err || !userInfo) {
                  console.log(`⚠️ 用户不存在: ${otherUserId}`);
                  resolve(null);
                  return;
                }
                
                // 查询最后一条消息
                db.get(`
                  SELECT message, created_at, from_user_id
                  FROM private_messages
                  WHERE (from_user_id = ? AND to_user_id = ?) 
                     OR (from_user_id = ? AND to_user_id = ?)
                  ORDER BY created_at DESC
                  LIMIT 1
                `, [user.id, otherUserId, otherUserId, user.id], (err, lastMsg) => {
                  if (err) {
                    resolve(null);
                    return;
                  }
                  
                  // 查询未读数
                  db.get(`
                    SELECT COUNT(*) as unread_count
                    FROM private_messages
                    WHERE from_user_id = ? AND to_user_id = ? AND is_read = 0
                  `, [otherUserId, user.id], (err, unreadInfo) => {
                    resolve({
                      userId: userInfo.id,
                      username: userInfo.username,
                      avatar: userInfo.avatar,
                      lastMessage: lastMsg ? lastMsg.message : '',
                      lastMessageTime: lastMsg ? lastMsg.created_at : 0,
                      isSentByMe: lastMsg ? lastMsg.from_user_id === user.id : false,
                      unreadCount: unreadInfo ? unreadInfo.unread_count : 0
                    });
                  });
                });
              });
          });
        });
        
        Promise.all(promises).then(chats => {
          const validChats = chats.filter(c => c !== null);
          // 按最后消息时间排序
          validChats.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
          
          console.log(`📬 查询到 ${validChats.length} 个私聊会话`);
          
          ws.send(JSON.stringify({
            type: "privateChatsResult",
            chats: validChats
          }));
        });
      });
    }
    
    // 查询与某人的聊天记录
    if (data.type === "queryPrivateMessages") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const otherUserId = data.otherUserId;
      
      console.log(`💬 ${user.nickname || user.username} 查询与 ${otherUserId} 的聊天记录`);
      
      // 查询聊天记录
      db.all(`
        SELECT id, from_user_id, to_user_id, message, created_at, is_read
        FROM private_messages
        WHERE (from_user_id = ? AND to_user_id = ?) 
           OR (from_user_id = ? AND to_user_id = ?)
        ORDER BY created_at ASC
        LIMIT 100
      `, [user.id, otherUserId, otherUserId, user.id], (err, rows) => {
        if (err) {
          console.error("❌ 查询聊天记录失败:", err);
          ws.send(JSON.stringify({
            type: "privateMessagesResult",
            otherUserId: otherUserId,
            messages: []
          }));
        } else {
          console.log(`📜 查询到 ${rows.length} 条聊天记录`);
          
          ws.send(JSON.stringify({
            type: "privateMessagesResult",
            otherUserId: otherUserId,
            messages: rows
          }));
          
          // 标记已读
          db.run(`
            UPDATE private_messages
            SET is_read = 1
            WHERE from_user_id = ? AND to_user_id = ? AND is_read = 0
          `, [otherUserId, user.id], (err) => {
            if (err) {
              console.error("❌ 标记私聊已读失败:", err);
            } else {
              console.log(`✅ 标记 ${otherUserId} → ${user.nickname || user.username} 的消息为已读`);
            }
          });
        }
      });
    }
    
    // 查询私聊未读总数
    if (data.type === "queryPrivateUnreadCount") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      db.get(`
        SELECT COUNT(*) as unread_count
        FROM private_messages
        WHERE to_user_id = ? AND is_read = 0
      `, [user.id], (err, row) => {
        if (err) {
          console.error("❌ 查询私聊未读数失败:", err);
          ws.send(JSON.stringify({
            type: "privateUnreadCountResult",
            count: 0
          }));
        } else {
          const count = row ? row.unread_count : 0;
          console.log(`💬 私聊未读数: ${user.nickname || user.username} - ${count}条`);
          
          ws.send(JSON.stringify({
            type: "privateUnreadCountResult",
            count: count
          }));
        }
      });
    }
    
    // 查询气泡评论（优化版）
    if (data.type === "queryBubbleComments") {
      const user = socketUser.get(ws);
      if (!user) return;
      
      const bubbleId = data.bubbleId;
      
      console.log(`💬 ${user.nickname || user.username} 查询气泡 ${bubbleId} 的评论`);
      
      db.all(`
        SELECT c.id, c.comment_text, c.created_at, c.user_id,
               u.username, u.avatar
        FROM bubble_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.bubble_id = ?
        ORDER BY c.created_at DESC
        LIMIT 50
      `, [bubbleId], (err, rows) => {
        if (err) {
          console.error("❌ 查询评论失败:", err);
          ws.send(JSON.stringify({
            type: "bubbleCommentsResult",
            bubbleId: bubbleId,
            comments: []
          }));
        } else {
          console.log(`💬 查询到 ${rows.length} 条评论`);
          
          ws.send(JSON.stringify({
            type: "bubbleCommentsResult",
            bubbleId: bubbleId,
            comments: rows
          }));
        }
      });
    }

 // 获取省份列表
if (data.type === "getProvinces") {
    db.all("SELECT id, name FROM provinces ORDER BY name", [], (err, rows) => {
        if (err) {
            console.error("❌ 获取省份失败:", err);
            ws.send(JSON.stringify({
                type: "provincesResult",
                provinces: []
            }));
        } else {
            console.log(`✅ 获取省份成功，共 ${rows.length} 条`);
            ws.send(JSON.stringify({
                type: "provincesResult",
                provinces: rows
            }));
        }
    });
    return;
}

// 根据省份ID获取城市
if (data.type === "getCitiesByProvince") {
    db.all("SELECT id, name FROM cities WHERE province_id = ? ORDER BY name", [data.provinceId], (err, rows) => {
        if (err) {
            console.error("❌ 获取城市失败:", err);
            ws.send(JSON.stringify({
                type: "citiesResult",
                provinceId: data.provinceId,
                cities: []
            }));
        } else {
            console.log(`✅ 获取城市成功，共 ${rows.length} 条`);
            ws.send(JSON.stringify({
                type: "citiesResult",
                provinceId: data.provinceId,
                cities: rows
            }));
        }
    });
    return;
}

    // ==================== 腾讯地图搜索功能（通过后端转发）====================
    
    // 搜索地点（关键词提示）
    if (data.type === "searchPlaces") {
      const user = socketUser.get(ws);
      const keyword = data.keyword;
      const key = 'TEMBZ-FNT6T-CJCXP-LOPED-2UEGK-4MBHP'; // 你的腾讯地图Key
      
      console.log(`🔍 后端搜索地点: ${keyword} ${user ? '(用户: ' + user.nickname + ')' : ''}`);
      
      // 使用 fetch（Node.js 18+ 支持）
      const url = `https://apis.map.qq.com/ws/place/v1/suggestion?keyword=${encodeURIComponent(keyword)}&key=${key}&output=json&region=全国`;
      
      // 如果是 Node.js 18+，可以直接用 fetch
      if (typeof fetch === 'function') {
        fetch(url)
          .then(response => response.json())
          .then(data => {
            if (data.status === 0) {
              console.log(`✅ 搜索成功，找到 ${data.data.length} 个结果`);
              
              // 格式化结果
              const places = data.data.map(item => ({
                name: item.title,
                address: item.address || '',
                lat: item.location.lat,
                lng: item.location.lng,
                province: item.province,
                city: item.city,
                district: item.district
              }));
              
              ws.send(JSON.stringify({
                type: "searchPlacesResult",
                keyword: keyword,
                places: places
              }));
            } else {
              console.error(`❌ 搜索失败: ${data.message} (code: ${data.status})`);
              ws.send(JSON.stringify({
                type: "searchPlacesResult",
                keyword: keyword,
                places: [],
                error: data.message
              }));
            }
          })
          .catch(error => {
            console.error("❌ 搜索请求异常:", error);
            ws.send(JSON.stringify({
              type: "searchPlacesResult",
              keyword: keyword,
              places: [],
              error: error.message
            }));
          });
      } else {
        // 如果是旧版本 Node.js，使用 http/https 模块
        const https = require('https');
        
        https.get(url, (resp) => {
          let data = '';
          
          resp.on('data', (chunk) => {
            data += chunk;
          });
          
          resp.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.status === 0) {
                const places = result.data.map(item => ({
                  name: item.title,
                  address: item.address || '',
                  lat: item.location.lat,
                  lng: item.location.lng,
                  province: item.province,
                  city: item.city,
                  district: item.district
                }));
                
                ws.send(JSON.stringify({
                  type: "searchPlacesResult",
                  keyword: keyword,
                  places: places
                }));
              } else {
                ws.send(JSON.stringify({
                  type: "searchPlacesResult",
                  keyword: keyword,
                  places: [],
                  error: result.message
                }));
              }
            } catch (e) {
              console.error("❌ 解析搜索结果失败:", e);
            }
          });
        }).on("error", (err) => {
          console.error("❌ 搜索请求错误:", err.message);
          ws.send(JSON.stringify({
            type: "searchPlacesResult",
            keyword: keyword,
            places: [],
            error: err.message
          }));
        });
      }
      return;
    }
    
    // 逆地理编码（坐标转地址）
    if (data.type === "reverseGeocode") {
      const user = socketUser.get(ws);
      const { lat, lng } = data;
      const key = 'TEMBZ-FNT6T-CJCXP-LOPED-2UEGK-4MBHP';
      
      console.log(`📍 后端逆地理编码: ${lat},${lng} ${user ? '(用户: ' + user.nickname + ')' : ''}`);
      
      const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${lat},${lng}&key=${key}&output=json`;
      
      if (typeof fetch === 'function') {
        fetch(url)
          .then(response => response.json())
          .then(data => {
            if (data.status === 0) {
              ws.send(JSON.stringify({
                type: "reverseGeocodeResult",
                lat: lat,
                lng: lng,
                address: data.result.address,
                formatted_addresses: data.result.formatted_addresses || {},
                address_components: data.result.address_components || {}
              }));
            } else {
              ws.send(JSON.stringify({
                type: "reverseGeocodeResult",
                lat: lat,
                lng: lng,
                address: null,
                error: data.message
              }));
            }
          })
          .catch(error => {
            console.error("❌ 逆地理编码失败:", error);
            ws.send(JSON.stringify({
              type: "reverseGeocodeResult",
              lat: lat,
              lng: lng,
              address: null,
              error: error.message
            }));
          });
      } else {
        const https = require('https');
        
        https.get(url, (resp) => {
          let data = '';
          
          resp.on('data', (chunk) => {
            data += chunk;
          });
          
          resp.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.status === 0) {
                ws.send(JSON.stringify({
                  type: "reverseGeocodeResult",
                  lat: lat,
                  lng: lng,
                  address: result.result.address,
                  formatted_addresses: result.result.formatted_addresses || {},
                  address_components: result.result.address_components || {}
                }));
              } else {
                ws.send(JSON.stringify({
                  type: "reverseGeocodeResult",
                  lat: lat,
                  lng: lng,
                  address: null,
                  error: result.message
                }));
              }
            } catch (e) {
              console.error("❌ 解析逆地理编码结果失败:", e);
            }
          });
        }).on("error", (err) => {
          console.error("❌ 逆地理编码请求错误:", err.message);
        });
      }
      return;
    }

// 搜索城市
if (data.type === "searchCities") {
    const keyword = `%${data.keyword}%`;
    db.all(`
        SELECT c.id, c.name, p.name as province_name 
        FROM cities c
        JOIN provinces p ON c.province_id = p.id
        WHERE c.name LIKE ? OR p.name LIKE ?
        ORDER BY 
            CASE 
                WHEN c.name = ? THEN 1
                WHEN c.name LIKE ? THEN 2
                ELSE 3
            END,
            c.name
        LIMIT 20
    `, [keyword, keyword, data.keyword, `${data.keyword}%`], (err, rows) => {
        if (err) {
            console.error("❌ 搜索城市失败:", err);
            ws.send(JSON.stringify({
                type: "searchCitiesResult",
                results: []
            }));
        } else {
            console.log(`✅ 搜索城市成功，共 ${rows.length} 条`);
            ws.send(JSON.stringify({
                type: "searchCitiesResult",
                results: rows
            }));
        }
    });
    return;
}   


  });

  ws.on("close", () => {
    const user = socketUser.get(ws);
    if (user) {
      console.log(`\n👋 断开: ${user.nickname}`);
      onlineUsers.delete(user.id);
      socketUser.delete(ws);
      userSocket.delete(user.id);

      broadcast({ type: "onlineCount", count: onlineUsers.size });
      
      // ⭐ 广播用户离线
      broadcast({
        type: "userLeft",
        userId: user.id,
        nickname: user.nickname
      });
    }
  });
});




// ==================== HTTP 监控服务器 ====================
const httpServer = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/clearBubbles") {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        
        // 验证管理员密码
        if (data.password !== ADMIN_PASSWORD) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            success: false,
            message: "管理员密码错误"
          }));
          return;
        }
        
        // 执行清除操作
        const result = clearAllBubbles(data.initiator || "HTTP管理员");
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
        
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: false,
          message: "请求处理失败: " + error.message
        }));
      }
    });
    return;
  }

  if (req.url === "/" || req.url === "/monitor") {
    const now = Date.now();
    const activeBubbles = Array.from(bubbles.values())
      .filter((b) => b.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);

    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="3">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MomentMap 实时监控</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      font-family: "Segoe UI", Arial, sans-serif;
      color: white;
      padding: 20px;
      min-height: 100vh;
    }
    h1 {
      text-align: center;
      font-size: 32px;
      margin-bottom: 30px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .stat-box {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .stat-box h3 {
      font-size: 14px;
      margin-bottom: 10px;
      opacity: 0.9;
    }
    .stat-box .value {
      font-size: 28px;
      font-weight: bold;
      color: #00ff00;
    }
    .section {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .section h2 {
      margin-bottom: 15px;
      font-size: 20px;
      color: #00ffff;
    }
    .user-item, .bubble-item {
      padding: 10px;
      margin: 5px 0;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 5px;
      border-left: 3px solid #00ff00;
    }
    .bubble-item {
      background: #0a0a0a;
      padding: 15px;
      margin: 10px 0;
      border-left: 4px solid #ff00ff;
    }
    .bubble-item .title {
      font-size: 18px;
      color: #00ffff;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .bubble-item .info {
      font-size: 12px;
      color: #888;
    }
    .location { color: #00ff00; }
    .time { color: #ffff00; }
    .refresh {
      text-align: center;
      color: #888;
      margin-top: 20px;
      font-size: 12px;
    }
    .admin-panel {
      background: linear-gradient(135deg, #ff416c, #ff4b2b);
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .admin-panel h2 {
      color: white;
      margin-bottom: 15px;
    }
    .admin-button {
      background: #ff0000;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      margin-right: 10px;
    }
    .admin-button:hover {
      background: #cc0000;
    }
    .admin-input {
      padding: 8px;
      border-radius: 5px;
      border: 2px solid #00ff00;
      background: #0a0a0a;
      color: white;
      margin-right: 10px;
    }
  </style>
</head>
<body>
  <h1>🗺️ MomentMap 实时监控</h1>
  
  <div class="admin-panel">
    <h2>🔐 管理员控制台</h2>
    <input type="password" id="adminPassword" class="admin-input" placeholder="管理员密码" />
    <button class="admin-button" onclick="clearBubbles()">🗑️ 清除所有气泡</button>
    <button class="admin-button" onclick="saveBackup()">💾 立即备份</button>
    <button class="admin-button" onclick="refreshStats()">🔄 刷新统计</button>
    <div id="adminMessage" style="margin-top: 10px; color: yellow;"></div>
  </div>
  
  <div class="stats">
    <div class="stat-box">
      <h3>🎈 内存气泡</h3>
      <div class="value">${bubbles.size}</div>
    </div>
    <div class="stat-box">
      <h3>✅ 活跃气泡</h3>
      <div class="value">${activeBubbles.length}</div>
    </div>
    <div class="stat-box">
      <h3>👥 在线用户</h3>
      <div class="value">${onlineUsers.size}</div>
    </div>
    <div class="stat-box">
      <h3>📤 已发布</h3>
      <div class="value">${stats.totalPublished}</div>
    </div>
    <div class="stat-box">
      <h3>🔍 已查询</h3>
      <div class="value">${stats.totalQueried}</div>
    </div>
    <div class="stat-box">
      <h3>💬 消息数</h3>
      <div class="value">${stats.totalMessages}</div>
    </div>
    <div class="stat-box">
      <h3>🗑️ 最后清除</h3>
      <div class="value" style="font-size: 16px;">
        ${stats.lastCleared ? new Date(stats.lastCleared).toLocaleTimeString('zh-CN') : '从未'}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>👥 在线用户 (${onlineUsers.size})</h2>
    ${onlineUsers.size === 0 ? '<div style="color: #888;">暂无在线用户</div>' : ''}
    ${Array.from(onlineUsers.values()).map(({ user }) => `
      <div class="user-item">
        ${user.avatar} ${user.nickname} 
        ${user.lat ? `<span class="location">(${user.lat.toFixed(4)}, ${user.lng.toFixed(4)})</span>` : '<span style="color: #ff0000;">(无位置)</span>'}
      </div>
    `).join('')}
  </div>

  <div class="section">
    <h2>🎈 所有气泡 (${activeBubbles.length}/${bubbles.size})</h2>
    ${activeBubbles.length === 0 ? '<div style="color: #888;">暂无气泡</div>' : ''}
    ${activeBubbles.map(b => `
      <div class="bubble-item">
        <div class="title">${b.title}</div>
        <div class="info">
          作者: ${b.author} | 
          类型: ${b.type} | 
          位置: <span class="location">${b.lat.toFixed(4)}, ${b.lng.toFixed(4)}</span><br>
          创建: <span class="time">${new Date(b.createdAt).toLocaleString('zh-CN')}</span> | 
          过期: <span class="time">${new Date(b.expiresAt).toLocaleString('zh-CN')}</span>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="refresh">
    页面每3秒自动刷新 | ${new Date().toLocaleString('zh-CN')}
  </div>

  <script>
    function showMessage(message, isError = false) {
      const elem = document.getElementById('adminMessage');
      elem.textContent = message;
      elem.style.color = isError ? '#ff0000' : '#00ff00';
      setTimeout(() => elem.textContent = '', 3000);
    }
    
    function clearBubbles() {
      const password = document.getElementById('adminPassword').value;
      if (!password) {
        showMessage('请输入管理员密码', true);
        return;
      }
      
      fetch('/api/clearBubbles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: password,
          initiator: '监控大屏管理员'
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showMessage('✅ ' + data.message);
          setTimeout(() => location.reload(), 1000);
        } else {
          showMessage('❌ ' + (data.message || data.error), true);
        }
      })
      .catch(error => {
        showMessage('❌ 请求失败: ' + error.message, true);
      });
    }
    
    function saveBackup() {
      showMessage('💾 备份功能已在服务器端定时执行');
    }
    
    function refreshStats() {
      showMessage('🔄 统计已刷新，页面3秒后自动更新');
    }
  </script>
</body>
</html>
    `;

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

httpServer.listen(3001, "0.0.0.0", () => {
  console.log("✅ 监控大屏(内网): http://127.0.0.1:3001");
  console.log(`✅ 监控大屏(域名代理): https://${PRIMARY_DOMAIN}/admin`);
  console.log("=".repeat(60));
  loadBackup();
});

// 定期清理过期气泡
setInterval(() => {
  const now = Date.now();
  let deleted = 0;
  bubbles.forEach((bubble, id) => {
    if (bubble.expiresAt < now) {
      bubbles.delete(id);
      deleted++;
    }
  });
  if (deleted > 0) {
    console.log(`\n🗑️  清理 ${deleted} 个过期气泡`);
    saveBackup();
  }
}, 60 * 60 * 1000);

// 定期保存备份
setInterval(() => {
  saveBackup();
}, 10 * 60 * 1000);

// 定期统计
setInterval(() => {
  console.log("\n" + "=".repeat(60));
  console.log("📊 系统状态");
  console.log(`   气泡: ${bubbles.size} 个`);
  console.log(`   在线: ${onlineUsers.size} 人`);
  console.log(`   已发布: ${stats.totalPublished} 次`);
  console.log(`   已查询: ${stats.totalQueried} 次`);
  console.log(`   最后清除: ${stats.lastCleared ? new Date(stats.lastCleared).toLocaleString('zh-CN') : '从未'}`);
  console.log("=".repeat(60));
}, 5 * 60 * 1000);

// 优雅关闭
process.on("SIGINT", () => {
  console.log("\n正在保存备份并关闭数据库...");
  saveBackup();
  db.close((err) => {
    if (err) {
      console.error("关闭数据库失败:", err);
    } else {
      console.log("数据库已关闭");
    }
    console.log("服务器已关闭");
    process.exit(0);
  });
});
