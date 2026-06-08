# 此刻地图

> 记录此刻，分享此地。一款基于地理位置的轻量级实时社交地图应用。
>
> 南京大学 EL 程序设计大赛参赛作品
>
> **GitHub**：[ButterJack07/MAPNOW-EL-git](https://github.com/ButterJack07/MAPNOW-EL-git)

---

## 1. 项目简介

### 1.1 产品定位

**此刻地图** 是一款基于地理位置的实时社交工具。它以"地图"为界面、以"气泡"为语言——用户可以在当前位置发布即时信息（求助、组队、推荐、避雷、见闻、建群），同一时空下附近的人几秒内即可看到并回应。

面向的场景是 **"你已经在线下现场"** 之后的那段时间——音乐节、漫展、商圈、校园活动、citywalk——任何需要即时连接附近陌生人的场合。

* **核心形态**：H5 页面 + Node.js WebSocket 后端
* **目标用户**：18-35 岁、喜欢线下探索、需要在陌生地点快速找到同好的人群
* **当前版本**：`A1.0.3`（EL 大赛参赛版本）

### 1.2 设计理念

- **「此刻即响应」** — WebSocket 全双工长连接，气泡/消息推送延迟秒级；以地理围栏 + 时效性作为信息分发基础
- **「地图即界面，气泡即语言」** — 4 步完成发布，浏览信息像看地图标注一样简单

### 1.3 与现有工具的差别

- **小红书 / 微博** → 过去式攻略，无法满足"此刻"需求
- **微信群 / QQ群** → 信息易淹没，建群流程繁琐，无法匹配"此地的"用户
- **高德 / 大众点评** → 静态地点信息，缺少现场动态与同好连接
- **此刻地图** → 信息按地理位置锚定在地图上，时效性强，一键可聊

---

## 2. 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | 原生 HTML / CSS / JavaScript（无框架，无构建工具） |
| 地图 | 腾讯地图 JavaScript API v2.exp |
| 图片裁剪 | Cropper.js 1.6.2（CDN） |
| 后端 | Node.js + `ws` 库（纯 WebSocket，无 HTTP 框架） |
| 数据库 | SQLite 3（`sqlite3`，文件型 `users.db`） |
| 监控面板 | 纯 HTML 模板字符串（端口 3001） |
| 部署 | Vercel（前端静态）+ 自建 Node 服务器（后端） |
| Android | Android Studio WebView 嵌入，`sync-android.bat` 同步 |
| 小程序 | 计划中 |
| 版本控制 | Git + 10 分钟自动提交脚本 `auto-git.bat` |

---

## 3. 目录结构

```
A1.0/
├── index.html               # 单页入口（≈1750 行）
├── SERVER.js                # Node 后端：WebSocket + HTTP 监控（≈4000 行）
├── vercel.json              # Vercel 路由代理配置
├── LICENSE                  # MIT 协议
├── intro.md                 # 项目概述文档
├── problems.md              # 已知的架构/安全问题清单
├── todo.md                  # 待办事项
├── 商业计划.md              # 商业计划书
│
├── js/                      # 前端逻辑（25 个文件，按加载顺序）
│   ├── globals.js           # 全局状态变量（原内联于 index.html）
│   ├── utils.js             # 通用工具：localStorage 缓存、距离计算、ID 生成
│   ├── auth.js              # 登录/注册面板逻辑
│   ├── publish.js           # 发布气泡向导
│   ├── user-center.js       # 个人中心：6 个 Tab
│   ├── inbox.js             # 收件箱 / 通知
│   ├── theme.js             # 主题切换
│   ├── records.js           # 个人中心各 Tab 数据查询 + 切换
│   ├── region.js            # 地区选择器
│   ├── bubble.js            # 气泡 UI
│   ├── filter.js            # 气泡类型筛选
│   ├── websocket.js         # WebSocket 连接 + 消息路由
│   ├── bubbleCore.js        # 气泡核心：聚合、spiderfy、地图重绘
│   ├── chat.js              # 私聊 / 群聊界面
│   ├── viewport-fix.js      # 移动端视口修复
│   ├── back-handler.js      # 安卓返回键处理
│   ├── settings.js          # 设置页面
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
├── auto-git.bat             # 每 10 分钟自动 git commit + push
└── sync-android.bat         # 同步前端到 Android Studio assets
```

---

## 4. 数据库设计

后端使用 SQLite，所有表在 `SERVER.js` 的 `initDatabase()` 中创建（`CREATE TABLE IF NOT EXISTS`）。

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

> ⚠️ **安全提示**（见 problems.md）：`password` 字段明文存储，管理员密码 `admin123` 硬编码在 `SERVER.js`，需尽快改造。

---

## 5. WebSocket 消息协议

前后端通过 WebSocket 通信（端口 3000）。客户端 `socket.send(JSON.stringify({ type: "xxx", ... }))`，服务端按 `data.type` 分发。

消息类型分类（**共计 60+ 种**，详见 SERVER.js）：

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
* `getUserCenterData` — **一次性拉取** 个人中心所有数据
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

---

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

将项目在本地跑通需要修改 `js/websocket.js`：

**第 19 行** — WebSocket 连接的目标地址：

```diff
- const SERVER_IP = '121.199.161.5';  // 服务器外网IP
+ const SERVER_IP = 'localhost';      // 本地部署改为 localhost
```

**第 24–27 行** — 本地环境不再跳转到外网：

```diff
- if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
-     host = SERVER_IP;
- } else if (hostname === SERVER_IP) {
+ if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '' || hostname === SERVER_IP) {
+     host = SERVER_IP;
```

> **注意**：腾讯地图 SDK 需要联网加载（`https://map.qq.com/api/js`），本地开发需保持联网。

```bash
# 启动后端（端口 3000）
node SERVER.js

# 另开终端，启动前端静态服务（端口 5500 或其他）
npx serve . -p 5500
```

浏览器访问 `http://localhost:5500/index.html`，右上角状态显示 ✅ 已连接即表示前后端联通正常。

#### 已知本地限制

| 限制 | 原因 | 对策 |
| --- | --- | --- |
| 腾讯地图 SDK 必须在联网环境加载 | SDK 从 CDN 加载 | 开发时保持联网 |
| WebSocket 默认端口 3000 可能被占用 | 其他进程占用 | `taskkill /F /PID <pid>` 或修改端口 |
| 地址搜索依赖外网 | 后端调用第三方 API | 本地开发搜索可能无效，不影响登录/气泡 |
| 数据库文件 `users.db` 与 `SERVER.js` 同目录 | SQLite 文件写入 | `gitignore` 建议忽略 `users.db` |

### 6.4 部署

* **前端静态文件**：部署到 Vercel（`vercel.json` 把 `/api/*` 代理到后端 `http://121.199.161.5:3000`）
* **后端 + WebSocket**：部署到 `121.199.161.5:3000`（自建）
* **监控大屏**：`http://<server>:3001/` 提供清除气泡、强制下线按钮
* **Android 端**：`sync-android.bat` 同步到 `AndroidStudioProjects/MomentMap/app/src/main/assets/`

---

## 7. 功能模块

### 7.1 已完成功能

| 模块 | 功能 | 状态 |
| --- | --- | --- |
| **地图** | 腾讯地图 SDK 渲染，支持缩放/平移/倾斜 | ✅ |
| | 3 种定位模式：GPS、搜索定位 | ✅ |
| | 6 档可见范围（100m / 500m / 1km / 2km / 3km / 4km） | ✅ |
| | 范围圈可视化（圆圈实时显示可见边界） | ✅ |
| | 显示附近用户（可开关，含互相可见性校验） | ✅ |
| **气泡** | 6 种类型：求助/组队/建群/推荐/避雷/见闻 | ✅ |
| | 按距离聚合与 spiderfy 展开 | ✅ |
| | 自定义有效期（15/30/60/120 分钟） | ✅ |
| | 公开/私密气泡（私密永久保存） | ✅ |
| | 发气泡配图（最多 1 张） | ✅ |
| | 气泡互动：点赞/收藏/评论 | ✅ |
| | 气泡编辑与删除 | ✅ |
| | 气泡浏览记录 | ✅ |
| **建群** | 建群气泡 = 聊天室入口，一键进入无需加好友 | ✅ |
| | 24h 自清理（≤2 人自动解散） | ✅ |
| **社交** | 私聊（从气泡发起 / 从好友列表发起） | ✅ |
| | 好友系统：添加/接受/拒绝/搜索用户 | ✅ |
| | 群聊：创建/邀请/踢人/退出/解散 | ✅ |
| **用户** | 注册/登录（手机号+密码） | ✅ |
| | 个人中心 6 Tab（发布/点赞/收藏/评论/历史/搜索） | ✅ |
| | 6 种状态标识（空闲可约/正在路上/活动ing/乐于助人/寻找同伴/暂时勿扰） | ✅ |
| | 头像更换（Emoji 选择 + 图片上传 + 裁剪） | ✅ |
| | 个人资料修改（昵称/性别/生日/地区/简介） | ✅ |
| | 收件箱（未读通知：点赞/收藏/评论/好友申请） | ✅ |
| **设置** | 主题切换（5 种）：清新灰/深邃紫/海洋蓝/青春绿/温暖黄 | ✅ |
| | 隐私设置（显示附近用户开关） | ✅ |
| | 修改密码 | ✅ |
| **VIP** | 月卡（¥1.8）/ 年卡（¥8.8）/ 终身（¥18.8） | ✅ |
| | 自定义气泡时长（VIP 专属） | ✅ |
| **引导** | 新手引导教程（注册后首次登录自动弹出） | ✅ |
| **监控** | 管理后台（端口 3001）：在线人数/气泡统计/清除气泡/强制下线 | ✅ |

### 7.2 进行中 / 待完成

| 功能 | 优先级 | 说明 |
| --- | --- | --- |
| 密码 bcrypt 加密 | 🔴 高 | 当前明文存储，需改为哈希存储 |
| 服务器稳定性优化 | 🔴 高 | 部署环境不稳定，网页端已暂关联网访问 |
| API Key 安全 | 🔴 高 | 腾讯地图 Key 明文在 HTML 中，需域名白名单限制 |
| 管理员密码可配置 | 🟡 中 | 硬编码 `admin123`，应改为环境变量 |
| 后端清理失效数据 | 🟡 中 | 过期气泡定时清理策略 |
| 图片上传优化 | 🟡 中 | 后端存储 / CDN 集成 |
| 小程序端 | 🟢 低 | 已列入计划，待开发 |
| 多图片支持 | 🟢 低 | 当前限制 1 张 |

### 7.3 已修复的问题

| 问题 | 修复内容 |
| --- | --- |
| index.html 内联全局变量 | 已迁移至 `js/globals.js` |
| SERVER.js 含前端 DOM 代码 | 已删除，`js/region.js` 有完整实现 |
| 地区选择设置失败 | `selectSearchResult` 补全 `updateUserInfo` 调用 |
| 地图缩放气泡位置不准确 | 改用地图容器实际尺寸、去除 `transition: all`、`requestAnimationFrame` 平滑刷新 |
| src/panels/settings.js 残留 | 已清理 |

---

## 8. 进度概览

### 8.1 版本迭代

| 阶段 | 时间 | 内容 |
| --- | --- | --- |
| 原型开发 | 第 1-2 月 | 地图渲染、基础气泡发布/浏览、附近范围查询 |
| 功能扩展 | 第 3-4 月 | 社交系统（私聊/好友/群聊）、个人中心 6 Tab、建群机制、VIP 系统 |
| 打磨提交 | 第 5-6 月 | UI 完善（5 套主题）、新手引导、稳定性修复、Android 打包、文档 |

### 8.2 整体完成度

```
地图渲染    ████████████ 100%
气泡系统    ████████████ 100%
社交系统    ████████████ 100%
用户中心    ████████████ 100%
建群机制    ████████████ 100%
设置/主题   ████████████ 100%
VIP 系统    ████████████ 100%
Android 端  ██████████░░  80%
后端架构    ██████████░░  85%
安全修复    ████████░░░░  70%
小程序端    ██░░░░░░░░░░  10%
```

### 8.3 用户情况

- 当前阶段：**少量内测用户**
- 访问渠道：Android 安装包 + 网页端（momentmap.top，因服务器不稳定暂关联网）
- 现有服务器：`121.199.161.5:3000`（WebSocket）+ `:3001`（监控面板）

---

## 9. 人员分工

| 角色 | 人员 | 贡献 |
| --- | --- | --- |
| **全栈开发** | ButterJack | 前端 UI/交互、地图集成、后端 WebSocket/SQLite、数据库设计、部署运维、文档 |

单人独立完成全部代码、设计、部署工作。

| 领域 | 具体工作 |
| --- | --- |
| **前端** | HTML/CSS 整体页面架构、地图交互、气泡系统、社交面板、个人中心 6 Tab、主题切换、设置 |
| **后端** | Node.js WebSocket 服务（≈4000 行）、SQLite 数据库（14 张表）、60+ 消息协议、管理监控面板 |
| **设计** | UI 风格设计（5 套主题）、交互流程设计、气泡/聚合/动画样式 |
| **部署** | Vercel 前端托管、自建 Node 后端（121.199.161.5）、Android WebView 打包同步 |
| **文档** | README / USER_GUIDE / 商业计划 / intro |

---

## 10. 已知问题与改进方向

> 摘自 `problems.md`

### 10.1 架构
* ~~`index.html` 内联 `<script>` 残留 ~110 行全局变量声明~~ ✅ 已移至 `js/globals.js`
* ~~`SERVER.js:688-1021` 含纯前端 DOM 代码~~ ✅ 已删除，`js/region.js` 已有完整实现
* `src/panels/settings.js` 拆分残留（已清理）

### 10.2 安全
* 密码明文存储与比对 → 应改 bcrypt
* 腾讯地图 API Key 明文写在 `index.html` → 域名白名单限制
* 管理员密码 `admin123` 硬编码 → 配置文件 + 环境变量
* 模板字符串拼接用户输入到 HTML → XSS 风险

### 10.3 代码冗余
* `calculateDistance` 在 `js/utils.js` 与 `SERVER.js` 重复定义
* CSS 拆 17 个文件，命名风格不统一
* 版本号在标题 / 关于弹窗 / 内联脚本处不一致

### 10.4 前后端职责
* 后端无 HTTP 静态文件服务，部署依赖 Vercel
* `SERVER.js` 缺乏路由层，所有消息走一个 switch

---

## 11. 后续路线图

参见 `todo.md`：
* 【安全】密码管理（bcrypt 迁移）
* 【多功能】图片上传（头像 / 气泡配图）
* 【功能修复】发起私聊、Marker 展示异常
* 【后端】清理失效数据策略
* 【小程序】微信小程序端开发

---

## 12. 维护提示

* 修改全局状态变量时，**先看 `js/globals.js`** —— 那里集中声明了 `socket` / `map` / `currentUser` / `bubbles` 等，所有 `js/*.js` 文件共享这些变量。
* 修改气泡类型或时长时，**同步修改 `js/publish.js` 的类型定义和 `SERVER.js` 的字段约束**。
* 修改个人中心协议时，**保持 `getUserCenterData`（一次拉取）和 6 个独立查询双轨兼容**，前端已用缓存策略平滑切换。
* 调试时务必先 `DEBUG_WS=1`，否则日志被静默。
* 监控大屏 3001 端口**不要暴露到公网**，包含管理员级操作。

---

## 13. License

MIT License — 详见 [LICENSE](LICENSE)。

Copyright © 2025 ButterJack
