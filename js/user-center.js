// 打开用户中心


    // ==================== ⭐ v9.4.0: 私聊系统 JavaScript 函数 ====================

    // 全局变量
    let currentChatUserId = null;
    let currentChatUserName = '';
    let currentChatUserAvatar = '';
    let chatUnreadCount = 0;

    // 群聊全局变量
    let currentChatGroupId = null;
    let currentChatGroupName = '';
    let currentChatGroupAvatar = '';
    let currentChatGroupOwner = null;

    // 打开私聊列表
    /**
     * 打开私聊列表面板
     * 同时拉取聊天列表与未读数
     */
    function openChatList() {
        document.getElementById('chatListOverlay').style.display = 'flex';
        switchChatTab('friend');
        queryPrivateChats();
        queryPrivateUnreadCount();
        queryFriends();
        queryMyGroups();
        console.log('💬 打开私聊列表');
    }

    // 切换好友/群聊选项卡
    function switchChatTab(tab) {
        const friendTab = document.getElementById('chatFriendTab');
        const dmTab = document.getElementById('chatDMTab');
        const groupTab = document.getElementById('chatGroupTab');
        const btns = document.querySelectorAll('.chat-tab-btn');
        btns.forEach(b => b.classList.remove('active'));
        friendTab.style.display = 'none';
        dmTab.style.display = 'none';
        groupTab.style.display = 'none';
        if (tab === 'friend') {
            friendTab.style.display = 'flex';
            btns[0]?.classList.add('active');
        } else if (tab === 'dm') {
            dmTab.style.display = 'flex';
            btns[1]?.classList.add('active');
            queryPrivateChats();
        } else {
            groupTab.style.display = 'flex';
            btns[2]?.classList.add('active');
            queryMyGroups();
        }
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
        const friendContainer = document.getElementById('friendChatList');
        const dmContainer = document.getElementById('chatList');

        let friendHtml = '';
        let dmHtml = '';

        if (!chats || chats.length === 0) {
            if (friendContainer) friendContainer.innerHTML = '<div class="uc-empty">暂无好友聊天<br><small style="color: var(--text-tertiary); font-size: 12px; margin-top: 10px; display: block;">与好友的聊天记录会显示在这里</small></div>';
            if (dmContainer) dmContainer.innerHTML = '<div class="uc-empty">暂无私信<br><small style="color: var(--text-tertiary); font-size: 12px; margin-top: 10px; display: block;">与非好友的聊天记录会显示在这里</small></div>';
            return;
        }

        chats.forEach(chat => {
            const isBase64 = chat.avatar && chat.avatar.startsWith('data:image');
            const avatarHTML = isBase64 
                ? `<img src="${chat.avatar}">`
                : chat.avatar || '👤';
            
            const lastMsgPrefix = chat.isSentByMe ? '我: ' : '';
            const lastMsgText = chat.lastMessage.length > 30 
                ? chat.lastMessage.substring(0, 30) + '...' 
                : chat.lastMessage;
            
            const item = `
                <div class="chat-item" onclick="openChatWithUser('${chat.userId}', '${escapeHtml(chat.username)}', '${escapeAttr(chat.avatar || '👤')}')">
                    <div class="chat-avatar">${avatarHTML}</div>
                    <div class="chat-info">
                        <div class="chat-name">${escapeHtml(chat.username)}</div>
                        <div class="chat-last-message">${lastMsgPrefix}${escapeHtml(lastMsgText)}</div>
                    </div>
                    ${chat.unreadCount > 0 ? `<div class="chat-unread">${chat.unreadCount > 99 ? '99+' : chat.unreadCount}</div>` : ''}
                </div>
            `;

            if (chat.isFriend) {
                friendHtml += item;
            } else {
                dmHtml += item;
            }
        });

        if (friendContainer) {
            friendContainer.innerHTML = friendHtml || '<div class="uc-empty">暂无好友聊天</div>';
        }
        if (dmContainer) {
            dmContainer.innerHTML = dmHtml || '<div class="uc-empty">暂无私信<br><small style="color: var(--text-tertiary); font-size: 12px; margin-top: 10px; display: block;">与非好友的聊天记录会显示在这里</small></div>';
        }
        console.log(`✅ 显示 ${chats.length} 个私聊会话（好友: ${chats.filter(c => c.isFriend).length}, 私信: ${chats.filter(c => !c.isFriend).length}）`);
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
    openSelfChat();
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
    openSelfChat();
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
        document.getElementById('privateChatInput').placeholder = '输入消息...';
        currentChatUserId = null;
        // 返回私聊列表
        openChatList();
    }

    // ⭐ 自聊：打开与自己的对话
    function openSelfChat() {
        if (!currentUser) return;

        currentChatUserId = 'self';
        currentChatUserName = '我';
        currentChatUserAvatar = currentUser.avatar || '👤';

        document.getElementById('chatListOverlay').style.display = 'none';
        document.getElementById('chatOverlay').style.display = 'flex';

        const avatarHTML = renderAvatarPreview(currentUser.avatar || '👤');
        document.getElementById('chatUserAvatar').innerHTML = avatarHTML;
        document.getElementById('chatUserName').textContent = '我';
        document.getElementById('chatUserName').title = '与自己的对话';

        document.getElementById('privateChatInput').value = '';
        document.getElementById('privateChatInput').placeholder = '记下点什么...';

        displaySelfMessages();
        updateUserCard(currentUser);

        console.log('💬 打开与自己的对话');
    }

    // ⭐ 自聊：获取本地存储的消息
    function getSelfMessages() {
        if (!currentUser) return [];
        try {
            const key = 'selfChat_' + currentUser.id;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    // ⭐ 自聊：保存消息到本地存储
    function saveSelfMessages(messages) {
        if (!currentUser) return;
        try {
            const key = 'selfChat_' + currentUser.id;
            localStorage.setItem(key, JSON.stringify(messages));
        } catch (e) {
            console.error('❌ 保存自聊消息失败:', e);
        }
    }

    // ⭐ 自聊：显示消息
    function displaySelfMessages() {
        const container = document.getElementById('privateChatMessages');
        const messages = getSelfMessages();

        if (messages.length === 0) {
            container.innerHTML = '<div class="uc-empty" style="color: var(--text-tertiary); padding: 40px 20px;">记录你的想法<br><small style="font-size: 12px; margin-top: 10px; display: block;">给自己留言</small></div>';
            return;
        }

        let html = '';
        messages.forEach(msg => {
            const timeStr = formatTimeSimple(msg.created_at);
            html += `
                <div class="message-item message-sent">
                    <div class="message-content">
                        ${escapeHtml(msg.message)}
                        <div class="message-time">${timeStr}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
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
    
        if (!message) return;
    
        if (!currentChatUserId) return;

        // ⭐ 自聊：本地存储
        if (currentChatUserId === 'self') {
            const messages = getSelfMessages();
            messages.push({
                id: 'self_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                from_user_id: currentUser.id,
                to_user_id: currentUser.id,
                message: message,
                created_at: new Date().toISOString()
            });
            saveSelfMessages(messages);

            input.value = '';
            displaySelfMessages();

            // 刷新私聊列表中的自聊预览
            if (document.getElementById('chatListOverlay').style.display === 'flex') {
                queryPrivateChats();
            }

            console.log('💬 保存自聊消息');
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

    // ==================== ⭐ vA1.2: 群聊系统 ====================

    // 查询我的群聊列表
    function queryMyGroups() {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ type: "queryMyGroups" }));
        console.log('💬 查询群聊列表');
    }

    // 显示群聊列表
    function displayMyGroups(groups) {
        window.cachedGroups = groups || [];
        const container = document.getElementById('groupList');
        if (!container) return;
        if (!groups || groups.length === 0) {
            container.innerHTML = '<div class="uc-empty" style="padding:30px 20px;text-align:center;color:var(--text-tertiary);font-size:13px;">暂无群聊<br><small style="font-size:12px;margin-top:8px;display:block;">点击上方➕创建群聊</small></div>';
            return;
        }
        let html = '';
        groups.forEach(g => {
            const memberInfo = g.member_count ? `${g.member_count}人` : '';
            const lastMsg = g.last_message 
                ? (g.last_sender ? `${g.last_sender}: ${g.last_message.length > 20 ? g.last_message.substring(0, 20) + '...' : g.last_message}` : g.last_message.length > 20 ? g.last_message.substring(0, 20) + '...' : g.last_message)
                : '';
            html += `
                <div class="chat-item" onclick="openGroupChat(${g.id})">
                    <div class="chat-avatar">${renderAvatarPreview(g.avatar || '💬')}</div>
                    <div class="chat-info">
                        <div class="chat-name">${escapeHtml(g.name)} <span style="font-size:11px;color:var(--text-tertiary);font-weight:400;">${memberInfo}</span></div>
                        <div class="chat-last-message">${escapeHtml(lastMsg)}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        console.log(`✅ 显示 ${groups.length} 个群聊`);
    }

    // 查询群消息历史
    function queryGroupMessages(groupId) {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ type: "queryGroupMessages", groupId }));
        console.log(`💬 查询群聊 ${groupId} 的消息`);
    }

    // 显示群消息（采用与公屏相同的聊天气泡设计）
    function displayGroupMessages(groupId, messages) {
        const container = document.getElementById('groupChatMessages');
        if (!container) return;
        if (!messages || messages.length === 0) {
            container.innerHTML = '<div class="uc-empty" style="color: var(--text-tertiary); padding: 40px 20px;">暂无消息<br><small style="font-size: 12px; margin-top: 10px; display: block;">发送消息开始群聊</small></div>';
            return;
        }
        let html = '';
        messages.forEach(msg => {
            const isSentByMe = msg.user_id === currentUser.id;
            const rowClass = isSentByMe ? 'message-row self' : 'message-row other';
            const name = isSentByMe ? '我' : (msg.username || '未知用户');
            let avatarHtml = '👤';
            if (msg.avatar) {
                const isBase64 = msg.avatar.startsWith('data:image');
                avatarHtml = isBase64 
                    ? `<img src="${msg.avatar}">` 
                    : msg.avatar;
            }
            html += `
                <div class="${rowClass}">
                    <div class="message-package">
                        <div class="message-pill">
                            <div class="pill-top">
                                <div class="user-badge">
                                    <div class="avatar-circle">${avatarHtml}</div>
                                    <span class="badge-id">${escapeHtml(name)}</span>
                                </div>
                            </div>
                            <div class="pill-content">
                                <div class="bubble-text">${escapeHtml(msg.message)}</div>
                            </div>
                        </div>
                        <div class="time-stamp">${formatTime(msg.created_at)}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        setTimeout(() => { container.scrollTop = container.scrollHeight; }, 100);
        console.log(`✅ 显示 ${messages.length} 条群消息`);
    }

    // 发送群消息
    function sendGroupMessage() {
        const input = document.getElementById('groupChatInput');
        const message = input.value.trim();
        if (!message || !currentChatGroupId) return;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({
            type: "sendGroupMessage",
            groupId: currentChatGroupId,
            message: message
        }));
        input.value = '';
        console.log(`💬 发送群消息到 ${currentChatGroupId}: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`);
    }

    // 打开群聊窗口
    function openGroupChat(groupId) {
        if (!groupId) return;
        currentChatGroupId = Number(groupId);
        const cached = (window.cachedGroups || []).find(g => g.id === currentChatGroupId);
        currentChatGroupName = cached ? (cached.name || '') : '';
        currentChatGroupAvatar = cached ? (cached.avatar || '💬') : '💬';
        currentChatGroupOwner = cached ? (cached.creator_id || null) : null;
        document.getElementById('chatListOverlay').style.display = 'none';
        document.getElementById('groupChatOverlay').style.display = 'flex';
        var avatarEl = document.getElementById('groupChatUserAvatar');
        if (avatarEl) avatarEl.innerHTML = renderAvatarPreview(currentChatGroupAvatar);
        const nameEl = document.getElementById('groupChatUserName');
        if (nameEl) nameEl.textContent = currentChatGroupName || '群聊';
        document.getElementById('groupChatInput').value = '';
        queryGroupMessages(currentChatGroupId);
        queryGroupMembers(currentChatGroupId);
        updateGroupInfoButton();
        console.log(`💬 打开群聊 ${currentChatGroupName} (${currentChatGroupId})`);
    }

    // 更新群聊信息按钮状态（是否显示群主操作）
    function updateGroupInfoButton() {
        const btn = document.getElementById('groupInfoBtn');
        if (!btn) return;
        btn.style.display = 'flex';
    }

    // 打开群聊信息面板
    function openGroupInfo() {
        if (!currentChatGroupId) return;
        const overlay = document.getElementById('groupInfoOverlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        document.getElementById('groupInfoName').textContent = currentChatGroupName || '群聊';
        document.getElementById('groupInfoAvatar').innerHTML = renderAvatarPreview(currentChatGroupAvatar || '💬');
        const isOwner = currentUser && currentChatGroupOwner === currentUser.id;
        document.getElementById('groupInfoOwnerBadge').style.display = isOwner ? 'inline-block' : 'none';
        document.getElementById('groupInfoOwnerActions').style.display = isOwner ? 'flex' : 'none';
        document.getElementById('groupInfoLeaveBtn').style.display = isOwner ? 'none' : 'flex';
        queryGroupMembers(currentChatGroupId);
    }

    // 关闭群聊信息面板
    function closeGroupInfo() {
        const overlay = document.getElementById('groupInfoOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    // 关闭群聊窗口
    function closeGroupChat() {
        document.getElementById('groupChatOverlay').style.display = 'none';
        document.getElementById('groupInfoOverlay').style.display = 'none';
        currentChatGroupId = null;
        currentChatGroupName = '';
        currentChatGroupAvatar = '';
        currentChatGroupOwner = null;
        openChatList();
    }

    // 查询群成员
    function queryGroupMembers(groupId) {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({ type: "queryGroupMembers", groupId }));
    }

    // 显示群成员
    function displayGroupMembers(groupId, members) {
        const container = document.getElementById('groupInfoMemberList');
        if (!container) return;
        window.cachedGroupMembers = members || [];
        if (!members || members.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:15px;color:var(--text-tertiary);font-size:13px;">暂无成员</div>';
            return;
        }
        const isOwner = currentUser && currentChatGroupOwner === currentUser.id;
        container.innerHTML = members.map(m => {
            const avatarHTML = m.avatar && m.avatar.startsWith('data:image')
                ? `<img src="${m.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">`
                : `<span style="font-size:28px;">${m.avatar || '👤'}</span>`;
            const isSelf = currentUser && m.userId === currentUser.id;
            const isGroupOwner = currentChatGroupOwner === m.userId;
            return `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;margin-bottom:4px;background:var(--bg-secondary,#f5f5f5);">
                    <div style="position:relative;">
                        ${avatarHTML}
                        <span style="position:absolute;bottom:0;right:-2px;width:10px;height:10px;border-radius:50%;border:2px solid var(--card-bg,#fff);background:${m.isOnline ? '#4CAF50' : '#ccc'};"></span>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:500;font-size:13px;color:var(--text-primary);">
                            ${escapeHtml(m.username)} ${isGroupOwner ? '<span style="font-size:11px;color:#FFD700;font-weight:600;">👑</span>' : ''} ${isSelf ? '<span style="font-size:11px;color:var(--text-tertiary);">(我)</span>' : ''}
                        </div>
                    </div>
                    ${isOwner && !isGroupOwner && !isSelf ? `<button onclick="kickGroupMember('${m.userId}')" style="padding:4px 10px;border:none;border-radius:6px;background:#ff6b6b;color:#fff;font-size:11px;cursor:pointer;">踢出</button>` : ''}
                </div>
            `;
        }).join('');
        document.getElementById('groupInfoMemberCount').textContent = `${members.length} 名成员`;
    }

    // 踢出群成员
    function kickGroupMember(targetUserId) {
        if (!currentChatGroupId || !targetUserId) return;
        if (!confirm('确定要踢出该成员吗？')) return;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({
            type: "kickGroupMember",
            groupId: currentChatGroupId,
            targetUserId: targetUserId
        }));
    }

    // 解散群聊
    function dissolveGroup() {
        if (!currentChatGroupId) return;
        if (!confirm('确定要解散群聊吗？此操作不可恢复！')) return;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({
            type: "dissolveGroup",
            groupId: currentChatGroupId
        }));
    }

    // 退出群聊
    function leaveGroup() {
        if (!currentChatGroupId) return;
        if (!confirm('确定要退出群聊吗？')) return;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify({
            type: "leaveGroup",
            groupId: currentChatGroupId
        }));
    }

    // 更新群信息（名称/头像）
    function updateGroupInfo() {
        if (!currentChatGroupId) return;
        const overlay = document.getElementById('groupEditOverlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        document.getElementById('groupEditNameInput').value = currentChatGroupName || '';
    }

    // 关闭编辑群信息面板
    function closeGroupEdit() {
        const overlay = document.getElementById('groupEditOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    // 确认更新群信息
    function confirmUpdateGroupInfo() {
        const name = document.getElementById('groupEditNameInput').value.trim();
        if (!name) { showToast('请输入群聊名称'); return; }
        if (!socket || socket.readyState !== WebSocket.OPEN) { showToast('网络未连接'); return; }
        socket.send(JSON.stringify({
            type: "updateGroupInfo",
            groupId: currentChatGroupId,
            name: name
        }));
        document.getElementById('groupEditOverlay').style.display = 'none';
        showToast('正在更新群信息...');
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
        if (typeof refreshHeaderBadge === 'function') refreshHeaderBadge();
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
    window._skipBubbleRestore = true;
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
            <span style="font-size: 24px; display: flex; align-items: center;">${renderAvatarPreview(bubbleAvatar || '👤', 24)}</span>
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

    // 从缓存渲染个人中心
    function renderUserCenterFromCache(cache) {
        if (!cache) return;
        console.log('📦 从缓存渲染个人中心数据');

        // 1. 统计数据
        if (cache.userStats) {
            const stats = cache.userStats;
            const publishedEl = document.getElementById('publishedCount');
            if (publishedEl) publishedEl.textContent = stats.publishedCount || 0;
            const likesEl = document.getElementById('likesCount');
            if (likesEl) likesEl.textContent = stats.likesCount || 0;
            const favoritesEl = document.getElementById('favoritesCount');
            if (favoritesEl) favoritesEl.textContent = stats.favoritesCount || 0;
            const commentsEl = document.getElementById('commentsCount');
            if (commentsEl) commentsEl.textContent = stats.commentsCount || 0;
        }

        // 2. 发布记录
        if (cache.userPublished) {
            displayPublishedList(cache.userPublished);
        }

        // 3. 收件箱未读数
        if (cache.inboxUnread) {
            updateInboxBadge(cache.inboxUnread.total || 0);
            const counts = cache.inboxUnread.counts || {};
            const likeBadge = document.getElementById('tabLikeBadge');
            if (likeBadge) {
                const likeCount = counts.like || 0;
                likeBadge.textContent = likeCount;
                likeBadge.style.display = likeCount > 0 ? 'inline-block' : 'none';
            }
            const favoriteBadge = document.getElementById('tabFavoriteBadge');
            if (favoriteBadge) {
                const favCount = counts.favorite || 0;
                favoriteBadge.textContent = favCount;
                favoriteBadge.style.display = favCount > 0 ? 'inline-block' : 'none';
            }
            const commentBadge = document.getElementById('tabCommentBadge');
            if (commentBadge) {
                const cmtCount = counts.comment || 0;
                commentBadge.textContent = cmtCount;
                commentBadge.style.display = cmtCount > 0 ? 'inline-block' : 'none';
            }
            const friendBadge = document.getElementById('tabFriendRequestBadge');
            if (friendBadge) {
                const frCount = counts.friend_request || 0;
                friendBadge.textContent = frCount;
                friendBadge.style.display = frCount > 0 ? 'inline-block' : 'none';
            }
        }

        // 4. VIP状态
        if (cache.vipStatus) {
            updateVipDisplay(cache.vipStatus);
        }

        // 5. 子标签页缓存（打开对应标签时使用）
        if (cache.userLikes && document.getElementById('uc-likes')) {
            const container = document.getElementById('uc-likes');
            if (container && container.getAttribute('data-from-cache') !== 'true') {
                container.setAttribute('data-cached-data', JSON.stringify(cache.userLikes));
                container.setAttribute('data-from-cache', 'true');
            }
        }
        if (cache.userFavorites && document.getElementById('uc-favorites')) {
            const container = document.getElementById('uc-favorites');
            if (container && container.getAttribute('data-from-cache') !== 'true') {
                container.setAttribute('data-cached-data', JSON.stringify(cache.userFavorites));
                container.setAttribute('data-from-cache', 'true');
            }
        }
        if (cache.userComments && document.getElementById('uc-comments')) {
            const container = document.getElementById('uc-comments');
            if (container && container.getAttribute('data-from-cache') !== 'true') {
                container.setAttribute('data-cached-data', JSON.stringify(cache.userComments));
                container.setAttribute('data-from-cache', 'true');
            }
        }
        if (cache.userViews && document.getElementById('uc-history')) {
            const container = document.getElementById('uc-history');
            if (container && container.getAttribute('data-from-cache') !== 'true') {
                container.setAttribute('data-cached-data', JSON.stringify(cache.userViews));
                container.setAttribute('data-from-cache', 'true');
            }
        }
    }

    // 打开用户中心
    function openUserCenter() {
        const overlay = document.getElementById('userCenterOverlay');
        overlay.style.display = 'flex';
        overlay.classList.add('show');
        setBottomNavActive('mobileUserButton');

        // ⭐ 先从本地缓存渲染，保证秒开
        const cached = getCachedUserCenterData();
        if (cached) {
            renderUserCenterFromCache(cached);
        }

        // ⭐ 更新用户信息（来自内存，即时显示）
        if (currentUser) {
            updateAvatarDisplay(currentUser.avatar || '👤');
            document.getElementById('ucUsername').textContent = currentUser.nickname || currentUser.username;
            document.getElementById('ucUserId').textContent = 'ID: ' + currentUser.id;
            updateUserDetails();
        }

        // 首次打开先给基础占位
        const publishedEl = document.getElementById('uc-published');
        if (publishedEl && !publishedEl.innerHTML.trim()) {
            publishedEl.innerHTML = '<div class="uc-empty">暂无发布记录</div>';
        }

        // ⭐ 每次打开都从服务器拉取一次完整个人中心数据并缓存
        if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
            socket.send(JSON.stringify({ type: "getUserCenterData" }));
        }

        console.log('📊 打开用户中心');
    }
    
    // ⭐ v9.6.6: 更新用户详细信息（性别、年龄、地区、简介）
    function updateUserDetails() {
        if (!currentUser) return;
        
        const detailsEl = document.getElementById('ucUserDetails');
        const bioEl = document.getElementById('ucBio');
        
        let detailsHTML = '';
        
        // 性别（点击跳转性别设置）
        if (currentUser.gender && (currentUser.gender === '男' || currentUser.gender === '女')) {
            const genderClass = currentUser.gender === '男' ? 'male' : 'female';
            const genderSymbol = currentUser.gender === '男' ? '♂' : '♀';
            detailsHTML += `<span class="uc-gender ${genderClass}" onclick="editGender()" style="cursor:pointer;" title="点击修改性别">${genderSymbol}</span>`;
        }
        
        // 年龄（点击跳转生日设置）
        if (currentUser.birthday) {
            const age = calculateAge(currentUser.birthday);
            if (age > 0) {
                detailsHTML += `<span class="uc-age" onclick="editBirthday()" style="cursor:pointer;" title="点击修改生日">${age}岁</span>`;
            }
        }
        
        // 地区（点击跳转地区设置）
        if (currentUser.region && currentUser.region !== '未设置') {
            detailsHTML += `<span class="uc-region" onclick="editRegion()" style="cursor:pointer;" title="点击修改地区">${currentUser.region}</span>`;
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
    function renderAvatarPreview(avatar, size = 32) {
        if (!avatar) return '👤';
    
        const isBase64 = avatar && avatar.startsWith('data:image');
        if (isBase64) {
    return `<img src="${avatar}" style="width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover;">`;
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
    
        // Emoji 列表（扩展到 120 个）
        const emojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇',
    '🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚',
    '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩',
    '🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣',
    '😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬',
    '🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗',
    '🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯',
    '😦','😧','😮','😲','😴','🤤','😪','😵','🤐','🥴',
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
    '🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆',
    '🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋',
    '🐌','🐞','🐜','🪲','🪳','🐢','🐍','🦎','🦂','🦀',
    '🐙','🦑','🦐','🦞','🐠','🐟','🐡','🦈','🐬','🐳',
    '🐋','🦒','🐘','🦏','🦛','🐪','🐫','🦙','🦘','🐃',
    '🐂','🐄','🐎','🐖','🐐','🐏','🐑','🐕','🐩','🐈',
    '🌟','✨','⚡','🔥','💥','💫','⭐','🌈','☀️','🌤️'
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

            <div style="font-size: 60px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center;" id="avatarPreview">${renderAvatarPreview(currentUser.avatar, 60)}</div>
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
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
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
            if ((opt.textContent || '').trim() === emoji) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    
        // 预览 - 修改这里
        document.getElementById('avatarPreview').innerHTML = renderAvatarPreview(emoji);
    }


    // 触发文件上传
    function triggerAvatarUpload() {
        document.getElementById('avatarFileInput').click();
    }

    // 处理头像上传（支持裁剪）
    function handleAvatarUpload(input) {
        var file = input.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) return;

        var reader = new FileReader();
        reader.onload = function (e) {
            var imgSrc = e.target.result;
            if (typeof Cropper !== 'undefined') {
                showCropModal(imgSrc, function (croppedBase64) {
                    selectedAvatar = croppedBase64;
                    var preview = document.getElementById('avatarPreview');
                    preview.innerHTML = '<img src="' + croppedBase64 + '" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">';
                });
            } else {
                processImageDirectly(imgSrc, function (base64) {
                    selectedAvatar = base64;
                    var preview = document.getElementById('avatarPreview');
                    preview.innerHTML = '<img src="' + base64 + '" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">';
                });
            }
        };
        reader.readAsDataURL(file);
        input.value = '';
    }

    // 直接处理（无裁剪库时回退）
    function processImageDirectly(imgSrc, callback) {
        var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            var size = 100;
            canvas.width = size;
            canvas.height = size;
            var ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, 0, 0, size, size);
            var base64 = canvas.toDataURL('image/jpeg', 0.7);
            if (typeof callback === 'function') callback(base64);
        };
        img.src = imgSrc;
    }

    // Cropper.js 裁剪弹窗
    function showCropModal(imgSrc, onCropDone) {
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML =
            '<div style="background:var(--card-bg,#fff);border-radius:16px;width:92%;max-width:400px;overflow:hidden;animation:slideUp 0.25s ease;display:flex;flex-direction:column;">' +
                '<div style="padding:16px 20px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;">' +
                    '<span style="font-weight:600;font-size:16px;">裁剪头像</span>' +
                    '<button id="cropCloseBtn" style="width:30px;height:30px;border:none;background:#f0f0f0;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>' +
                '</div>' +
                '<div style="padding:16px;background:#f5f5f5;">' +
                    '<div style="max-height:50vh;overflow:hidden;">' +
                        '<img id="cropImage" style="max-width:100%;display:block;">' +
                    '</div>' +
                '</div>' +
                '<div style="padding:12px 16px;border-top:1px solid #eee;display:flex;gap:10px;">' +
                    '<button id="cropCancelBtn" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:10px;background:#fff;color:#666;font-weight:600;cursor:pointer;">取消</button>' +
                    '<button id="cropConfirmBtn" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-weight:600;cursor:pointer;">确认</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        var imgEl = document.getElementById('cropImage');
        imgEl.src = imgSrc;

        var cropper = null;

        function initCropper() {
            try {
                if (cropper) cropper.destroy();
                cropper = new Cropper(imgEl, {
                    aspectRatio: 1,
                    viewMode: 1,
                    dragMode: 'move',
                    autoCropArea: 1,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    rotatable: true,
                    scalable: true,
                    zoomable: true,
                    minCropBoxWidth: 100,
                    minCropBoxHeight: 100
                });
            } catch (e) {
                processImageDirectly(imgSrc, onCropDone);
                overlay.remove();
            }
        }

        imgEl.onload = function () {
            if (typeof Cropper !== 'undefined') {
                initCropper();
            } else {
                processImageDirectly(imgSrc, onCropDone);
                overlay.remove();
            }
        };
        if (imgEl.complete) {
            if (typeof Cropper !== 'undefined') {
                setTimeout(initCropper, 50);
            } else {
                processImageDirectly(imgSrc, onCropDone);
                overlay.remove();
            }
        }

        function cleanup() {
            try { if (cropper) cropper.destroy(); } catch (e) {}
            overlay.remove();
        }

        document.getElementById('cropCloseBtn').onclick = cleanup;
        document.getElementById('cropCancelBtn').onclick = cleanup;
        document.getElementById('cropConfirmBtn').onclick = function () {
            if (!cropper) return;
            try {
                var canvas = cropper.getCroppedCanvas({ width: 200, height: 200, imageSmoothingQuality: 'high' });
                var size = 200;
                var roundCanvas = document.createElement('canvas');
                roundCanvas.width = size;
                roundCanvas.height = size;
                var rctx = roundCanvas.getContext('2d');
                rctx.beginPath();
                rctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                rctx.closePath();
                rctx.clip();
                rctx.drawImage(canvas, 0, 0, size, size);
                var base64 = roundCanvas.toDataURL('image/jpeg', 0.8);
                cleanup();
                if (typeof onCropDone === 'function') onCropDone(base64);
            } catch (e) {
                cleanup();
                processImageDirectly(imgSrc, onCropDone);
            }
        };
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) cleanup();
        });
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
    
        // 立即更新地图上的头像标记
        try { if (typeof updateMyMarker === 'function') updateMyMarker(); } catch (e) {}
    
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
                    img.style.width = '32px';
                    img.style.height = '32px';
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

    // ⭐ vA1.1: 添加好友（打开搜索弹窗）
    function addFriend() {
        document.getElementById('addMenu').style.display = 'none';
        const overlay = document.getElementById('friendAddOverlay');
        overlay.style.display = 'flex';
        document.getElementById('friendSearchInput').value = '';
        document.getElementById('friendSearchResults').innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">输入关键词搜索用户</div>';
        setTimeout(() => document.getElementById('friendSearchInput').focus(), 300);
    }

    // 发起群聊
    function createGroupChat() {
        document.getElementById('addMenu').style.display = 'none';
        const overlay = document.getElementById('groupCreateOverlay');
        overlay.style.display = 'flex';
        document.getElementById('groupNameInput').value = '';
        const container = document.getElementById('groupMemberList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">加载好友列表...</div>';
        }
        queryFriends();
        setTimeout(() => document.getElementById('groupNameInput').focus(), 300);
    }

    // 渲染好友复选框列表（用于创建群聊）
    function renderFriendCheckboxes() {
        const container = document.getElementById('groupMemberList');
        const friends = window.cachedFriends || [];
        if (friends.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">暂无好友，请先添加好友</div>';
            return;
        }
        container.innerHTML = friends.map(f => {
            const avatarHTML = f.avatar && f.avatar.startsWith('data:image')
                ? `<img src="${f.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">`
                : `<span style="font-size:28px;">${f.avatar || '👤'}</span>`;
            return `
                <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;cursor:pointer;transition:background 0.2s;"
                       onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
                    <input type="checkbox" value="${f.userId}" style="width:16px;height:16px;accent-color:#667eea;cursor:pointer;">
                    <div style="display:flex;align-items:center;gap:8px;flex:1;">
                        ${avatarHTML}
                        <span style="font-weight:500;font-size:14px;color:var(--text-primary);">${escapeHtml(f.username)}</span>
                    </div>
                </label>
            `;
        }).join('');
    }

    // 确认创建群聊
    function confirmCreateGroup() {
        const name = document.getElementById('groupNameInput').value.trim();
        if (!name) {
            showToast('请输入群聊名称');
            return;
        }
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            showToast('网络未连接');
            return;
        }
        const checkboxes = document.querySelectorAll('#groupMemberList input[type="checkbox"]:checked');
        const memberIds = Array.from(checkboxes).map(cb => cb.value);
        socket.send(JSON.stringify({
            type: "createGroup",
            name: name,
            memberIds: memberIds
        }));
        document.getElementById('groupCreateOverlay').style.display = 'none';
        showToast('正在创建群聊...');
    }

    // ⭐ vA1.3: 显示邀请成员弹窗
    function showInviteMembers() {
        if (!currentChatGroupId) return;
        const overlay = document.getElementById('groupInviteOverlay');
        if (!overlay) return;
        overlay.style.display = 'flex';
        const container = document.getElementById('groupInviteMemberList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">加载好友列表...</div>';
        }
        queryFriends();
    }

    // ⭐ vA1.3: 关闭邀请成员弹窗
    function closeGroupInvite() {
        const overlay = document.getElementById('groupInviteOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    // ⭐ vA1.3: 渲染邀请成员的好友复选框（排除已是群成员的好友）
    function renderInviteFriendCheckboxes() {
        const container = document.getElementById('groupInviteMemberList');
        if (!container) return;
        const friends = window.cachedFriends || [];
        const existingMemberIds = window.cachedGroupMembers ? window.cachedGroupMembers.map(m => m.userId) : [];
        const available = friends.filter(f => !existingMemberIds.includes(f.userId));
        if (available.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">没有可邀请的好友</div>';
            return;
        }
        container.innerHTML = available.map(f => {
            const avatarHTML = f.avatar && f.avatar.startsWith('data:image')
                ? `<img src="${f.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">`
                : `<span style="font-size:28px;">${f.avatar || '👤'}</span>`;
            return `
                <label style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;cursor:pointer;transition:background 0.2s;"
                       onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
                    <input type="checkbox" value="${f.userId}" style="width:16px;height:16px;accent-color:#43cea2;cursor:pointer;">
                    <div style="display:flex;align-items:center;gap:8px;flex:1;">
                        ${avatarHTML}
                        <span style="font-weight:500;font-size:14px;color:var(--text-primary);">${escapeHtml(f.username)}</span>
                    </div>
                </label>
            `;
        }).join('');
    }

    // ⭐ vA1.3: 确认邀请成员
    function confirmInviteMembers() {
        if (!currentChatGroupId) return;
        const checkboxes = document.querySelectorAll('#groupInviteMemberList input[type="checkbox"]:checked');
        const memberIds = Array.from(checkboxes).map(cb => cb.value);
        if (memberIds.length === 0) {
            showToast('请至少选择一位好友');
            return;
        }
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            showToast('网络未连接');
            return;
        }
        socket.send(JSON.stringify({
            type: "addGroupMembers",
            groupId: currentChatGroupId,
            memberIds: memberIds
        }));
        document.getElementById('groupInviteOverlay').style.display = 'none';
        showToast('正在邀请成员...');
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

        // 更新VIP标识
        const vipBadge = document.getElementById('userCardVipBadge');
        if (user.isVip) {
            vipBadge.style.display = 'inline-block';
        } else {
            vipBadge.style.display = 'none';
        }

        console.log('✅ 名片卡更新完成');
    }

    // ⭐ vA1.1: 从用户卡片添加好友
    function addFriendFromCard() {
        const userId = currentChatUserId;
        if (!userId || userId === 'self') return;
        sendFriendRequest(userId);
    }

    // 举报用户（待实现）
    function reportUser() {
    }

// ⭐ vA1.1: ==================== 好友系统 ====================

// 发送好友请求
function sendFriendRequest(toUserId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.log('⚠️ WebSocket未连接');
        if (typeof showToast === 'function') showToast('网络未连接');
        return;
    }
    socket.send(JSON.stringify({ type: "sendFriendRequest", toUserId }));
    console.log('📤 发送好友请求:', toUserId);
}

// 接受好友请求
function acceptFriendRequest(requestId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "acceptFriendRequest", requestId }));
    console.log('✅ 接受好友请求:', requestId);
}

// 拒绝好友请求
function rejectFriendRequest(requestId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "rejectFriendRequest", requestId }));
    console.log('❌ 拒绝好友请求:', requestId);
}

// 查询好友列表
function queryFriends() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "queryFriends" }));
}

// 查询待处理好友请求
function queryFriendRequests() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "queryFriendRequests" }));
}

// 搜索用户
function searchUserForFriend(keyword) {
    const container = document.getElementById('friendSearchResults');
    if (!keyword || keyword.length < 1) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">输入关键词搜索用户</div>';
        return;
    }
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;">搜索中...</div>';
    socket.send(JSON.stringify({ type: "queryUserForFriend", keyword }));
}

// 显示搜索用户结果
function displayUserSearchResults(users) {
    const container = document.getElementById('friendSearchResults');
    if (!container) return;
    if (!users || users.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-tertiary);font-size:13px;">未找到匹配的用户</div>';
        return;
    }
    container.innerHTML = users.map(u => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;margin-bottom:6px;background:var(--bg-secondary,#f5f5f5);transition:background 0.2s;"
             onmouseover="this.style.background='#eaeaea'" onmouseout="this.style.background='var(--bg-secondary,#f5f5f5)'">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:24px;">${u.avatar || '👤'}</span>
                <div>
                    <div style="font-weight:600;font-size:14px;color:var(--text-primary);">${escapeHtml(u.username)}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);">ID: ${u.id}</div>
                </div>
            </div>
            <button onclick="sendFriendRequest('${u.id}')"
                    style="padding:6px 14px;border:none;border-radius:8px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;font-size:12px;cursor:pointer;font-weight:500;">添加好友</button>
        </div>
    `).join('');
}

// 显示好友列表
function displayFriends(friends) {
    window.cachedFriends = friends || [];
    const container = document.getElementById('friendList');
    const section = document.getElementById('friendListSection');
    if (container && section) {
        if (!friends || friends.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            container.innerHTML = friends.map(f => {
                const avatarSafe = escapeAttr(f.avatar || '👤');
                const usernameSafe = escapeHtml(f.username).replace(/'/g, "\\'");
                const isBase64 = f.avatar && f.avatar.startsWith('data:image');
                const avatarHTML = isBase64 ? `<img src="${f.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">` : `<span style="font-size:28px;">${f.avatar || '👤'}</span>`;
                return `
                <div class="chat-item" onclick="openChatWithUser('${f.userId}','${usernameSafe}','${avatarSafe}')" style="cursor:pointer;">
                    <div style="display:flex;align-items:center;gap:10px;width:100%;">
                        <div style="position:relative;">
                            ${avatarHTML}
                            <span style="position:absolute;bottom:0;right:-2px;width:10px;height:10px;border-radius:50%;border:2px solid var(--card-bg,#fff);background:${f.isOnline ? '#4CAF50' : '#ccc'};"></span>
                        </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:600;font-size:14px;color:var(--text-primary);">${escapeHtml(f.username)}</div>
                </div>
                    </div>
                </div>`;
            }).join('');
        }
    }
    const groupOverlay = document.getElementById('groupCreateOverlay');
    if (groupOverlay && (groupOverlay.style.display === 'flex')) {
        renderFriendCheckboxes();
    }
    const inviteOverlay = document.getElementById('groupInviteOverlay');
    if (inviteOverlay && (inviteOverlay.style.display === 'flex')) {
        renderInviteFriendCheckboxes();
    }
}

// 显示好友请求列表
function displayFriendRequests(requests) {
    const container = document.getElementById('friendRequestList');
    const section = document.getElementById('friendRequestSection');
    if (!container || !section) return;
    if (!requests || requests.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    container.innerHTML = requests.map(r => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;margin-bottom:6px;background:var(--bg-secondary,#f5f5f5);">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:24px;">${r.fromUserAvatar || '👤'}</span>
                <div>
                    <div style="font-weight:600;font-size:14px;color:var(--text-primary);">${escapeHtml(r.fromUserName)}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);">请求加为好友</div>
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button onclick="acceptFriendRequest(${r.id})"
                        style="padding:5px 12px;border:none;border-radius:6px;background:#4CAF50;color:#fff;font-size:12px;cursor:pointer;">接受</button>
                <button onclick="rejectFriendRequest(${r.id})"
                        style="padding:5px 12px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#666;font-size:12px;cursor:pointer;">忽略</button>
            </div>
        </div>
    `).join('');
}

// ⭐ vA1.1: Toast提示（简易版）
function showToast(message, duration = 2500) {
    const existing = document.getElementById('globalToast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed;top:20px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.8);color:#fff;padding:10px 24px;
        border-radius:12px;font-size:14px;z-index:99999;
        animation:fadeIn 0.3s ease;max-width:80%;text-align:center;
        pointer-events:none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

