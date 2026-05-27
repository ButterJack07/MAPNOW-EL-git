// 打开用户中心


    // ==================== ⭐ v9.4.0: 私聊系统 JavaScript 函数 ====================

    // 全局变量
    let currentChatUserId = null;
    let currentChatUserName = '';
    let currentChatUserAvatar = '';
    let chatUnreadCount = 0;

    // 打开私聊列表
    /**
     * 打开私聊列表面板
     * 同时拉取聊天列表与未读数
     */
    function openChatList() {
        document.getElementById('chatListOverlay').style.display = 'flex';
        queryPrivateChats();
        queryPrivateUnreadCount();
        console.log('💬 打开私聊列表');
    }

    // 关闭私聊列表
    /**
     * 关闭私聊列表面板
     */
    function closeChatList() {
        document.getElementById('chatListOverlay').style.display = 'none';
    }

    // 查询私聊列表
    /**
     * 请求当前用户的私聊会话列表
     * 通过 WebSocket 发送 query_private_chats 指令
     */
    function queryPrivateChats() {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('⚠️ WebSocket未连接');
    return;
        }
    
        socket.send(JSON.stringify({
    type: "queryPrivateChats"
        }));
    
        console.log('💬 查询私聊列表');
    }

    // 显示私聊列表
    /**
     * 渲染私聊列表到 DOM
     * @param {Array} chats - 会话对象数组
     */
    function displayPrivateChats(chats) {
        const container = document.getElementById('chatList');
    
        if (chats.length === 0) {
    container.innerHTML = '<div class="uc-empty">暂无私聊<br><small style="color: var(--text-tertiary); font-size: 12px; margin-top: 10px; display: block;">通过用户信息卡或气泡信息卡发起私聊</small></div>';
    return;
        }
    
        let html = '';
        chats.forEach(chat => {
    const isBase64 = chat.avatar && chat.avatar.startsWith('data:image');
    const avatarHTML = isBase64 
        ? `<img src="${chat.avatar}">`
        : chat.avatar || '👤';
        
    const lastMsgPrefix = chat.isSentByMe ? '我: ' : '';
    const lastMsgText = chat.lastMessage.length > 30 
        ? chat.lastMessage.substring(0, 30) + '...' 
        : chat.lastMessage;
        
    html += `
        <div class="chat-item" onclick="openChatWithUser('${chat.userId}', '${escapeHtml(chat.username)}', '${escapeAttr(chat.avatar || '👤')}')">
            <div class="chat-avatar">${avatarHTML}</div>
            <div class="chat-info">
                <div class="chat-name">${escapeHtml(chat.username)}</div>
                <div class="chat-last-message">${lastMsgPrefix}${escapeHtml(lastMsgText)}</div>
            </div>
            ${chat.unreadCount > 0 ? `<div class="chat-unread">${chat.unreadCount > 99 ? '99+' : chat.unreadCount}</div>` : ''}
        </div>
    `;
        });
    
        container.innerHTML = html;
        console.log(`✅ 显示 ${chats.length} 个私聊会话`);
    }

    // 辅助函数：转义属性中的引号
    /**
     * 转义 HTML 属性值中的特殊字符
     * @param {string} str - 原始字符串
     * * @returns {string} 安全转义后的字符串
     */
    function escapeAttr(str) {
        if (!str) return '';
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // 打开与某用户的聊天（修改版）
    /**
     * 打开与指定用户的私聊窗口
     * @param userId - 对方用户 ID
     * * @param username - 对方用户名
     * * @param avatar  - 对方头像 URL
     */
    function openChatWithUser(userId, username, avatar) {
        if (!userId) {
    console.error('❌ userId为空');
    return;
        }
    
        if (userId === currentUser.id) {
    return;
        }
    
        currentChatUserId = userId;
        currentChatUserName = username;
        currentChatUserAvatar = avatar;
    
        // 关闭私聊列表，打开聊天窗口
        document.getElementById('chatListOverlay').style.display = 'none';
        document.getElementById('chatOverlay').style.display = 'flex';
    
        // 设置聊天对象信息
        const isBase64 = avatar && avatar.startsWith('data:image');
        const avatarHTML = isBase64 
    ? `<img src="${avatar}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`
    : avatar;
    
        document.getElementById('chatUserAvatar').innerHTML = avatarHTML;
        document.getElementById('chatUserName').textContent = username;
    
        // 清空输入框
        document.getElementById('privateChatInput').value = '';
    
        // 查询聊天记录
        queryPrivateMessages(userId);
    
        // ⭐ 修复：查询用户完整信息并更新名片卡
        if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('🔍 查询用户完整信息:', userId);
    socket.send(JSON.stringify({
        type: "queryUserByIdOrPhone",
        loginId: userId
    }));
        } else {
    console.error('❌ WebSocket未连接，无法查询用户信息');
        }
    
        console.log(`💬 打开与 ${username} 的聊天`);
    }


    // 从气泡信息卡发起私聊
    function startChatFromBubble(userId) {
        if (!userId) {
    console.error('❌ userId为空');
    return;
        }
    
        if (userId === currentUser.id) {
    return;
        }
    
        // 查询对方用户信息
        if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
        }
    
        socket.send(JSON.stringify({
    type: "queryUserByIdOrPhone",
    loginId: userId
        }));
    
        // 临时保存userId，等待查询结果
        window.pendingChatUserId = userId;
    
        console.log(`💬 发起与 ${userId} 的私聊`);
    }

    // 关闭聊天窗口
    /**
     * 关闭私聊窗口并重置当前聊天状态
     */
    function closeChatWindow() {
        document.getElementById('chatOverlay').style.display = 'none';
        currentChatUserId = null;
        // 返回私聊列表
        openChatList();
    }

    // 查询聊天记录
    /**
     * 请求与指定用户的历史消息
     * @param {string} userId - 对方用户 ID
     */
    function queryPrivateMessages(userId) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
        }
    
        socket.send(JSON.stringify({
    type: "queryPrivateMessages",
    otherUserId: userId
        }));
    
        console.log(`💬 查询与 ${userId} 的聊天记录`);
    }

    // 显示聊天记录
    function displayPrivateMessages(messages) {
        const container = document.getElementById('privateChatMessages');
    
        if (messages.length === 0) {
    container.innerHTML = '<div class="uc-empty" style="color: var(--text-tertiary); padding: 40px 20px;">暂无消息<br><small style="font-size: 12px; margin-top: 10px; display: block;">发送消息开始聊天</small></div>';
    return;
        }
    
        let html = '';
        messages.forEach(msg => {
    const isSentByMe = msg.from_user_id === currentUser.id;
    const messageClass = isSentByMe ? 'message-sent' : 'message-received';
    const timeStr = formatTimeSimple(msg.created_at);
        
    html += `
        <div class="message-item ${messageClass}">
            <div class="message-content">
                ${escapeHtml(msg.message)}
                <div class="message-time">${timeStr}</div>
            </div>
        </div>
    `;
        });
    
        container.innerHTML = html;
    
        // 滚动到底部
        setTimeout(() => {
    container.scrollTop = container.scrollHeight;
        }, 100);
    
        console.log(`✅ 显示 ${messages.length} 条消息`);
    }

    // 发送私聊消息
    /**
     * 发送私聊消息
     * 读取输入框内容，通过 WebSocket 发送 private_message 指令
     */
    function sendPrivateMessage() {
        const input = document.getElementById('privateChatInput');
        const message = input.value.trim();
    
        if (!message) {
    return;
        }
    
        if (!currentChatUserId) {
    return;
        }
    
        if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
        }
    
        // 发送消息
        socket.send(JSON.stringify({
    type: "sendPrivateMessage",
    toUserId: currentChatUserId,
    message: message
        }));
    
        // 清空输入框
        input.value = '';
    
        console.log(`💬 发送消息给 ${currentChatUserId}: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`);
    }

    // 查询私聊未读总数
    /**
     * 查询当前用户的私聊未读消息总数
     */
    function queryPrivateUnreadCount() {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
    
        socket.send(JSON.stringify({
    type: "queryPrivateUnreadCount"
        }));
    }

    // 更新私聊未读小红点
    /**
     * 更新私聊图标上的未读角标
     * @param {number} count - 未读消息数量
     */
    function updateChatBadge(count) {
        chatUnreadCount = count;
        const badge = document.getElementById('chatBadge');
        if (badge) {
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
        }
    }

    // ==================== ⭐ v9.4.0: 评论展示功能 ====================

    // 切换气泡评论区
    function toggleBubbleComments(bubbleId) {
        console.log('点击评论区按钮，bubbleId:', bubbleId);
    
        const commentsArea = document.getElementById('bubbleCommentsArea-' + bubbleId);
    
        if (!commentsArea) {
    console.error('❌ 评论区不存在，ID:', 'bubbleCommentsArea-' + bubbleId);
    return;
        }
    
        console.log('当前显示状态:', commentsArea.style.display);
    
        if (commentsArea.style.display === 'none' || !commentsArea.style.display) {
    // 显示评论区
    console.log('显示评论区');
    commentsArea.style.display = 'block';
        
    // 显示加载中
    commentsArea.innerHTML = `
        <div style="
            padding: 20px;
            text-align: center;
            color: var(--text-tertiary);
            font-size: 13px;
            border-top: 1px solid #e0e0e0;
            background: var(--bg-secondary);
        ">
            加载评论中...
        </div>
    `;
        
    // 查询评论
    console.log('开始查询评论');
    queryBubbleComments(bubbleId);
        } else {
    // 隐藏评论区
    console.log('隐藏评论区');
    commentsArea.style.display = 'none';
    commentsArea.innerHTML = ''; // 清空内容
        }
    }


    // 显示评论区面板（替换原气泡面板）
    function showBubbleComments(bubbleId, bubbleTitle, bubbleType, bubbleAuthor, bubbleAvatar) {
        console.log('显示评论区，bubbleId:', bubbleId);
    
        // 关闭当前信息窗口
        if (currentInfoWindow) {
    currentInfoWindow.close();
    currentInfoWindow = null;
        }
    
        // 获取气泡位置（从已存储的气泡数据中查找）
        const bubble = bubbles.find(b => b.id === bubbleId);
        if (!bubble) {
    console.error('❌ 未找到气泡:', bubbleId);
    return;
        }
    
        const typeNames = {
    recommend: '推荐',
    help: '求助',
    team: '组队',
    warning: '避雷',
    news: '见闻',
    group: '💬 建群'
        };
        const typeName = typeNames[bubble.type] || bubble.type;
    
        // 生成唯一的时间戳，避免ID冲突
        const timestamp = Date.now();
        const uniqueId = bubbleId + '_' + timestamp;
    
        // 保存到全局变量
        currentCommentUniqueId = uniqueId;
        currentCommentBubbleId = bubbleId;
    
        // 创建评论区面板 - 使用flex布局，输入框固定在底部
        const content = `
    <div style="
        background: var(--card-bg);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        width: 320px;  /* 与气泡面板同宽 */
        height: 450px;  /* 固定高度 */
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        overflow: hidden;  /* 防止内容溢出 */
    ">
        <!-- 头部：返回按钮和标题 - 固定顶部 -->
        <div style="
            display: flex;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #e0e0e0;
            background: var(--card-bg);
            flex-shrink: 0;
        ">
            <button onclick="showBubbleInfoWindowFromId('${bubbleId}')" 
                    style="
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        border: none;
                        background: var(--bg-secondary);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        margin-right: 10px;
                        transition: all 0.2s;
                        flex-shrink: 0;
                    "
                    onmouseover="this.style.background='#e0e0e0'"
                    onmouseout="this.style.background='#f0f0f0'">
                ←
            </button>
            <div style="flex: 1; font-weight: 600; color: var(--text-primary); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(bubbleTitle)}</div>
            <span style="padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; color: white; background: ${getBubbleColor(bubble.type)}; flex-shrink: 0;">${typeName}</span>
        </div>
            
        <!-- 作者信息 - 固定顶部第二部分 -->
        <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 15px;
            background: var(--bg-secondary);
            border-bottom: 1px solid #e0e0e0;
            flex-shrink: 0;
        ">
            <span style="font-size: 24px;">${bubbleAvatar || '👤'}</span>
            <span style="font-size: 13px; font-weight: 500; color: var(--text-primary);">${escapeHtml(bubbleAuthor)}</span>
        </div>
            
        <!-- 评论统计 - 固定顶部第三部分 -->
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            border-bottom: 1px solid #e0e0e0;
            background: var(--card-bg);
            flex-shrink: 0;
        ">
            <span style="font-size: 14px; font-weight: 600; color: var(--text-primary);">💬 全部评论</span>
            <span id="commentCount-${uniqueId}" style="font-size: 12px; color: var(--text-tertiary); background: var(--bg-secondary); padding: 2px 8px; border-radius: 12px;">0</span>
        </div>
            
        <!-- 评论列表容器 - 可滚动区域，自动填充剩余空间 -->
        <div id="commentListContainer-${uniqueId}" style="
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            background: var(--bg-secondary);
        ">
            <div style="padding: 30px; text-align: center; color: var(--text-tertiary); font-size: 13px;">
                加载评论中...
            </div>
        </div>
            
        <!-- 评论输入框 - 固定在底部 -->
        <div style="
            display: flex;
            gap: 8px;
            padding: 12px 15px;
            border-top: 1px solid #e0e0e0;
            background: var(--card-bg);
            flex-shrink: 0;
        ">
            <input type="text" id="commentInput-${uniqueId}" 
                   placeholder="写评论..." 
                   style="
                       flex: 1;
                       padding: 8px 12px;
                       border: 2px solid var(--border-color);
                       border-radius: 20px;
                       font-size: 13px;
                       outline: none;
                       transition: all 0.3s;
                   "
                   onfocus="this.style.borderColor='#667eea'"
                   onblur="this.style.borderColor='#e0e0e0'"
                   onkeypress="if(event.key==='Enter') sendBubbleComment('${uniqueId}', '${bubbleId}')">
            <button onclick="sendBubbleComment('${uniqueId}', '${bubbleId}')" 
                    style="
                        padding: 8px 16px;
                        background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
                        border: none;
                        border-radius: 20px;
                        color: white;
                        font-size: 13px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.3s;
                        white-space: nowrap;
                    "
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(102,126,234,0.4)';"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
                发送
            </button>
        </div>
    </div>
        `;
    
        // 创建新信息窗口
        const position = new qq.maps.LatLng(bubble.lat, bubble.lng);
        currentInfoWindow = new qq.maps.InfoWindow({
    map: map,
    position: position,
    content: content
        });
        currentInfoWindow.open();
    
        // 查询评论
        queryBubbleComments(bubbleId);
    }


    // 从ID重新显示气泡信息窗口（返回功能）
    function showBubbleInfoWindowFromId(bubbleId) {
        console.log('返回原气泡面板，bubbleId:', bubbleId);
    
        // 关闭当前信息窗口
        if (currentInfoWindow) {
    currentInfoWindow.close();
    currentInfoWindow = null;
        }
    
        const bubble = bubbles.find(b => b.id === bubbleId);
        if (!bubble) {
    console.error('❌ 未找到气泡:', bubbleId);
    return;
        }
    
        // 找到对应的标记
        const markerInfo = bubbleMarkers.get(bubbleId);
        if (!markerInfo || !markerInfo.label) {
    console.error('❌ 未找到气泡标记:', bubbleId);
    return;
        }
    
        // 重新显示原气泡面板
        showBubbleInfoWindow(bubble, markerInfo.label);
    }

    // 为评论区面板查询评论
    function queryBubbleCommentsForPanel(bubbleId) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
        }
    
        socket.send(JSON.stringify({
    type: "queryBubbleComments",
    bubbleId: bubbleId,
    forPanel: true  // 标记是为面板查询
        }));
    }

    // 从评论区面板发送评论
    function sendBubbleCommentFromPanel(bubbleId) {
        console.log('从面板发送评论，bubbleId:', bubbleId);
        sendBubbleComment(bubbleId);
    }

    // 查询气泡评论
    function queryBubbleComments(bubbleId) {
        console.log('执行 queryBubbleComments, bubbleId:', bubbleId);
    
        if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket未连接');
    return;
        }
    
        const message = {
    type: "queryBubbleComments",
    bubbleId: bubbleId
        };
    
        console.log('发送查询请求:', message);
        socket.send(JSON.stringify(message));
    }


    // 显示气泡评论
    function displayBubbleComments(bubbleId, comments) {
        console.log('收到评论数据，bubbleId:', bubbleId, 'comments:', comments);
    
        // 使用全局变量中的uniqueId
        const uniqueId = currentCommentUniqueId;
    
        if (!uniqueId) {
    console.error('❌ 没有uniqueId，无法更新评论');
    return;
        }
    
        // 更新评论数量
        const countSpan = document.getElementById('commentCount-' + uniqueId);
        if (countSpan) {
    countSpan.textContent = comments ? comments.length : 0;
        } else {
    console.warn('评论数量元素不存在，ID:', 'commentCount-' + uniqueId);
        }
    
        // 更新评论列表
        const listContainer = document.getElementById('commentListContainer-' + uniqueId);
        if (!listContainer) {
    console.warn('评论列表容器不存在，ID:', 'commentListContainer-' + uniqueId);
    return;
        }
    
        // 清空容器
        listContainer.innerHTML = '';
    
        let html = '';
    
        if (!comments || comments.length === 0) {
    html = `
        <div style="
            padding: 40px 20px;
            text-align: center;
            color: var(--text-tertiary);
            font-size: 13px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div>
                暂无评论<br>
                <small style="font-size: 11px; margin-top: 5px; display: block;">成为第一个评论的人</small>
            </div>
        </div>
    `;
        } else {
    comments.forEach(comment => {
        const username = comment.username || comment.author_name || comment.author || '匿名';
        const avatar = comment.avatar || comment.author_avatar || '👤';
        const commentText = comment.comment_text || comment.content || comment.text || '';
        const timeStr = formatTimeSimple(comment.created_at || comment.time || Date.now());
            
        const isBase64 = avatar && avatar.startsWith('data:image');
        const avatarHTML = isBase64 
            ? `<img src="${avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
            : avatar || '👤';
            
        html += `
            <div style="
                padding: 10px;
                margin-bottom: 8px;
                background: var(--card-bg);
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; gap: 10px;">
                    <div style="
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        flex-shrink: 0;
                    ">${avatarHTML}</div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${escapeHtml(username)}</span>
                            <span style="font-size: 10px; color: var(--text-tertiary); flex-shrink: 0;">${timeStr}</span>
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); word-wrap: break-word; line-height: 1.4;">
                            ${escapeHtml(commentText)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
        }
    
        listContainer.innerHTML = html;
    
        // 滚动到底部
        setTimeout(() => {
    listContainer.scrollTop = 0;
        }, 100);
    }


    // 发送气泡评论
    function sendBubbleComment(uniqueId, bubbleId) {
        console.log('========== 发送评论 ==========');
        console.log('uniqueId:', uniqueId, 'bubbleId:', bubbleId);
    
        const input = document.getElementById('commentInput-' + uniqueId);
        if (!input) {
    console.error('❌ 评论输入框不存在，ID:', 'commentInput-' + uniqueId);
    return;
        }
    
        const comment = input.value.trim();
        console.log('评论内容:', comment);
    
        if (!comment) {
    return;
        }
    
        if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('❌ WebSocket未连接');
    return;
        }
    
        if (!currentUser) {
    console.error('❌ 用户未登录');
    return;
        }
    
        // 显示发送中状态
        const sendBtn = input.nextElementSibling;
        const originalText = sendBtn.textContent;
        sendBtn.textContent = '发送中...';
        sendBtn.disabled = true;
    
        // 构造发送数据
        const message = {
    type: "commentBubble",
    bubbleId: bubbleId,
    comment: comment
        };
    
        console.log('发送消息:', message);
        socket.send(JSON.stringify(message));
    
        // 清空输入框
        input.value = '';
    
        // 恢复按钮状态
        setTimeout(() => {
    sendBtn.textContent = originalText;
    sendBtn.disabled = false;
        }, 1000);
    
        // 乐观更新：立即在UI中添加自己的评论
        const listContainer = document.getElementById('commentListContainer-' + uniqueId);
        if (listContainer) {
    const now = Date.now();
    const timeStr = '刚刚';
    const isBase64 = currentUser.avatar && currentUser.avatar.startsWith('data:image');
    const avatarHTML = isBase64 
        ? `<img src="${currentUser.avatar}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
        : currentUser.avatar || '👤';
        
    // 如果当前是空状态，先清空"暂无评论"
    if (listContainer.innerHTML.includes('暂无评论')) {
        listContainer.innerHTML = '';
    }
        
    const newCommentHtml = `
        <div style="
            padding: 12px;
            margin-bottom: 8px;
            background: #e3f2fd;
            border-radius: 8px;
            animation: fadeIn 0.3s;
        ">
            <div style="display: flex; gap: 10px;">
                <div style="
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    flex-shrink: 0;
                ">${avatarHTML}</div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${escapeHtml(currentUser.nickname)}</span>
                        <span style="font-size: 10px; color: var(--text-tertiary);">${timeStr}</span>
                    </div>
                    <div style="font-size: 13px; color: var(--text-secondary); word-wrap: break-word;">
                        ${escapeHtml(comment)}
                    </div>
                </div>
            </div>
        </div>
    `;
        
    listContainer.innerHTML = newCommentHtml + listContainer.innerHTML;
        
    // 更新评论计数
    const countSpan = document.getElementById('commentCount-' + uniqueId);
    if (countSpan) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = currentCount + 1;
    }
        }
    
        console.log('💬 评论发送完成');
    }


    // 打开用户中心
    /**
     * 打开用户中心面板
     * 拉取最新统计数据并展示
     */

    // 打开用户中心
    function openUserCenter() {
        const overlay = document.getElementById('userCenterOverlay');
        overlay.style.display = 'flex';
        overlay.classList.add('show');
        setBottomNavActive('mobileUserButton');

        const statusIconEl = document.getElementById('ucStatusIcon');
        const iconMap = {
            1: '🎉',
            2: '🚶',
            3: '🎪',
            4: '🤝',
            5: '👥',
            6: '🔕'
        };
        if (statusIconEl) {
            statusIconEl.textContent = iconMap[userStats.status] || '🚶';
            statusIconEl.title = userStats.statusText || '状态';
        }

        // 打开时如果尚未预加载，立即预取一次发布记录
        if (!window.userPublishedPrefetched) {
            queryUserPublished();
        }

        // 更新用户信息
        if (currentUser) {
            updateAvatarDisplay(currentUser.avatar || '👤');
            document.getElementById('ucUsername').textContent = currentUser.nickname || currentUser.username;
            document.getElementById('ucUserId').textContent = 'ID: ' + currentUser.id;
            
            // ⭐ v9.6.6: 更新性别、年龄、地区、简介
            updateUserDetails();
        }

        // 首次打开先给基础占位，避免长时间显示“加载中...”
        const publishedEl = document.getElementById('uc-published');
        if (publishedEl && !publishedEl.innerHTML.trim()) {
            publishedEl.innerHTML = '<div class="uc-empty">暂无发布记录</div>';
        }

        // ⭐ 请求完整用户信息（从数据库获取最新数据）
        if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
            console.log("📤 请求完整用户信息...");
            socket.send(JSON.stringify({
                type: "getUserFullInfo"
            }));
        }

        // ⭐ 查询收件箱未读数
        queryInboxUnread();

        // ⭐ 查询会员状态
        queryVipStatus();

        console.log('📊 打开用户中心');
    }
    
    // ⭐ v9.6.6: 更新用户详细信息（性别、年龄、地区、简介）
    function updateUserDetails() {
        if (!currentUser) return;
        
        const detailsEl = document.getElementById('ucUserDetails');
        const bioEl = document.getElementById('ucBio');
        
        let detailsHTML = '';
        
        // 性别
        if (currentUser.gender && (currentUser.gender === '男' || currentUser.gender === '女')) {
            const genderClass = currentUser.gender === '男' ? 'male' : 'female';
            const genderSymbol = currentUser.gender === '男' ? '♂' : '♀';
            detailsHTML += `<span class="uc-gender ${genderClass}">${genderSymbol}</span>`;
        }
        
        // 年龄
        if (currentUser.birthday) {
            const age = calculateAge(currentUser.birthday);
            if (age > 0) {
                detailsHTML += `<span class="uc-age">${age}岁</span>`;
            }
        }
        
        // 地区
        if (currentUser.region && currentUser.region !== '未设置') {
            detailsHTML += `<span class="uc-region">${currentUser.region}</span>`;
        }
        
        detailsEl.innerHTML = detailsHTML;
        detailsEl.style.display = detailsHTML ? 'flex' : 'none';
        
        // 个人简介
        if (currentUser.bio && currentUser.bio.trim()) {
            bioEl.textContent = currentUser.bio;
            bioEl.style.display = 'block';
        } else {
            bioEl.style.display = 'none';
        }
    }
    
    // ⭐ v9.6.6: 计算年龄
    function calculateAge(birthday) {
        if (!birthday) return 0;
        
        try {
            const birthDate = new Date(birthday);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return age > 0 ? age : 0;
        } catch (e) {
            return 0;
        }
    }




    // 关闭用户中心
    /**
     * 关闭用户中心面板
     */
    function closeUserCenter() {
        const overlay = document.getElementById('userCenterOverlay');
        // ⭐ v9.6.10: 添加关闭动画
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('closing');
            overlay.classList.remove('show');
            setBottomNavActive(null);
        }, 400); // 动画时长0.4s
        console.log('❌ 关闭用户中心');
    }
        

    // 辅助函数：渲染头像预览
    function renderAvatarPreview(avatar) {
        if (!avatar) return '👤';
    
        const isBase64 = avatar && avatar.startsWith('data:image');
        if (isBase64) {
    return `<img src="${avatar}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">`;
        } else {
    return avatar;  // 返回 emoji 或文字
        }
    }


    // 更换头像（优化版）
    function changeAvatar() {
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
    
        // Emoji 列表（去重并扩展）
        const emojis = [
    '😊','😄','😁','😃','😆','😉','😍','🥰','😇','😎',
    '🤓','😺','😸','😻','🐶','🐱','🐭','🐹','🐰','🦊',
    '🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🦄',
    '🐝','🐞','🐧','🐦','🐤','🦉','🐴','🐗','🐺','🦊',
    '🌟','⚡','🔥','💎','🎨','🎭','🎪','🎯','🎲','🎵',
    '🍀','🍎','🍉','☕','🍩','🍪','🏆','🚀','🌈','🛴'
        ];
    
        modal.innerHTML = `
    <div class="avatar-modal-content" style="
        background: var(--card-bg);
        border-radius: 20px;
        padding: 25px;
        width: 90%;
        max-width: 500px;
        animation: slideUp 0.3s ease;
    ">
        <h3 style="color: var(--text-primary); margin-bottom: 20px; font-size: 18px;">更换头像</h3>
            
        <!-- 当前头像预览 -->
        <div style="text-align: center; margin-bottom: 20px;">

            <div style="font-size: 60px; margin-bottom: 10px;" id="avatarPreview">${renderAvatarPreview(currentUser.avatar)}</div>
            <div style="color: var(--text-secondary); font-size: 12px;">当前头像</div>
        </div>
            
        <!-- 两个选项卡 -->
        <div style="display: flex; border-bottom: 2px solid #f0f0f0; margin-bottom: 20px;">
            <button class="avatar-tab active" data-tab="emoji" 
                    style="flex: 1; padding: 10px; background: none; border: none; cursor: pointer; color: var(--primary-color); font-weight: 600; border-bottom: 2px solid #667eea;"
                    onclick="switchAvatarTab('emoji', this)">😊 Emoji</button>
            <button class="avatar-tab" data-tab="upload" 
                    style="flex: 1; padding: 10px; background: none; border: none; cursor: pointer; color: var(--text-secondary);"
                    onclick="switchAvatarTab('upload', this)">📸 上传图片</button>
        </div>
            
        <!-- Emoji 选择面板 -->
        <div id="avatarEmojiPanel" style="max-height: 300px; overflow-y: auto;">
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px;">
                ${emojis.map(emoji => `
                    <div data-emoji="${emoji}" onclick="selectAvatarEmoji('${emoji}')" 
                         class="emoji-option">
                        ${emoji}
                    </div>
                `).join('')}
            </div>
        </div>
            
        <!-- 上传图片面板（隐藏） -->
        <div id="avatarUploadPanel" style="display: none; text-align: center; padding: 20px;">
            <div style="border: 2px dashed #e0e0e0; border-radius: 10px; padding: 30px; cursor: pointer;"
                 onclick="triggerAvatarUpload()"
                 onmouseover="this.style.background='#f8f9fa'"
                 onmouseout="this.style.background='white'">
                <div style="font-size: 40px; margin-bottom: 10px;">📷</div>
                <div style="color: var(--text-secondary);">点击选择图片</div>
                <div style="color: var(--text-tertiary); font-size: 11px; margin-top: 5px;">支持 JPG/PNG，小于5MB</div>
            </div>
            <input type="file" id="avatarFileInput" accept="image/*" style="display: none;" onchange="handleAvatarUpload(this)">
        </div>
            
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="this.closest('.avatar-modal-content').parentElement.remove()" 
                    style="
                        flex: 1;
                        padding: 12px;
                        background: var(--bg-secondary);
                        border: none;
                        border-radius: 10px;
                        color: var(--text-secondary);
                        font-weight: 600;
                        cursor: pointer;
                    ">取消</button>
            <button onclick="saveAvatar(this)" 
                    style="
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
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
    }

    // 切换头像选项卡
    let selectedAvatar = null;

    function switchAvatarTab(tab, btn) {
        // 更新按钮样式
        document.querySelectorAll('.avatar-tab').forEach(t => {
    t.style.color = '#666';
    t.style.borderBottom = 'none';
        });
        btn.style.color = '#667eea';
        btn.style.borderBottom = '2px solid #667eea';
    
        // 切换面板
        if (tab === 'emoji') {
    document.getElementById('avatarEmojiPanel').style.display = 'block';
    document.getElementById('avatarUploadPanel').style.display = 'none';
        } else {
    document.getElementById('avatarEmojiPanel').style.display = 'none';
    document.getElementById('avatarUploadPanel').style.display = 'block';
        }
    }

    // 选择 Emoji 头像
    function selectAvatarEmoji(emoji) {
        selectedAvatar = emoji;
    
        // 高亮选中的 Emoji
        document.querySelectorAll('.emoji-option').forEach(opt => {
    if (opt.textContent === emoji) {
        opt.style.background = 'linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%)';
        opt.style.color = 'white';
        opt.style.transform = 'scale(1.1)';
    } else {
        opt.style.background = '#f8f9fa';
        opt.style.color = 'inherit';
        opt.style.transform = 'scale(1)';
    }
        });
    
        // 预览 - 修改这里
        document.getElementById('avatarPreview').innerHTML = renderAvatarPreview(emoji);
    }


    // 触发文件上传
    function triggerAvatarUpload() {
        document.getElementById('avatarFileInput').click();
    }

    // 处理头像上传
    function handleAvatarUpload(input) {
        const file = input.files[0];
        if (!file) return;
    
        // 检查文件大小
        if (file.size > 5 * 1024 * 1024) {
    return;
        }
    
    
        const reader = new FileReader();
        reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 100;
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
            
        // 绘制圆形裁剪
        ctx.beginPath();
        ctx.arc(maxSize/2, maxSize/2, maxSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
            
        // 绘制图片
        ctx.drawImage(img, 0, 0, maxSize, maxSize);
            
        // 转为base64
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
            
        // 保存选中的头像
        selectedAvatar = base64;
            
        // 预览
        const preview = document.getElementById('avatarPreview');
        preview.innerHTML = `<img src="${base64}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`;
    };
    img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 保存头像
    function saveAvatar(btn) {
        const modal = btn.closest('.avatar-modal-content').parentElement;
    
        // 如果没有选择新头像，直接关闭浮层
        if (!selectedAvatar) {
    modal.remove();
    return;
        }
    
        // 如果选择的头像和当前一样，直接关闭
        if (selectedAvatar === currentUser.avatar) {
    modal.remove();
    return;
        }
    
        // 更新头像
        currentUser.avatar = selectedAvatar;
        updateAvatarDisplay(selectedAvatar);
        updateUserInfo('avatar', selectedAvatar);
    
        modal.remove();
    }


    // ⭐ 新增：更新头像显示 - 优化图片居中
    function updateAvatarDisplay(avatar) {
        // 获取所有需要更新头像的元素
        const elements = {
            ucAvatar: document.getElementById('ucAvatar'),
            headerAvatar: document.getElementById('headerAvatar'),
            settingsAvatar: document.getElementById('settingsAvatar')
        };
        
        // 检查是否是 Base64 图片
        const isBase64 = avatar && avatar.startsWith('data:image');
        
        Object.entries(elements).forEach(([key, element]) => {
            if (!element) return;
            
            // 清空原有内容
            element.innerHTML = '';
            
            if (isBase64) {
                // 图片头像 - 创建 img 元素并确保居中
                const img = document.createElement('img');
                img.src = avatar;
                
                // 根据不同的元素设置不同的样式
                if (key === 'ucAvatar') {
                    img.style.width = '80px';
                    img.style.height = '80px';
                } else if (key === 'headerAvatar') {
                    img.style.width = '55px';  // 与按钮大小一致
                    img.style.height = '55px';
                } else {
                    img.style.width = '24px';
                    img.style.height = '24px';
                }
                
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                img.style.display = 'block';  // 确保块级显示
                
                // 对于 headerAvatar，需要特殊处理以确保在 flex 容器中居中
                if (key === 'headerAvatar') {
                    element.style.display = 'flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.width = '100%';
                    element.style.height = '100%';
                    element.appendChild(img);
                } else {
                    element.appendChild(img);
                }
            } else {
                // Emoji 或文字头像
                element.textContent = avatar || '👤';
                
                // 确保 headerAvatar 的文字也居中
                if (key === 'headerAvatar') {
                    element.style.display = 'flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.width = '100%';
                    element.style.height = '100%';
                    element.style.fontSize = '30px';
                    element.style.lineHeight = '1';
                }
            }
        });
        
        console.log('🖼️ 头像已更新:', isBase64 ? '图片头像' : avatar);
    }


    // 切换状态选择器
    function toggleStatusSelector() {
        const selector = document.getElementById('statusSelector');
        selector.style.display = selector.style.display === 'none' ? 'block' : 'none';
    }
        
    // 选择状态
    function selectStatus(statusId, statusText) {
        userStats.status = statusId;
        userStats.statusText = statusText;
        document.getElementById('statusSelector').style.display = 'none';

        const iconMap = {
            1: '🎉',
            2: '🚶',
            3: '🎪',
            4: '🤝',
            5: '👥',
            6: '🔕'
        };
        const statusIconEl = document.getElementById('ucStatusIcon');
        if (statusIconEl) {
            statusIconEl.textContent = iconMap[statusId] || '🚶';
            statusIconEl.title = statusText;
        }

        const isDnd = (statusId === 6); // 暂时勿扰

        // 发送到服务器（携带是否隐形标志）
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'updateStatus',
                status: statusId,
                statusText: statusText,
                invisible: isDnd   // 服务端据此决定是否广播此用户位置
            }));
        }

        // 立即刷新自身地图标记（勿扰时隐藏，其他状态时显示）
        updateMyMarker();

        // 勿扰时不再上报位置，直到状态变更
        if (isDnd) {
        } else {
            sendPositionToServer();
        }

        console.log('✨ 状态更新:', statusText, isDnd ? '（已隐藏位置）' : '');
    }
        
    // 打开会员中心
    // 打开会员中心
    function openVipCenter() {
        const overlay = document.getElementById('vipModalOverlay');
        overlay.style.display = 'flex';

        const expireInfo = document.getElementById('vipExpireInfo');
        const showcase = document.getElementById('vipLifetimeShowcase');
        const plans = document.getElementById('vipPlans');

        if (currentUser?.isVip && currentUser?.vipType === 'lifetime') {
            // 终身会员：隐藏套餐，展示装饰区
            plans.style.display = 'none';
            expireInfo.style.display = 'none';
            showcase.style.display = 'block';
            showcase.innerHTML = `
                <div class="vip-lifetime-glow">
                    <div class="vip-lifetime-icon">🌟</div>
                    <div class="vip-lifetime-title">您好，尊贵的终身会员</div>
                    <div class="vip-lifetime-sub">感谢您的支持，所有权益永久有效</div>
                    <div class="vip-lifetime-badges">
                        <span class="vip-lifetime-badge">👑 专属标识</span>
                        <span class="vip-lifetime-badge">🎨 全部主题</span>
                        <span class="vip-lifetime-badge">⏱ 自定义时长</span>
                        <span class="vip-lifetime-badge">💎 尊贵身份</span>
                    </div>
                </div>
            `;
        } else {
            plans.style.display = 'flex';
            showcase.style.display = 'none';

            if (currentUser?.isVip && currentUser?.vipExpireTime) {
                const remaining = currentUser.vipExpireTime - Date.now();
                if (remaining > 0) {
                    const days = Math.ceil(remaining / (24 * 3600000));
                    expireInfo.style.display = 'block';
                    expireInfo.innerHTML = `会员将于 <strong>${days}天</strong> 后过期`;
                } else {
                    expireInfo.style.display = 'none';
                }
            } else {
                expireInfo.style.display = 'none';
            }
        }
        console.log('💎 打开会员购买页面');
    }
        
    // 关闭会员中心
    function closeVipModal() {
        const overlay = document.getElementById('vipModalOverlay');
        overlay.style.display = 'none';
        console.log('❌ 关闭会员购买页面');
    }

    // ⭐ 支付相关变量
    let pendingVipPlan = null;

    // ⭐ 打开支付弹窗（直接模拟微信支付）
    function openPaymentModal(plan) {
        const plans = {
            monthly: { name: '月卡', price: '¥1.8', type: 'monthly', duration: 30 * 24 * 3600000 },
            yearly: { name: '年卡', price: '¥8.8', type: 'yearly', duration: 365 * 24 * 3600000 },
            lifetime: { name: '终身', price: '¥18.8', type: 'lifetime', duration: -1 }
        };
        const selected = plans[plan];
        if (!selected) return;

        pendingVipPlan = selected;

        const container = document.querySelector('.payment-container');
        container.innerHTML = `
            <div class="wxpay-container">
                <div class="wxpay-header">
                    <span class="wxpay-title">收银台</span>
                    <button class="wxpay-close" onclick="closePaymentModal()">×</button>
                </div>
                <div class="wxpay-body">
                    <div class="wxpay-merchant">
                        <div class="wxpay-merchant-icon">👑</div>
                        <div class="wxpay-merchant-detail">
                            <div class="wxpay-merchant-name">此刻地图</div>
                            <div class="wxpay-merchant-desc">VIP会员 · ${selected.name}</div>
                        </div>
                    </div>
                    <div class="wxpay-divider"></div>
                    <div class="wxpay-amount-section">
                        <span class="wxpay-amount-label">需付款</span>
                        <div class="wxpay-amount">${selected.price}</div>
                    </div>
                    <div class="wxpay-qr-section">
                        <div class="wxpay-qr-frame">
                            <div class="wxpay-qr-code" id="wxpayQrCode">
                                <div class="qr-corner qr-tl"><div class="qr-inner"></div></div>
                                <div class="qr-corner qr-tr"><div class="qr-inner"></div></div>
                                <div class="qr-corner qr-bl"><div class="qr-inner"></div></div>
                                <div class="qr-center-logo">💚</div>
                            </div>
                        </div>
                        <div class="wxpay-qr-tip">请使用微信扫一扫<br>扫描二维码付款</div>
                    </div>
                    <button class="wxpay-btn" onclick="processPayment()">已完成付款</button>
                </div>
                <div class="wxpay-footer">
                    <span>🔒 微信安全支付</span>
                </div>
            </div>
        `;

        document.getElementById('paymentOverlay').style.display = 'flex';
        document.getElementById('vipModalOverlay').style.display = 'none';
        console.log(`💳 打开微信支付: ${selected.name}`);
    }

    // ⭐ 关闭支付弹窗
    function closePaymentModal() {
        document.getElementById('paymentOverlay').style.display = 'none';
        pendingVipPlan = null;
        console.log('❌ 关闭支付弹窗');
    }

    // ⭐ 处理支付（模拟微信支付）
    function processPayment() {
        if (!pendingVipPlan) return;

        console.log(`💳 微信支付中: ${pendingVipPlan.name} · ${pendingVipPlan.price}`);

        const container = document.querySelector('.payment-container');
        container.innerHTML = `
            <div class="wxpay-container">
                <div class="wxpay-header">
                    <span class="wxpay-title">支付中</span>
                </div>
                <div class="wxpay-body" style="text-align:center;padding:40px 20px;">
                    <div class="wxpay-processing">
                        <div class="wxpay-processing-icon">
                            <div class="wxpay-scanning"></div>
                            💚
                        </div>
                        <div style="font-size:16px;font-weight:600;color:#1a1a2e;margin-bottom:4px;">正在处理支付...</div>
                        <div style="font-size:13px;color:#999;">${pendingVipPlan.name} · ${pendingVipPlan.price}</div>
                    </div>
                </div>
                <div class="wxpay-footer">
                    <span>🔒 微信安全支付</span>
                </div>
            </div>
        `;

        setTimeout(() => {
            if (pendingVipPlan.type === 'lifetime') {
                purchaseVip('lifetime', -1);
            } else {
                purchaseVip(pendingVipPlan.type, pendingVipPlan.duration);
            }
            container.innerHTML = `
                <div class="wxpay-container">
                    <div class="wxpay-header">
                        <span class="wxpay-title">支付成功</span>
                    </div>
                    <div class="wxpay-body" style="text-align:center;padding:40px 20px;">
                        <div style="font-size:56px;margin-bottom:12px;">✅</div>
                        <div style="font-size:20px;font-weight:700;color:#07C160;margin-bottom:4px;">支付成功</div>
                        <div style="font-size:14px;color:#999;margin-bottom:24px;">${pendingVipPlan.name}已开通，感谢支持</div>
                        <button class="wxpay-btn" onclick="closePaymentModal()" style="display:inline-flex;">完成</button>
                    </div>
                    <div class="wxpay-footer">
                        <span>🔒 微信安全支付</span>
                    </div>
                </div>
            `;
        }, 2000);
    }

    // ⭐ 重试支付
    function retryPayment() {
        if (!pendingVipPlan) return;
        const overlay = document.getElementById('paymentOverlay');
        overlay.style.display = 'none';
        setTimeout(() => {
            if (pendingVipPlan) {
                const planMap = { monthly: 'monthly', yearly: 'yearly', lifetime: 'lifetime' };
                openPaymentModal(planMap[pendingVipPlan.type] || 'monthly');
            }
        }, 100);
    }

    // ⭐ 发送购买VIP请求
    function purchaseVip(vipType, duration) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }

        socket.send(JSON.stringify({
            type: "activateVip",
            vipType: vipType,
            duration: duration
        }));

        console.log(`💎 申请激活${vipType}会员`);
    }

    // ⭐ 查询会员状态
    function queryVipStatus() {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
            
        socket.send(JSON.stringify({
            type: "queryVipStatus"
        }));
    }
        
    // ⭐ 更新会员显示
// ⭐ 更新会员显示
function updateVipDisplay(vipData) {
    const usernameElement = document.getElementById('ucUsername');
    if (!usernameElement) return;

    let vipBadge = usernameElement.querySelector('.vip-badge');
    
    const now = Date.now();
    const isLifetime = vipData.vipType === 'lifetime';
    const isVipValid = isLifetime || (vipData.isVip && vipData.expireTime > now);
    
    if (isVipValid) {
        if (!vipBadge) {
            vipBadge = document.createElement('span');
            vipBadge.className = 'vip-badge';
            usernameElement.appendChild(vipBadge);
        }
        vipBadge.textContent = isLifetime ? '👑 终身' : '👑 VIP';

        if (!isLifetime) {
            const remaining = vipData.expireTime - now;
            const days = Math.ceil(remaining / (24 * 3600000));
            console.log(`💎 会员有效，剩余: ${days}天`);
        } else {
            console.log(`💎 终身会员有效`);
        }
    } else {
        if (vipBadge) vipBadge.remove();
        if (currentUser) currentUser.isVip = false;
    }
}

    // ==================== ⭐ 用户中心和气泡互动相关 ====================

    // 切换添加菜单
    function toggleAddMenu() {
        const menu = document.getElementById('addMenu');
        if (menu.style.display === 'none' || menu.style.display === '') {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    }

    // 点击其他地方关闭菜单
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('addMenu');
        const menuBtn = event.target.closest('.uc-menu-wrapper');

        if (!menuBtn && menu && menu.style.display === 'block') {
            menu.style.display = 'none';
        }
    });

    // 添加好友（待开发）
    function addFriend() {
        document.getElementById('addMenu').style.display = 'none';
    }

    // 发起群聊（待开发）
    function createGroupChat() {
        document.getElementById('addMenu').style.display = 'none';
    }

    // 切换用户名片卡展开/收起
    function toggleUserCard() {
        const container = document.getElementById('userCardContainer');
        const btn = document.getElementById('chatDropdownBtn');

        container.classList.toggle('expanded');
        btn.classList.toggle('rotated');
    }

    // 更新用户名片卡信息（在打开聊天窗口时调用）
    function updateUserCard(user) {
        console.log('📇 更新名片卡:', user);

        if (!user) {
            console.error('❌ 用户数据为空');
            return;
        }

        // 更新大头像
        document.getElementById('userCardAvatar').innerHTML = renderAvatarPreview(user.avatar || '👤');

        // 更新用户名
        document.getElementById('userCardName').textContent = user.username || '未知用户';

        // 更新用户ID
        document.getElementById('userCardId').textContent = 'ID: ' + (user.userId || user.id || '未知');

        // 更新个人简介
        const bioText = user.bio || '这个人很懒，什么都没有留下～';
        document.getElementById('userCardBio').innerHTML = `“${escapeHtml(bioText).replace(/\n/g, '<br>')}”`;

        // 更新性别
        const genderMap = {
            '男': { icon: '👨', text: '男' },
            '女': { icon: '👩', text: '女' },
            '保密': { icon: '🔒', text: '保密' }
        };
        const gender = genderMap[user.gender] || genderMap['保密'];
        document.getElementById('userCardGender').innerHTML = `
            <span class="detail-icon">${gender.icon}</span>
            <span class="detail-text">${gender.text}</span>
        `;

        // 更新生日
        const birthday = user.birthday ? new Date(user.birthday).toLocaleDateString('zh-CN') : '未设置';
        document.getElementById('userCardBirthday').innerHTML = `
            <span class="detail-icon">🎂</span>
            <span class="detail-text">${birthday}</span>
        `;

        // 更新地区
        const region = user.region || '未设置';
        document.getElementById('userCardRegion').innerHTML = `
            <span class="detail-icon">📍</span>
            <span class="detail-text">${region}</span>
        `;

        // 更新状态
        const statusMap = {
            1: { icon: '🎉', text: '空闲可约' },
            2: { icon: '🚶', text: '正在路上' },
            3: { icon: '🎪', text: '活动ing' },
            4: { icon: '🤝', text: '乐于助人' },
            5: { icon: '👥', text: '寻找同伴' },
            6: { icon: '🔕', text: '暂时勿扰' }
        };
        const status = statusMap[user.status] || statusMap[2];
        document.getElementById('userCardStatus').innerHTML = `
            <span class="detail-icon">${status.icon}</span>
            <span class="detail-text">${status.text}</span>
        `;

        // 更新VIP标识
        const vipBadge = document.getElementById('userCardVipBadge');
        if (user.isVip) {
            vipBadge.style.display = 'inline-block';
        } else {
            vipBadge.style.display = 'none';
        }

        console.log('✅ 名片卡更新完成');
    }

    // 添加好友（待实现）
    function addFriendFromCard() {
    }

    // 举报用户（待实现）
    function reportUser() {
    }

