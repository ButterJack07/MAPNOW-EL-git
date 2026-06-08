// ==================== ⭐ 全局状态变量（原内联于 index.html） ====================

const APP_VERSION = 'A1.0.3';

// 连接与地图
let socket = null;
let map = null;
let currentUser = null;
let myPosition = null;

// 气泡数据
let bubbles = [];
window.__getBubbles = () => bubbles;
let bubbleMarkers = new Map();
let clusterLookup = new Map();
let preClusterZoomSnap = null;
let preBubbleZoomSnap = null;
let spiderfyState = { clusterId: null, labels: [], lines: [] };
let currentInfoWindow = null;
let currentOpenBubbleId = null;

// 发布相关
let selectedBubbleType = "recommend";
let selectedDuration = 60;
let bubbleImages = [];

// 聊天
let chatMessages = [];
let chatPanelVisible = false;
let unreadCount = 0;
let panelCollapsed = true;
let sentMessageIds = new Set();
let currentChatroomCode = "000000";
let activeTab = 'public';
let tabs = { 'public': { messages: [] } };

// 评论
let currentCommentUniqueId = null;
let currentCommentBubbleId = null;

// 搜索
let searchTimer = null;

// 位置
let locationMode = 'gps';
let manualPosition = null;
let isFromSearchLocation = false;
let gpsPosition = null;
let isLocationEnabled = false;
let gpsWatchId = null;
let visibleRange = 1000;
let lastManualLocationName = '';

// 用户标记
let myMarker = null;
let myRangeCircle = null;
let userMarkers = {};
let userRangeCircles = {};
let onlineUsers = {};
let showOtherUsers = false;
let isGlobalMode = false;

// 气泡清除
let clearBubblesFlag = false;
let clearTimeoutId = null;

// 定时器
let refreshTimer = null;
let longPressTimer = null;
let longPressDuration = 2000;
let currentLongPressMarker = null;

// 用户中心
let userStats = { publishedCount: 0, likesCount: 0, favoritesCount: 0, commentsCount: 0 };
let bubbleInteractions = {};

// 地区选择器（曾错放在 SERVER.js，被 js/region.js 引用）
let currentProvinceId = null;
let selectedProvince = '';
let selectedCity = '';

// 聚合交互抑制标记（bubbleCore.js 与 settings.js 共享）
window._suppressRefresh = false;
