
    // ==================== WebSocket 连接 ====================
    /**
     * 建立与服务端的 WebSocket 长连接
     * 连接断开时自动重连；处理身份验证、消息分发
     */
// ==================== WebSocket 连接 ====================
// ==================== WebSocket 连接 ====================
function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("✅ WebSocket 已连接");
        return;
    }

    // 动态构建 WebSocket URL
    // ⭐ 重要：强制使用 ws:// 协议，因为后端不支持 wss://
    const protocol = 'ws:';  // 强制使用 ws://，不使用 wss://
    const hostname = window.location.hostname;
    const SERVER_IP = '121.199.161.5';  // 服务器外网IP
    
    // 修复：在服务器上访问时，使用服务器外网IP
    let host;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
        // 本地开发环境 - 使用服务器外网IP
        host = SERVER_IP;
        console.log("📍 本地环境，连接到外网服务器:", host);
    } else if (hostname === SERVER_IP) {
        // 通过外网IP访问 - 直接使用这个IP
        host = SERVER_IP;
        console.log("📍 通过外网IP访问，使用相同IP连接");
    } else {
        // 其他情况（如域名）- 使用当前hostname
        host = hostname;
        console.log("📍 使用当前hostname连接:", host);
    }
    
    const WS_URL = `${protocol}//${host}:3000`;
    
    console.log("🔌 连接服务器:", WS_URL);
    
    try {
        socket = new WebSocket(WS_URL);
        
        socket.onopen = () => {
            console.log("✅ WebSocket 连接成功");
            updateConnectionStatus("✅ 已连接");
            
            // 只在已登录的情况下发送位置信息
            if (currentUser && currentUser.id) {
                sendLogin();
                sendPositionToServer();
                // 登录成功后请求附近气泡
                setTimeout(() => {
                    requestNearbyBubbles();
                }, 500);
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (error) {
                console.error("❌ 消息解析失败:", error);
            }
        };

        socket.onclose = () => {
            console.log("📡 连接已关闭");
            updateConnectionStatus("❌ 连接断开");
            
            // 3秒后重连
            setTimeout(() => {
                if (currentUser) {
                    console.log("🔄 尝试重新连接...");
                    connectWebSocket();
                }
            }, 3000);
        };

        socket.onerror = (error) => {
            console.error("❌ WebSocket错误:", error);
            updateConnectionStatus("❌ 连接错误");
        };
        
    } catch (error) {
        console.error("❌ 创建WebSocket失败:", error);
    }
}

    function updateConnectionStatus(status) {
        const element = document.getElementById('connectionStatus');
        if (element) element.textContent = status;
    }


    function sendLogin() {
        if (!socket || socket.readyState !== WebSocket.OPEN || !currentUser) return;

        // 确保有位置信息
        if (!myPosition) {
            myPosition = { lat: 31.28, lng: 121.50 }; // 默认上海位置
        }
            
        // 确保有范围信息
        if (!visibleRange) {
            visibleRange = 1000; // 默认1000米
        }
            
        socket.send(JSON.stringify({
            type: 'login',
            userId: currentUser.id,
            nickname: currentUser.nickname,
            avatar: currentUser.avatar || '👤',
            lat: myPosition.lat,
            lng: myPosition.lng,
            range: visibleRange,
            invisible: (userStats.status === 6)
        }));
            
        console.log("📤 发送登录信息:", currentUser.nickname, "范围:", visibleRange + "米");
    }
        
    function sendPositionToServer() {
        if (!socket || socket.readyState !== WebSocket.OPEN || !currentUser) return;
            
        // 确保有位置信息
        if (!myPosition) {
            console.log("⚠️ 无位置信息，使用默认位置");
            myPosition = { lat: 31.28, lng: 121.50 };
        }
            
        // 暂时勿扰时不上报位置（避免服务端广播我的坐标）
        if (userStats.status === 6) {
            console.log('🔕 暂时勿扰：跳过位置上报');
            return;
        }

        socket.send(JSON.stringify({
            type: 'position',
            lat: myPosition.lat,
            lng: myPosition.lng,
            userId: currentUser.id,
            nickname: currentUser.nickname,
            avatar: currentUser.avatar || '👤',
            range: visibleRange
        }));
            
        console.log("📍 发送位置信息:", myPosition, "范围:", visibleRange + "米");
    }

    function requestNearbyBubbles() {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error("❌ WebSocket 未连接，无法请求气泡");
            return;
        }
            
        if (!myPosition) {
            console.error("❌ 无位置信息，无法请求气泡");
            return;
        }
            
        // ✅ 使用 queryBubbles 并发送位置和半径
        const requestData = {
            type: "queryBubbles",
            lat: myPosition.lat,
            lng: myPosition.lng,
            radius: visibleRange || 1000  // 使用可见范围
        };
            
        socket.send(JSON.stringify(requestData));
            
        console.log(`📡 [${new Date().toLocaleTimeString()}] 请求附近气泡`, {
            纬度: myPosition.lat.toFixed(6),
            经度: myPosition.lng.toFixed(6),
            半径: visibleRange || 1000,
            当前气泡数: bubbles.length,
            地图标记数: bubbleMarkers.size
        });
    }


    // ==================== 消息处理 ====================
    function handleServerMessage(data) {
        console.log("📨 收到服务器消息:", data.type, data);

        switch (data.type) {
            case "registerResponse":
                // 处理注册响应
                if (data.success) {
                    showAuthMessage(data.message || '注册成功！', 'success');
                    setTimeout(() => {
                        switchAuthMode('login');
                        // 自动填充登录信息
                        document.getElementById('loginId').value = data.user.id;
                        // 标记首次注册后登录要显示新手教程
                        try { localStorage.setItem('showTutorialOnFirstLogin', '1'); } catch (e) {}
                    }, 1500);
                } else {
                    showAuthMessage(data.message || '注册失败', 'error');
                }
                break;
        // 在 handleServerMessage 函数的 switch 语句中添加

    case "userFullInfo":
        console.log("📦 收到完整用户信息:", data.user);

        // 更新 currentUser 对象
        if (currentUser) {
            currentUser = {
                ...currentUser,
                id: data.user.id,
                phone: data.user.phone,
                username: data.user.username,
                nickname: data.user.username,
                avatar: data.user.avatar || '👤',
                gender: data.user.gender || '保密',
                birthday: data.user.birthday || '',
                region: data.user.region || '未设置',
                bio: data.user.bio || '',
                background: data.user.background || '#667eea',
                theme: data.user.theme || 'light',
                isVip: data.user.is_vip ? true : false,
                vipExpireTime: data.user.vip_expire_time || 0,
                vipType: data.user.vip_type || 'none'
            };
            
            // ✅ 更新头像显示
            updateAvatarDisplay(currentUser.avatar);
            
            // ⭐ v9.6.6: 更新性别、年龄、地区、简介显示
            updateUserDetails();
            
            // ⭐ 关键：收到完整用户信息后，查询发布记录
            if (document.getElementById('userCenterOverlay').style.display === 'block') {
                console.log("📤 用户中心已打开，查询发布记录...");
                queryUserPublished();
            }
        }

        // 重新加载设置页面显示
        loadUserSettings();
        break;



            // ⭐ 新增：登录界面用户信息查询结果

            case "loginSuccess":
                // 认证登录成功
                if (data.message) {
                    showAuthMessage(data.message, 'success');
                }
                // 设置当前用户
                currentUser = {
                    id: data.user.id,
                    nickname: data.user.nickname,
                    phone: data.user.phone,
                    avatar: data.user.avatar
                };
                    
                // ⭐ v9.4.3: 保存登录信息（如果勾选了记住密码或自动登录）
                const loginId = document.getElementById('loginId').value.trim();
                const password = document.getElementById('loginPassword').value;
                saveLoginInfo(loginId, password);
                    
                // 隐藏登录界面
                setTimeout(() => {
                    hideAuthOverlay();
                    handleLoginSuccess(data.user);
                }, 1000);
                break;
                    
            case "loginFailed":
                // 登录失败
                showAuthMessage(data.message || '登录失败', 'error');
                break;
                    
            case "onlineCount":
                updateOnlineCount(data.count);
                break;
                    
            case "newBubble": {
                const _b = data.bubble;
                if (!_b) break;
                if (myPosition && _b.lat && _b.lng) {
                    const _d = calculateDistance(myPosition.lat, myPosition.lng, _b.lat, _b.lng);
                    const _r = visibleRange || 1000;
                    if (_d > _r) {
                        console.log(`📡 [newBubble] 超出局域范围 ${_d.toFixed(0)}m > ${_r}m，不显示: ${_b.title}`);
                        break; // 不在范围内，忽略广播
                    }
                }
                console.log('🎈 收到新气泡（在局域范围内）:', _b.title);
                addBubble(_b, true); // 已检查过距离，跳过 addBubble 内部重复检查
                break;
            }
                    
            case "queryResult":
                // ⭐ 全量同步：用服务器结果替换所有本地气泡
                console.log("🔍 收到气泡查询结果:", data.bubbles.length, "个气泡");
                syncBubblesFromServer(data.bubbles || []);
                break;
                    
            case "nearbyBubbles":
                console.log(`📦 收到附近气泡: ${data.bubbles.length} 个`);
                syncBubblesFromServer(data.bubbles || []);
                break;
                    
            case "publicChat":
                console.log("💬 收到服务器广播的聊天消息:", data.from, data.msg);
                    
                // 检查是否是自己的消息
                const isMyMessage = currentUser && 
                    (data.fromId === currentUser.id || data.from === currentUser.nickname);
                    
                // 如果是自己的消息，并且我们已经本地显示过了，就跳过
                if (isMyMessage && data.messageId && sentMessageIds.has(data.messageId)) {
                    console.log("⏭️ 跳过自己消息的回声:", data.messageId);
                    return;
                }
                    
                // 添加消息到列表
                addChatMessage({
                    from: data.from,
                    avatar: data.avatar,
                    text: data.msg,
                    time: data.time,
                    isMyMessage: isMyMessage,  // 如果是自己的消息，标记为true
                    id: data.messageId
                });
                break;
                    
            case "userPosition":
                console.log(`📍 收到用户位置广播: ${data.nickname}, 范围: ${data.range || 1000}米`);
                updateOtherUserPosition(data);
                break;
                    
            case "onlineUsers":
                // 更新在线用户列表
                updateOnlineUsersList(data.users);
                break;
                    
            case "clearBubblesResponse":
                console.log("✅ 服务器已确认清除气泡:", data.message);
                // 这里可以做一些额外的清理工作
                break;
                    
            case "bubblesCleared":
                // 服务器通知气泡已被清除
                console.log("🎯 服务器已清除气泡");
                // 不需要再做什么，因为本地已经清除了
                break;


            case "userRangeUpdate":
                console.log(`🎯 收到用户范围更新: ${data.nickname} -> ${data.range}米`);
                // 更新在线用户的范围
                if (onlineUsers[data.userId]) {
                    const oldRange = onlineUsers[data.userId].range;
                    onlineUsers[data.userId].range = data.range;
                    console.log(`   范围变化: ${oldRange || 1000}米 -> ${data.range}米`);
                    // 刷新标记以应用新范围
                    refreshAllMarkers();
                }
                break;
                
            // ⭐ vA1.3: 气泡交互状态查询结果
            case "bubbleInteractionStatus":
                if (!bubbleInteractions[data.bubbleId]) {
                    bubbleInteractions[data.bubbleId] = {};
                }
                bubbleInteractions[data.bubbleId].liked = data.liked;
                bubbleInteractions[data.bubbleId].favorited = data.favorited;
                updateBubbleCardButtons(data.bubbleId, data.liked, data.favorited);
                break;

            // ⭐ 新增：处理点赞记录查询结果
            case "userLikesResult":
                console.log("📊 收到点赞记录:", data.likes.length, "条");
                displayLikesList(data.likes);
                break;
                
            // ⭐ 新增：处理收藏记录查询结果
            case "userFavoritesResult":
                console.log("📊 收到收藏记录:", data.favorites.length, "条");
                displayFavoritesList(data.favorites);
                break;
                
            // ⭐ 新增：处理评论记录查询结果
            case "userCommentsResult":
                console.log("📊 收到评论记录:", data.comments.length, "条");
                displayCommentsList(data.comments);
                break;
                
            // ⭐ 新增：处理统计数据查询结果
            case "userStatsResult":
                console.log("📊 收到统计数据:", data.stats);
                userStats = data.stats;
                    
                // ✅ 添加安全检查
                const publishedEl = document.getElementById('publishedCount');
                if (publishedEl) publishedEl.textContent = userStats.publishedCount;
                    
                const likesEl = document.getElementById('likesCount');
                if (likesEl) likesEl.textContent = userStats.likesCount;
                    
                const favoritesEl = document.getElementById('favoritesCount');
                if (favoritesEl) favoritesEl.textContent = userStats.favoritesCount;
                    
                const commentsEl = document.getElementById('commentsCount');
                if (commentsEl) commentsEl.textContent = userStats.commentsCount;
                break;
                
            // ⭐ 新增：处理我发布的查询结果
            case "userPublishedResult":
                console.log("📊 发布记录:", data.bubbles.length, "条");
                displayPublishedList(data.bubbles);
                break;
                
            // ⭐ 新增：处理浏览记录查询结果
            case "userViewsResult":
                console.log("📊 浏览记录:", data.views.length, "条");
                displayViewsList(data.views);
                break;
                
            // ⭐ 新增：处理搜索结果
            case "searchResult":
                console.log(`🔍 搜索结果: ${data.results.length} 条`);
                displaySearchResults(data.results, data.section);
                break;
                
            // ⭐ 新增：处理未读通知查询结果
            case "unreadNotificationsResult":
                console.log(`🔔 未读通知: ${data.count} 条`);
                updateNotificationBadge(data.count);
                break;
                
            // ⭐ 新增：会员激活成功
            // ⭐ 新增：会员激活成功
            case "vipActivated":
                console.log("💎 会员激活成功");
                if (currentUser) {
                    currentUser.isVip = true;
                    currentUser.vipExpireTime = data.expireTime;
                    if (data.vipType) currentUser.vipType = data.vipType;
                }
                updateVipDisplay(data);
                updateCustomTimeButtonState();
                closeVipModal();
                break;
                            
            // ⭐ 新增：会员状态查询结果
            // ⭐ 新增：会员状态查询结果
            case "vipStatusResult":
                console.log("💎 会员状态:", data);
                if (currentUser) {
                    currentUser.isVip = data.isVip;
                    currentUser.vipExpireTime = data.expireTime || 0;
                    if (data.vipType) currentUser.vipType = data.vipType;
                    
                    // 检查是否过期
                    const now = Date.now();
                    const isLifetime = data.vipType === 'lifetime';
                    const isVipValid = isLifetime || (data.isVip && data.expireTime > now);
                    
                    console.log('✅ VIP有效:', isVipValid);
                    
                    updateVipDisplay(data);
                    updateCustomTimeButtonState();
                }
                break;
                
    case "userInfoUpdated":
        console.log(`⚙️ ${data.field}更新成功:`, data.value);
        if (currentUser) {
            currentUser[data.field] = data.value;
            // 同步更新用户中心显示
            if (data.field === 'username') {
                document.getElementById('ucUsername').textContent = data.value;
                currentUser.nickname = data.value;
            }
            // ✅ 如果是头像更新，刷新所有头像显示
            if (data.field === 'avatar') {
                updateAvatarDisplay(data.value);
            }
            // ⭐ 应用界面风格
            if (data.field === 'theme') {
                applyTheme(data.value);
            }
            // ⭐ 如果是VIP状态更新，刷新按钮状态
            if (data.field === 'isVip') {
                updateCustomTimeButtonState();
            }
            // ⭐ 刷新个人中心显示（性别/年龄/地区/简介）
            if (['gender', 'birthday', 'region', 'bio', 'username', 'avatar'].includes(data.field)) {
                if (typeof updateUserDetails === 'function') updateUserDetails();
            }
            // 重新加载设置页面显示
            loadUserSettings();
        }
        break;
                


            // ⭐ 新增：收件箱未读数查询结果
    // ⭐ 新增：收件箱未读数查询结果
    case "inboxUnreadResult":
        console.log(`📨 收件箱未读:`, data.counts);
        // 更新总未读数小红点
        updateInboxBadge(data.total);
            
        // ✅ v9.6.5: 更新标签上的小红点，0时隐藏
        const likeBadge = document.getElementById('tabLikeBadge');
        if (likeBadge) {
            const likeCount = data.counts.like || 0;
            likeBadge.textContent = likeCount;
            likeBadge.style.display = likeCount > 0 ? 'inline-block' : 'none';
        }
            
        const favoriteBadge = document.getElementById('tabFavoriteBadge');
        if (favoriteBadge) {
            const favoriteCount = data.counts.favorite || 0;
            favoriteBadge.textContent = favoriteCount;
            favoriteBadge.style.display = favoriteCount > 0 ? 'inline-block' : 'none';
        }
            
        const commentBadge = document.getElementById('tabCommentBadge');
        if (commentBadge) {
            const commentCount = data.counts.comment || 0;
            commentBadge.textContent = commentCount;
            commentBadge.style.display = commentCount > 0 ? 'inline-block' : 'none';
        }

        const friendRequestBadge = document.getElementById('tabFriendRequestBadge');
        if (friendRequestBadge) {
            const friendRequestCount = data.counts.friend_request || 0;
            friendRequestBadge.textContent = friendRequestCount;
            friendRequestBadge.style.display = friendRequestCount > 0 ? 'inline-block' : 'none';
        }
        break;
                
            // ⭐ 新增：某类型通知列表查询结果
            case "notificationsByTypeResult":
                console.log(`📨 ${data.notificationType}通知:`, data.notifications.length, '条');
                displayNotificationsList(data.notifications, data.notificationType);
                // 刷新收件箱未读数
                queryInboxUnread();

                break;
                
            // ⭐ 新增：记录删除成功
            case "recordsDeleted":
                console.log(`🗑️ 删除成功: ${data.count}条记录`);
                // 刷新对应标签
                if (data.section === 'published') queryUserPublished();
                else if (data.section === 'likes') queryUserLikes();
                else if (data.section === 'favorites') queryUserFavorites();
                else if (data.section === 'comments') queryUserComments();
                else if (data.section === 'history') queryUserViews();
                break;

            // ⭐ 气泡内容编辑成功
            case "bubbleUpdated": {
                console.log(`✏️ 气泡更新成功: ${data.bubbleId}`);
                
                // 更新本地气泡数据
                const bubbleIndex = bubbles.findIndex(b => b.id === data.bubbleId);
                if (bubbleIndex !== -1) {
                    bubbles[bubbleIndex].title = data.title;
                    bubbles[bubbleIndex].content = data.content;
                    if (data.images) {
                        bubbles[bubbleIndex].images = data.images;
                    }
                    
                    // 更新地图上的标记
                    const marker = bubbleMarkers.get(data.bubbleId);
                    if (marker) {
                        // 如果当前打开的信息窗口是这个气泡，关闭它
                        if (currentInfoWindow && currentInfoWindow.bubble && 
                            currentInfoWindow.bubble.id === data.bubbleId) {
                            currentInfoWindow.close();
                            currentInfoWindow = null;
                        }
                    }
                }
                
                // 更新用户中心卡片
                const card = document.getElementById(`bubble-card-${data.bubbleId}`);
                if (card) {
                    const titleEl = card.querySelector('.uc-record-title');
                    if (titleEl) titleEl.textContent = data.title || '';
                    const contentEl = card.querySelector('.uc-record-desc');
                    if (contentEl && data.content) {
                        contentEl.textContent = data.content;
                    } else if (contentEl && !data.content) {
                        contentEl.remove();
                    }
                    // 同步发布者头像/昵称（服务端返回最新信息时）
                    if (data.author_avatar !== undefined) {
                        const avEl = card.querySelector('.uc-author-avatar');
                        if (avEl) avEl.innerHTML = renderAvatarPreview(data.author_avatar);
                    }
                    if (data.author_name !== undefined) {
                        const nmEl = card.querySelector('.uc-author-name');
                        if (nmEl) nmEl.textContent = data.author_name;
                    }
                    // 图片变更时重新查询发布列表以刷新卡片
                    if (data.images) {
                        queryUserPublished();
                    }
                } else {
                    // 如果找不到卡片，重新查询
                    queryUserPublished();
                }
                
                // 刷新控制面板的气泡列表
                if (!panelCollapsed) {
                    displayBubbles(bubbles);
                }
                break;
            }
    
    case "bubbleUpdateError":
        console.log('⚠️ 气泡更新失败:', data.message);
        break;
    
    // 在 WebSocket onmessage 的 switch 中添加：

    // ⭐ v9.4.0: 私聊相关消息处理
    case "privateChatsResult":
        displayPrivateChats(data.chats);
        break;

    case "privateMessagesResult":
        displayPrivateMessages(data.messages);
        break;

    case "privateMessageSent":
        // 消息发送成功，刷新聊天窗口
        if (currentChatUserId === data.toUserId) {
    queryPrivateMessages(data.toUserId);
        }
        // 刷新私聊列表（如果打开）
        if (document.getElementById('chatListOverlay').style.display === 'flex') {
    queryPrivateChats();
        }
        break;

    case "privateMessageReceived":
        // 接收到新消息
        console.log(`📨 收到新消息: ${data.fromUserName}`);
    
        if (currentChatUserId === data.fromUserId) {
    // 如果正在聊天窗口，刷新消息
    queryPrivateMessages(data.fromUserId);
        } else {
    // 否则更新未读数
    queryPrivateUnreadCount();
        }
        break;

    case "privateUnreadCountResult":
        updateChatBadge(data.count);
        break;

    // 处理用户信息查询（用于从气泡发起私聊和名片卡）
    case "userInfoResult":
        console.log('📦 收到用户信息:', data.user);
    
        if (window.pendingChatUserId) {
    // 从气泡发起私聊的场景
    openChatWithUser(window.pendingChatUserId, data.user.username, data.user.avatar);
    window.pendingChatUserId = null;
        } else if (currentChatUserId === data.user.id || currentChatUserId === data.user.userId) {
    // 当前正在私聊窗口中，更新名片卡
    console.log('🔄 更新当前聊天窗口的名片卡');
    updateUserCard(data.user);
        } else {
    // 登录界面显示头像的场景
    showLoginAvatar(data.user);
        }
        break;

    // ⭐ v9.4.0: 评论相关消息处理
    case "bubbleCommentsResult":
        // 如果服务器返回了uniqueId，就使用它
        displayBubbleComments(data.bubbleId, data.comments, data.uniqueId);
        break;


    case "provincesResult":
        handleProvincesResult(data.provinces);
        break;

    case "citiesResult":
        handleCitiesResult(data.provinceId, data.cities);
        break;

    case "searchCitiesResult":
        handleSearchResults(data.results);
        break;

    case "searchPlacesResult":
        console.log('📦 收到搜索结果:', data.places.length, '个');
        // 不管 fromRange 是什么，都调用 displaySearchSuggestions
        // 因为 displaySearchSuggestions 会自动判断显示位置
        displaySearchSuggestions(data.places);
        break;


    // 处理逆地理编码结果
    case "reverseGeocodeResult":
        console.log('📍 收到逆地理编码结果:', data.address);
        if (data.address) {
    document.getElementById('locationSearchInput').value = data.address;
        }
        break;


    // ⭐ vA1.1: 好友相关消息处理
    case "friendRequestSent":
        console.log('✅ 好友请求已发送');
        queryFriends();
        if (typeof showToast === 'function') showToast('好友请求已发送');
        break;

    case "friendRequestReceived":
        console.log('📨 收到好友请求:', data.request);
        queryFriendRequests();
        queryFriends();
        if (typeof queryInboxUnread === 'function') queryInboxUnread();
        if (typeof showToast === 'function') showToast(`收到 ${data.request.fromUserName} 的好友请求`);
        break;

    case "friendRequestAccepted":
        console.log('✅ 好友请求已接受');
        queryFriends();
        queryFriendRequests();
        if (typeof queryInboxUnread === 'function') queryInboxUnread();
        if (typeof showToast === 'function') showToast(data.friendUserName ? `${data.friendUserName} 已接受好友请求` : '好友请求已接受');
        break;

    case "friendRequestRejected":
        console.log('❌ 好友请求已拒绝');
        queryFriendRequests();
        if (typeof queryInboxUnread === 'function') queryInboxUnread();
        if (typeof showToast === 'function') showToast(data.friendUserName ? `${data.friendUserName} 已接受好友请求` : '好友请求已接受');
        break;

    case "friendRequestRejected":
        console.log('ℹ️ 好友请求已拒绝');
        queryFriendRequests();
        break;

    case "friendsResult":
        if (typeof displayFriends === 'function') displayFriends(data.friends);
        break;

    case "friendRequestsResult":
        if (typeof displayFriendRequests === 'function') displayFriendRequests(data.requests);
        break;

    case "queryUserForFriendResult":
        if (typeof displayUserSearchResults === 'function') displayUserSearchResults(data.users);
        break;

        case "groupCreated":
            if (data.success) {
                if (typeof showToast === 'function') showToast('群聊创建成功');
                if (typeof queryMyGroups === 'function') queryMyGroups();
            } else {
                if (typeof showToast === 'function') showToast(data.message || '创建群聊失败');
            }
            break;
        case "myGroupsResult":
            if (typeof displayMyGroups === 'function') displayMyGroups(data.groups);
            break;
        case "groupMessagesResult":
            if (typeof displayGroupMessages === 'function') displayGroupMessages(data.groupId, data.messages);
            break;
        case "groupMessageSent":
            if (typeof currentChatGroupId !== 'undefined' && currentChatGroupId === data.groupId) {
                if (typeof queryGroupMessages === 'function') queryGroupMessages(data.groupId);
            }
            if (typeof queryMyGroups === 'function') queryMyGroups();
            break;
        case "groupMessageReceived":
            if (typeof currentChatGroupId !== 'undefined' && currentChatGroupId === data.groupId) {
                if (typeof queryGroupMessages === 'function') queryGroupMessages(data.groupId);
            }
            if (typeof queryMyGroups === 'function') queryMyGroups();
            break;
        case "groupMemberAdded":
            if (typeof showToast === 'function') showToast('您已被添加到群聊: ' + (data.groupName || ''));
            if (typeof queryMyGroups === 'function') queryMyGroups();
            if (typeof queryInboxUnread === 'function') queryInboxUnread();
            break;
        case "groupMembersResult":
            if (typeof displayGroupMembers === 'function') displayGroupMembers(data.groupId, data.members);
            break;
        case "groupInfoUpdated":
            if (typeof showToast === 'function') showToast('群聊信息已更新');
            if (typeof queryMyGroups === 'function') queryMyGroups();
            if (typeof currentChatGroupId !== 'undefined' && currentChatGroupId === data.groupId) {
                if (data.name && typeof currentChatGroupName !== 'undefined') {
                    currentChatGroupName = data.name;
                    const nameEl = document.getElementById('groupChatUserName');
                    if (nameEl) nameEl.textContent = data.name;
                }
            }
            break;
        case "groupMembersAdded":
            if (data.success) {
                if (typeof showToast === 'function') showToast('已邀请成员加入群聊');
                if (typeof queryGroupMembers === 'function' && typeof currentChatGroupId !== 'undefined') queryGroupMembers(currentChatGroupId);
            } else {
                if (typeof showToast === 'function') showToast(data.message || '邀请失败');
            }
            break;
        case "groupDissolved":
            if (typeof showToast === 'function') showToast('群聊已解散');
            if (typeof closeGroupChat === 'function' && typeof currentChatGroupId !== 'undefined' && currentChatGroupId === data.groupId) {
                closeGroupChat();
            } else if (typeof queryMyGroups === 'function') {
                queryMyGroups();
            }
            break;
        case "memberKicked":
            if (data.success) {
                if (typeof showToast === 'function') showToast('已踢出成员');
                if (typeof queryGroupMembers === 'function' && typeof currentChatGroupId !== 'undefined') queryGroupMembers(currentChatGroupId);
            } else {
                if (typeof showToast === 'function') showToast(data.message || '操作失败');
            }
            break;
        case "kickedFromGroup":
            if (typeof showToast === 'function') showToast('您已被移出群聊');
            if (typeof closeGroupChat === 'function' && typeof currentChatGroupId !== 'undefined' && currentChatGroupId === data.groupId) {
                closeGroupChat();
            }
            if (typeof queryMyGroups === 'function') queryMyGroups();
            if (typeof queryInboxUnread === 'function') queryInboxUnread();
            break;
        case "leftGroup":
            if (data.success) {
                if (typeof showToast === 'function') showToast('已退出群聊');
                if (typeof closeGroupChat === 'function' && typeof currentChatGroupId !== 'undefined' && currentChatGroupId === data.groupId) {
                    closeGroupChat();
                } else if (typeof queryMyGroups === 'function') {
                    queryMyGroups();
                }
            } else {
                if (typeof showToast === 'function') showToast(data.message || '退出失败');
            }
            break;

            default:
                console.log("⚠️ 未处理的消息类型:", data.type);
        }
    }

function handleLoginSuccess(user) {
    console.log("✅ 登录成功:", user);  
    queryPrivateUnreadCount();
    if (typeof queryMyGroups === 'function') queryMyGroups();
    if (typeof queryInboxUnread === 'function') queryInboxUnread();
    // 更新用户信息
    if (!currentUser) {
        currentUser = {
            userId: user.userId || user.id,
            id: user.id,
            nickname: user.nickname || user.username,
            avatar: user.avatar || '👤',
            username: user.username,
            gender: user.gender || '保密',
            birthday: user.birthday || '',
            region: user.region || '未设置',
            bio: user.bio || '',
            background: user.background || '#667eea',
            theme: user.theme || 'light',
            isVip: user.isVip || false,
            vipExpireTime: user.vipExpireTime || 0,
            vipType: user.vipType || 'none'
        };
    } else {
        currentUser.userId = user.userId || user.id;
        currentUser.id = user.id;
        currentUser.theme = user.theme || 'light';
        currentUser.isVip = user.isVip || false;
        currentUser.vipExpireTime = user.vipExpireTime || 0;
        currentUser.vipType = user.vipType || 'none';
        if (user.avatar) {
            currentUser.avatar = user.avatar;
        }
    }
    
    updateAvatarDisplay(currentUser.avatar);
    applyTheme(currentUser.theme);
    
    document.getElementById('userNickname').textContent = currentUser.nickname;
    document.getElementById('userId').textContent = `ID: ${user.id}`;
    
    if (!myPosition) {
        myPosition = user.lat && user.lng ? 
            { lat: user.lat, lng: user.lng } : 
            { lat: 39.9042, lng: 116.4074 };
    }
    
    updateMyMarker();   // 内部按模式决定是画圆圈还是 marker
    refreshAllMarkers();
    
    setTimeout(() => {
        requestNearbyBubbles();
    }, 500);

    // 登录后预加载用户中心发布记录，避免首次打开时出现加载占位
    setTimeout(() => {
        queryUserPublished();
    }, 300);
    window.userPublishedPrefetched = true;
    
    if (typeof window.showWelcomeMessage === 'function') {
        window.showWelcomeMessage();
    }
    
    // ⭐ 更新自定义时长按钮状态
    setTimeout(updateCustomTimeButtonState, 500);

    // 注册后首次登录时自动弹出新手教程（仅触发一次）
    try {
        if (localStorage.getItem('showTutorialOnFirstLogin') === '1') {
            localStorage.removeItem('showTutorialOnFirstLogin');
            if (typeof startNewUserTutorial === 'function') {
                setTimeout(() => {
                    startNewUserTutorial();
                }, 700);
            }
        }
    } catch (e) {
        console.warn('无法访问 localStorage');
    }
}

// 检查当前用户是否为VIP
// 检查当前用户是否为有效VIP（未过期）
function isCurrentUserVip() {
    if (!currentUser) return false;
    
    // 检查是否有VIP标志和过期时间
    if (!currentUser.isVip || !currentUser.vipExpireTime) return false;
    
    // 检查是否过期
    const now = Date.now();
    const isVipValid = currentUser.vipExpireTime > now;
    
    console.log('🔍 VIP状态检查:', {
        isVip: currentUser.isVip,
        expireTime: new Date(currentUser.vipExpireTime).toLocaleString(),
        now: new Date(now).toLocaleString(),
        isValid: isVipValid
    });
    
    return isVipValid;
}

// 更新自定义时长按钮状态的函数
function updateCustomTimeButtonState() {
    const customTimeBtn = document.querySelector('.toggle-custom-btn');
    if (!customTimeBtn) return;
    
    if (isCurrentUserVip()) {
        // VIP用户：按钮可点击，文字恢复正常
        customTimeBtn.disabled = false;
        customTimeBtn.innerHTML = '⚙️ 自定义时长';
        customTimeBtn.style.opacity = '1';
        customTimeBtn.style.cursor = 'pointer';
        customTimeBtn.style.background = 'white';
        customTimeBtn.style.color = '#667eea';
        customTimeBtn.style.border = '2px solid #667eea';
    } else {
        // 非VIP用户：按钮不可点击，文字改为VIP专属，灰色样式
        customTimeBtn.disabled = true;
        customTimeBtn.innerHTML = '⚙️ 自定义时长（VIP专属）';
        customTimeBtn.style.opacity = '0.5';
        customTimeBtn.style.cursor = 'not-allowed';
        customTimeBtn.style.background = '#f5f5f5';
        customTimeBtn.style.color = '#999';
        customTimeBtn.style.border = '2px solid #ddd';
    }
}

    function updateOnlineCount(count) {
        console.log("👥 在线人数:", count);
        // 可以在这里更新在线人数显示
    }

    function updateOnlineUsersList(users) {
        const container = document.getElementById('onlineUsersList');
        if (!container) return;
            
        // 清空在线用户列表
        onlineUsers = {};
            
        if (users && users.length > 0) {
            // 更新在线用户信息
            users.forEach(user => {
                onlineUsers[user.userId] = {
                    lat: user.lat,
                    lng: user.lng,
                    nickname: user.nickname,
                    avatar: user.avatar || '👤',
                    range: user.range || 1000,
                    invisible: !!user.invisible,
                    isVip: user.isVip || false
                };
            });
                
            // 刷新标记
            refreshAllMarkers();  // ✅ 重要：更新后立即刷新标记
                
            // 更新UI列表
            container.innerHTML = users.map(user => `
                <div class="user-item">
                    <span style="color: #5483B3">${user.isVip ? '👑' : '👤'}</span>
                    <span>${user.nickname}${user.isVip ? ' <span style="color:#f6c90e;font-size:11px;">VIP</span>' : ''}</span>
                    <span style="font-size: 12px; color: #666">
                        ${user.lat ? `(${user.lat.toFixed(4)}, ${user.lng.toFixed(4)})` : '(位置未知)'}
                        <br>范围: ${user.range || 1000}米
                    </span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="user-item"><span style="color: #5483B3">👤</span><span>暂无其他在线用户</span></div>';
        }
    }


    function updateOtherUserPosition(data) {
        if (!data.userId) return;
            
        // 如果是自己，跳过（支持 server 返回的 userId 或 id 两种字段）
        if (currentUser && (String(data.userId) === String(currentUser.id) || String(data.userId) === String(currentUser.userId))) {
            return;
        }
            
        // ⭐ 重要：存储对方的范围信息
        const oldRange = onlineUsers[data.userId]?.range;
        const newRange = data.range || 1000;
            
        onlineUsers[data.userId] = {
            lat: data.lat,
            lng: data.lng,
            nickname: data.nickname,
            avatar: data.avatar || onlineUsers[data.userId]?.avatar || '👤',
            range: newRange,
            invisible: !!data.invisible,
            isVip: data.isVip || false
        };
            
        console.log(`📍 更新用户位置: ${data.nickname} (${data.userId})`);
        console.log(`   位置: (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`);
        console.log(`   范围: ${oldRange || 1000}米 -> ${newRange}米`);
            
        // 刷新标记
        refreshAllMarkers();
    }


        