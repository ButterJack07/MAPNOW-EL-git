# 此刻地图 · 设计端

> 记录此刻，分享此地。一款基于地理位置的轻量级实时社交地图应用。
>
> **GitHub**：[ButterJack07/MAPNOW-EL-git](https://github.com/ButterJack07/MAPNOW-EL-git)

## 1. 项目定位

**此刻地图（A1.0）** 是一款 Web 端（同时可打包进 Android WebView）运行的实时地图社交应用。用户可以在地图上发布"气泡"——临时存在、带位置、带主题的图文消息，并可与同区域内的人聊天、加好友、组队。

* **核心形态**：H5 页面 + Node.js WebSocket 后端
* **目标用户**：18-35 岁、喜欢线下探索、需要在陌生地点快速找到同好的人群
* **当前版本**：`A1.0.3`（标题）、`v10.0.1`（功能号，详见 problems.md 中的版本号混乱问题）

## 2. 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | 原生 HTML / CSS / JavaScript（ES5 + 少量 ES6），无构建工具 |
| 地图 SDK | 腾讯地图 JavaScript API v2.exp（key 内置在 `index.html`） |
| 图片裁剪 | Cropper.js 1.6.2（CDN） |
| 后端 | Node.js + `ws` 库（纯 WebSocket，无 Express） |
| 数据库 | SQLite 3（`sqlite3` Node 库，文件型 `users.db`） |
| 监控面板 | 纯 HTML 模板字符串（端口 3001） |
| 部署 | Vercel（前端静态）+ 自建 Node（后端 + WebSocket） |
| 版本控制 | Git + 10 分钟自动提交脚本 `auto-git.bat` |
| 同步 | `sync-android.bat` 同步到 Android Studio 的 assets 目录 |

## 3. 目录结构

```
A1.0/
├── index.html               # 单页入口，所有 UI 都在这里（1752 行）
├── SERVER.js                # Node 后端：WebSocket + HTTP 监控（3997 行）
├── vercel.json              # Vercel 路由：/api/* 代理到后端
├── auto-git.bat             # 每 10 分钟自动 git commit + push
├── sync-android.bat         # 同步前端到 Android assets
├── problems.md              # 已知的架构/安全问题清单
├── todo.md                  # 待办事项
│
├── js/                      # 前端逻辑（25 个文件，按加载顺序）
│   ├── globals.js           # **全局状态变量**（socket/map/currentUser 等，原内联于 index.html）
│   ├── utils.js             # 通用工具：localStorage 缓存、距离计算、ID 生成
│   ├── auth.js              # 登录/注册面板逻辑
│   ├── publish.js           # 发布气泡向导
│   ├── user-center.js       # 个人中心：6 个 Tab（发布/点赞/收藏/评论/历史/搜索）
│   ├── inbox.js             # 收件箱 / 通知
│   ├── theme.js             # 主题切换
│   ├── records.js           # 个人中心各 Tab 数据查询 + 切换
│   ├── region.js            # 地区选择器
│   ├── bubble.js            # 气泡 UI
│   ├── filter.js            # 气泡类型筛选
│   ├── websocket.js         # WebSocket 连接 + 消息路由
│   ├── bubbleCore.js        # 气泡核心：聚合、spiderfy、地图操作
│   ├── chat.js              # 私聊 / 群聊界面
│   ├── viewport-fix.js      # 移动端视口修复
│   ├── back-handler.js      # 安卓返回键处理
│   ├── settings.js          # 设置页（含地区修改等，1780 行）
│   ├── init-extras.js       # 初始化补充
│   ├── tutorial.js          # 新手引导
│   ├── range-core.js        # 范围圈核心
│   ├── range-panel.js       # 范围圈面板 UI
│   ├── userMarker.js        # 其他用户位置标记
│   ├── mapCore.js           # 地图初始化
│   ├── init.js              # window.onload 入口
│   └── uiControl.js         # 通用 UI 控件
│
├── css/                     # 样式（17 个文件，按面板拆分）
│   ├── styles.css           # 全局样式
│   ├── panel-*.css          # 各功能面板样式
│   ├── theme-*.css          # 主题相关
│   ├── chat.css             # 聊天界面
│   └── floating-nav.css     # 浮动导航
│
└── 已清理
    └── src/panels/          # 已删除，无引用
```

## 4. 数据库设计

后端使用 SQLite，所有表在 `SERVER.js:37` 的 `initDatabase()` 中创建（`CREATE TABLE IF NOT EXISTS`）。

| 表 | 用途 | 关键字段 |
| --- | --- | --- |
| `users` | 用户基本信息 | id, phone(唯一), username, password(**明文**), avatar, region, is_vip, vip_expire_time |
| `bubbles` | 气泡（地理位置消息） | id, author_id, type, title, content, lat, lng, expires_at, is_active |
| `user_stats` | 用户统计（发布/点赞/收藏/评论数） | user_id, published_count, likes_count... |
| `bubble_likes` | 点赞关系 | bubble_id, user_id |
| `bubble_favorites` | 收藏关系 | bubble_id, user_id |
| `bubble_comments` | 评论 | bubble_id, user_id, content |
| `bubble_views` | 浏览历史（用于"历史浏览"Tab） | bubble_id, user_id, viewed_at |
| `notifications` | 系统通知 | user_id, type, is_read |
| `private_messages` | 私聊消息 | from_id, to_id, content, created_at |
| `friend_requests` | 好友申请 | from_id, to_id, status |
| `friends` | 好友关系 | user_a_id, user_b_id |
| `chat_groups` | 群聊 | name, owner_id |
| `group_members` | 群成员 | group_id, user_id |
| `group_messages` | 群消息 | group_id, user_id, content |

> ⚠️ **安全提示**（见 problems.md）：`password` 字段明文存储，管理员密码 `admin123` 硬编码在 `SERVER.js:577`，需尽快改造。

## 5. WebSocket 消息协议

前后端通过 WebSocket 通信（端口未在 SERVER.js 中显式监听，依赖部署平台转发）。客户端 `socket.send(JSON.stringify({ type: "xxx", ... }))`，服务端 `data.type === "xxx"` 分发。

消息类型分类（**共计 60+ 种**，详见 SERVER.js 1219-3770 行）：

### 认证 / 用户
* `register` / `authLogin` / `login` — 注册与登录
* `queryUserByIdOrPhone` — 按 ID 或手机号查用户
* `getUserFullInfo` / `getUserCenterData` — 拉取用户完整信息
* `updateUserInfo` / `updateAvatar` — 修改资料
* `queryVipStatus` / `activateVip` — VIP 状态

### 气泡
* `publishBubble` / `updateBubble` — 发布 / 修改气泡
* `queryBubbles` — 按位置查附近气泡
* `queryBubbleInteraction` — 查气泡的点赞/收藏/评论状态
* `likeBubble` / `favoriteBubble` / `commentBubble` — 互动
* `queryBubbleComments` — 评论列表

### 个人中心
* `getUserCenterData` — **一次性拉取** 个人中心所有数据（用户信息 + 统计 + 发布列表 + 收件箱 + VIP）
* `queryUserStats` / `queryUserPublished` / `queryUserLikes` / `queryUserFavorites` / `queryUserComments` / `queryUserViews` — 独立查询
* `searchRecords` — 个人中心内搜索
* `deleteRecords` — 删除记录

### 通知 / 私聊 / 群组
* `queryInboxUnread` / `queryNotificationsByType` / `markNotificationRead`
* `sendPrivateMessage` / `queryPrivateChats` / `queryPrivateMessages` / `queryPrivateUnreadCount`
* `sendFriendRequest` / `acceptFriendRequest` / `rejectFriendRequest` / `queryFriends` / `queryFriendRequests`
* `createGroup` / `queryMyGroups` / `queryGroupMembers` / `sendGroupMessage` / `queryGroupMessages` 等

### 位置 / 通讯
* `position` — 上报位置
* `publicChat` / `chatroomMsg` — 公屏与聊天室
* `privateChat` — 私聊

### 地点服务
* `getProvinces` / `getCitiesByProvince` / `searchCities` — 行政区
* `searchPlaces` / `reverseGeocode` — 关键词搜索 / 逆地理编码

### 管理
* `adminCommand` / `clearBubbles` — 管理员指令

## 6. 启动与运行

### 6.1 本地开发

```bash
# 安装依赖
npm init -y
npm install ws sqlite3

# 启动后端（WebSocket 端口 3000 + 监控大屏 3001）
node SERVER.js

# 前端：直接用浏览器打开 index.html
# 或本地起一个静态服务器
npx serve .
```

### 6.2 调试模式

```bash
# 开启详细日志（默认关闭，抑制高频 console.log）
DEBUG_WS=1 node SERVER.js

# PM2 模式
DEBUG_WS=1 pm2 restart SERVER
```

开启 `DEBUG_WS=1` 后，下面这些高频日志才会输出：
* `📨 收到消息 [类型: xxx] 来自: xxx`
* `📍 xxx: 经纬度 (范围)`
* `🔍 查询气泡: xxx 找到 x 个`
* `📊 查询统计数据` / `📊 查询发布记录`
* `📨 收件箱未读: xxx`
* `📍 后端逆地理编码`

### 6.3 本地全栈部署（前后端一体）

将项目在本地跑通（前端访问本地 Node 后端，而非远程服务器）需要修改以下两处：

#### 修改 `js/websocket.js`

**第 19 行** — WebSocket 连接的目标地址：

```diff
- const SERVER_IP = '121.199.161.5';  // 服务器外网IP
+ const SERVER_IP = 'localhost';      // 本地部署改为 localhost
```

**第 24–27 行** — 本地环境不再跳转到外网：

```diff
- if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
-     // 本地开发环境 - 使用服务器外网IP
-     host = SERVER_IP;
-     console.log("📍 本地环境，连接到外网服务器:", host);
- } else if (hostname === SERVER_IP) {
+ if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '' || hostname === SERVER_IP) {
+     host = SERVER_IP;
+     console.log("📍 本地模式，连接到:", host);
```

> **注意**：前端加载腾讯地图 SDK 需要公网环境。如果本地开发需要地图显示，必须**保持电脑联网**（SDK 从 `https://map.qq.com/api/js` 加载）。

#### 修改 `vercel.json`

Vercel 部署时为云环境，本地全栈部署**不需要 `vercel.json`**。但如果你用 `npx serve .` 启动前端静态文件，需要在 `SERVER.js` 中确认 WebSocket 监听端口：

```bash
# 启动后端（端口 3000）
node SERVER.js

# 另开终端，启动前端静态服务（端口 5500 或其他）
npx serve . -p 5500
```

然后浏览器访问 `http://localhost:5500/index.html`。

#### 验证本地连通

1. 终端 1：`node SERVER.js`  → 看到 `✅ 服务器已启动，WebSocket 端口: 3000`
2. 终端 2：`npx serve . -p 5500` → 看到 `Accepting connections at http://localhost:5500`
3. 浏览器打开 `http://localhost:5500/index.html` → 右上角状态显示 ✅ 已连接
4. 如果能注册/登录、地图加载、气泡显示，说明前后端联通正常

#### 已知本地限制

| 限制 | 原因 | 对策 |
| --- | --- | --- |
| 腾讯地图 SDK 必须在联网环境加载 | SDK 从 CDN 加载 | 开发时保持联网 |
| WebSocket 默认端口 3000 可能被占用 | 其他进程占用 | `taskkill /F /PID <pid>` 或修改 `:3000` |
| 地址搜索（searchPlaces）依赖外网 | 后端调用第三方 API | 本地开发时搜索可能无效，`register`/`login`/`气泡`不受影响 |
| 数据库文件 `users.db` 与 `SERVER.js` 同目录 | SQLite 文件写入 | `gitignore` 建议忽略 `users.db` |

### 6.4 部署

* **前端静态文件**：部署到 Vercel（`vercel.json` 把 `/api/*` 代理到后端 `http://121.199.161.5:3000`）
* **后端 + WebSocket**：部署到 `121.199.161.5:3000`（自建）
* **监控大屏**：`http://<server>:3001/` 提供清除气泡、强制下线按钮
* **Android 端**：`sync-android.bat` 同步 `index.html` + `css/` + `js/` 到 `AndroidStudioProjects/MomentMap/app/src/main/assets/`

## 7. 关键功能模块

### 7.1 地图与气泡
* 基于腾讯地图 SDK
* 气泡支持 8 种类型（推荐、求助、出租、拼车、活动、约饭、其他等）
* 用户可设置持续时长（默认 60 分钟）
* 附近气泡按距离聚合显示（`bubbleCore.js`）
* 点击聚合点 spiderfy 展开

### 7.2 个人中心（6 个 Tab）
* **我的发布** — 列出本人发布的所有气泡
* **我的点赞** — 点赞过的气泡
* **我的收藏** — 收藏的气泡
* **我的评论** — 评论记录
* **历史浏览** — 浏览过的气泡
* **气泡搜索** — 在个人中心内搜索

打开时一次性 `getUserCenterData` 拉取核心数据，切换 Tab 时单独刷新对应列表（已带缓存）。

### 7.3 收件箱
* 4 类未读通知：点赞、收藏、评论、好友申请
* 角标实时显示在 Tab 与顶部入口

### 7.4 VIP 系统
* 支持 `month` / `year` / `lifetime` 三种类型
* 激活后服务端写 `is_vip` 与 `vip_expire_time`

### 7.5 私聊与群聊
* 一对一私聊（消息表 `private_messages`）
* 创建群、邀请成员、群消息广播（`chat_groups` + `group_members` + `group_messages`）

### 7.6 好友
* 发起申请 → 接受 / 拒绝 → 进入好友列表
* 双向确认

### 7.7 监控大屏
访问 `http://<server>:3001/`：
* 实时统计：气泡数、在线人数、累计发布、累计查询
* 在线用户列表
* **清除所有气泡**（POST `/api/clearBubbles`）
* **强制所有用户下线**（POST `/api/forceLogoutAll`）

## 8. 已知问题与改进方向

> 摘自 `problems.md`

### 8.1 架构
* ~~`index.html` 内联 `<script>` 残留 ~110 行全局变量声明~~ ✅ 已移至 `js/globals.js`
* ~~`SERVER.js:688-1021` 含纯前端 DOM 代码（`document.createElement`、`editRegion` 等），在 Node 环境下崩溃~~ ✅ 已删除，`js/region.js` 已有完整实现
* `src/panels/settings.js` 拆分残留（已清理）

### 8.2 安全
* 密码明文存储与比对 → 应改 bcrypt
* 腾讯地图 API Key 明文写在 `index.html` → 域名白名单限制
* 管理员密码 `admin123` 硬编码 → 配置文件 + 环境变量
* 模板字符串拼接用户输入到 HTML → XSS 风险，必须用 `textContent` 或转义

### 8.3 代码冗余
* `calculateDistance` 在 `js/utils.js` 与 `SERVER.js` 重复定义
* CSS 拆 17 个文件，命名风格不统一
* 版本号在标题 / 关于弹窗 / 内联脚本处不一致

### 8.4 前后端职责
* 后端无 HTTP 静态文件服务，部署依赖 Vercel
* `SERVER.js` 缺乏路由层，所有消息走一个 switch

## 9. 后续路线图

参见 `todo.md`：
* 【安全】密码管理（bcrypt 迁移）
* 【多功能】图片上传（头像 / 气泡配图）
* 【功能修复】发起私聊、Marker 展示异常
* 【后端】清理失效数据策略

## 10. 维护提示

* 修改全局状态变量时，**先看 `js/globals.js`** —— 那里集中声明了 `socket` / `map` / `currentUser` / `bubbles` 等，所有 `js/*.js` 文件共享这些变量。
* 修改气泡类型或时长时，**同步修改 `js/publish.js` 的类型定义和 `SERVER.js:65` 的字段约束**。
* 修改个人中心协议时，**保持 `getUserCenterData`（一次拉取）和 6 个独立查询双轨兼容**，前端已用缓存策略平滑切换。
* 调试时务必先 `DEBUG_WS=1`，否则日志被静默。
* 监控大屏 3001 端口**不要暴露到公网**，包含管理员级操作。

## 11. License

私有项目，未指定开源协议。
