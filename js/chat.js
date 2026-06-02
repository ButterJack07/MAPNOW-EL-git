    function toggleChatPanel() {
        chatPanelVisible = !chatPanelVisible;
        const panel = document.getElementById('chatPanel');
        const chatBtn = document.getElementById('chatButton');
        const publishPanel = document.getElementById('publishPanel');
        const publishBtn = document.getElementById('publishButton');
            
        if (chatPanelVisible) {
            panel.classList.add('show');
            if (chatBtn) chatBtn.classList.add('active');
            setBottomNavActive('chatButton');
            unreadCount = 0;
            updateChatBadge();
            
            // ⭐ 关闭发布面板（互斥）
            if (publishPanel && publishPanel.classList.contains('show')) {
                publishPanel.classList.remove('show');
                if (publishBtn) publishBtn.classList.remove('active');
            }
            
            // 聚焦到当前激活选项卡的输入框
            const input = document.getElementById('input' + activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
            if (input) input.focus();
        } else {
            panel.classList.remove('show');
            if (chatBtn) chatBtn.classList.remove('active');
            setBottomNavActive(null);
        }
    }


    function handleChatKey(event, tabId) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage(tabId);
        }
    }


    function sendMessage(tabId) {
        const inputId = 'input' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
        const input = document.getElementById(inputId);
        let text = input.value.trim();
    
        // ⭐ 不允许发送空消息
        if (!text) return;
    
        if (!currentUser) {
            return;
        }
    
        // ⭐ 根据选项卡决定房间代码
        const roomCode = (tabId === 'public') ? '000000' : tabId;
        
        // ⭐ 构造消息（自动添加前缀，用户不可见）
        const fullText = '[' + roomCode + '] ' + text;
    
        // 生成消息ID
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sentMessageIds.add(messageId);
    
        // 立即显示自己的消息
        const localMsg = {
            id: messageId,
            from: currentUser.nickname,
            avatar: currentUser.avatar,
            text: fullText,
            time: Date.now(),
            isMyMessage: true
        };
    
        addChatMessage(localMsg);
    
        // 发送到服务器
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "publicChat",
                msg: fullText,
                messageId: messageId
            }));
            console.log("📤 发送消息:", fullText);
        }
    
        input.value = '';
        input.focus();
    }

    function addChatMessage(message) {
        // 检查重复
        if (message.id && sentMessageIds.has(message.id)) {
            console.log("⚠️ 消息已存在，跳过");
            return;
        }
    
        // ⭐ 系统消息添加到公屏
        if (message.isSystem) {
            tabs.public.messages.push(message);
            if (tabs.public.messages.length > 100) {
                tabs.public.messages = tabs.public.messages.slice(-100);
            }
            renderMessages('public');
            scrollToBottom('public');
            return;
        }
    
        // 解析房间代码
        const text = message.text || '';
        const match = text.match(/^\[(\d{6})\]\s+/);
        
        if (!match) {
            console.log('⚠️ 无前缀消息，忽略');
            return;
        }
        
        const roomCode = match[1];
        const content = text.substring(match[0].length).trim();
        
        // 检查内容不为空
        if (!content) {
            console.log('⚠️ 消息无内容，跳过');
            return;
        }
        
        // ⭐ 分配到对应选项卡
        if (roomCode === '000000') {
            // 公屏消息
            tabs.public.messages.push(message);
            if (tabs.public.messages.length > 100) {
                tabs.public.messages = tabs.public.messages.slice(-100);
            }
            renderMessages('public');
            scrollToBottom('public');
            
            // 未读提示
            if (!chatPanelVisible || activeTab !== 'public') {
                if (!message.isMyMessage) {
                    unreadCount++;
                    updateChatBadge();
                }
            }
        } else {
            // 聊天室消息
            // ⭐ v9.6.5: 只有当用户已加入该聊天室（选项卡已存在）时才接收消息
            if (!tabs[roomCode]) {
                // 不自动创建选项卡，只在用户主动加入时创建
                console.log(`📭 收到聊天室 ${roomCode} 的消息，但用户未加入该聊天室，忽略`);
                return;
            }
            
            tabs[roomCode].messages.push(message);
            if (tabs[roomCode].messages.length > 100) {
                tabs[roomCode].messages = tabs[roomCode].messages.slice(-100);
            }
            renderMessages(roomCode);
            scrollToBottom(roomCode);
            
            // 未读提示
            if (!chatPanelVisible || activeTab !== roomCode) {
                if (!message.isMyMessage) {
                    unreadCount++;
                    updateChatBadge();
                }
            }
        }
    
        console.log("💬 消息已添加到", roomCode === '000000' ? '公屏' : '聊天室 ' + roomCode);
    }
    
    function renderMessages(tabId) {
        const containerId = 'messages' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const messages = tabs[tabId] ? tabs[tabId].messages : [];
        
        container.innerHTML = messages.map(msg => {
            const rowClass = msg.isMyMessage ? 'message-row self' : 'message-row other';
            const name = msg.isMyMessage ? '我' : msg.from;
            
            // ⭐ 处理头像
            let avatarHtml = '👤';
            if (msg.avatar) {
                const isBase64 = msg.avatar && msg.avatar.startsWith('data:image');
                if (isBase64) {
                    avatarHtml = `<img src="${msg.avatar}">`;
                } else {
                    avatarHtml = msg.avatar;
                }
            }
            
            // 提取消息内容（移除前缀）
            const text = msg.text || '';
            const match = text.match(/^\[\d{6}\]\s+/);
            const content = match ? text.substring(match[0].length) : text;
            
            return `
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
                                <div class="bubble-text">${escapeHtml(content)}</div>
                            </div>
                        </div>
                        <div class="time-stamp">${formatTime(msg.time, true)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    

    function scrollToBottom(tabId) {
        setTimeout(() => {
            const containerId = 'messages' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
            const container = document.getElementById(containerId);
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    }
    
    function switchTab(tabId) {
        activeTab = tabId;
        
        // 更新按钮状态
        document.querySelectorAll('.chat-tab').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新内容显示
        document.querySelectorAll('.chat-tab-content').forEach(content => {
            if (content.id === 'tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1)) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // 聚焦输入框
        const inputId = 'input' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
        const input = document.getElementById(inputId);
        if (input) input.focus();
    }
    
    function createRoomTab(roomCode, roomName) {
        if (tabs[roomCode]) return;
        
        // 创建数据
        tabs[roomCode] = {
            name: roomName,
            messages: []
        };
        
        // 创建选项卡按钮
        const tabsContainer = document.getElementById('chatTabs');
        const btn = document.createElement('button');
        btn.className = 'chat-tab';
        btn.dataset.tab = roomCode;
        btn.onclick = () => switchTab(roomCode);
        btn.innerHTML = `
            💬 ${roomName}
            <span class="chat-tab-close" onclick="event.stopPropagation(); closeRoomTab('${roomCode}')">×</span>
        `;
        tabsContainer.appendChild(btn);
        
        // 创建选项卡内容
        const tabId = 'tab' + roomCode.charAt(0).toUpperCase() + roomCode.slice(1);
        const messagesId = 'messages' + roomCode.charAt(0).toUpperCase() + roomCode.slice(1);
        const inputId = 'input' + roomCode.charAt(0).toUpperCase() + roomCode.slice(1);
        
        const content = document.createElement('div');
        content.className = 'chat-tab-content';
        content.id = tabId;
        content.innerHTML = `
            <div class="chat-messages" id="${messagesId}"></div>
            <div class="chat-input-area">
                <input type="text" id="${inputId}" placeholder="输入消息…" onkeydown="handleChatKey(event, '${roomCode}')" autocomplete="off">
                <button onclick="sendMessage('${roomCode}')">发送</button>
            </div>
        `;
        document.getElementById('tabPublic').parentNode.appendChild(content);
        
        // 切换到新选项卡
        switchTab(roomCode);
        
        console.log('✅ 创建聊天室选项卡:', roomCode, roomName);
    }
    
    function closeRoomTab(roomCode) {
        // 删除数据
        delete tabs[roomCode];
        
        // 删除按钮
        const btn = document.querySelector(`[data-tab="${roomCode}"]`);
        if (btn) btn.remove();
        
        // 删除内容
        const tabId = 'tab' + roomCode.charAt(0).toUpperCase() + roomCode.slice(1);
        const content = document.getElementById(tabId);
        if (content) content.remove();
        
        // 如果关闭当前选项卡，切换到公屏
        if (activeTab === roomCode) {
            switchTab('public');
        }
        
        console.log('✅ 关闭聊天室选项卡:', roomCode);
    }


    // 辅助工具函数在 js/utils.js

    // ==================== 测试函数 ====================
    function loginTestUser() {
        // 使用测试账号快速登录
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'authLogin',
                loginId: 'testuser',
                password: '123456'
            }));
                
            console.log("👤 尝试使用测试账号登录...");
        } else {
        }
    }
    
    // ==================== 聊天室功能模块 ====================

    /**
     * 当前聊天室代码
     * 默认为 "000000" 表示不在任何聊天室（公屏模式）
     */

    /**
     * 生成6位随机聊天室代码（非全0）
     * @returns {string} 6位数字聊天室代码
     */
    function generateChatroomCode() {
        let code;
        do {
    code = String(Math.floor(100000 + Math.random() * 900000));
        } while (code === "000000");
        return code;
    }

    /**
     * 更新聊天室代码
     * 当用户手动修改聊天室代码输入框时调用
     */

    function updateChatroomCode() {
        const input = document.getElementById('chatroomCodeInput');
        if (!input) return;

        let code = input.value.trim();
        if (code.length === 0) code = '000000';

        if (!/^[0-9]{6}$/.test(code)) {
            input.value = currentChatroomCode;
            return;
        }

        currentChatroomCode = code;
        input.value = code;

        // 同步聊天面板状态栏
        updateChatroomStatusBar();
        updateChatInputPlaceholder();
        refilterAllMessages();

        const msg = code === '000000' ? '已回到公屏模式' : ('已进入聊天室 [' + code + ']');
    }

    function updateChatroomStatusBar() {
        const bar   = document.getElementById('chatroomStatusBar');
        const badge = document.getElementById('chatroomStatusCode');
        const title = document.getElementById('chatHeaderTitle');
        if (!bar) return;
        if (currentChatroomCode === '000000') {
            bar.style.display = 'none';
            if (title) title.textContent = '公共聊天';
        } else {
            bar.style.display = 'flex';
            // ⭐ 显示ID和聊天室名称
            const roomName = getCurrentChatroomName();
            if (badge) {
                badge.textContent = roomName ? 
                    `${currentChatroomCode} - ${roomName}` : 
                    currentChatroomCode;
            }
            if (title) {
                title.textContent = roomName ? 
                    `💬 ${roomName}` : 
                    '聊天室模式';
            }
        }
    }

    // ⭐ 新增函数：获取当前聊天室名称
    function getCurrentChatroomName() {
        const bubble = bubbles.find(b => b.type === 'group' && b.roomCode === currentChatroomCode);
        return bubble ? bubble.title : null;
    }

    // ⭐ 新增：重新过滤所有消息
    // ⭐ 新增：重新过滤所有消息
    function refilterAllMessages() {
        console.log('🔄 重新过滤所有消息，当前聊天室:', currentChatroomCode);
    
        if (chatMessages.length === 0) {
    console.log('🔍 没有消息需要重新过滤');
    updateChatMessages();
    return;
        }
    
        // 备份所有消息
        const allMessagesBackup = [...chatMessages];
    
        // 清空当前显示的消息
        chatMessages = [];
    
        // 重新添加所有消息（会自动过滤）
        let keptCount = 0;
        let filteredCount = 0;
    
        allMessagesBackup.forEach(msg => {
    // 系统消息始终添加
    if (msg.isSystem) {
        chatMessages.push(msg);
        keptCount++;
        return;
    }
        
    // 重新应用过滤逻辑
    const text = msg.text || '';
    const prefixMatch = text.match(/^\[(\d{6})\]\s+/);
        
    if (prefixMatch) {
        const messageRoomCode = prefixMatch[1];
        const actualContent = text.substring(prefixMatch[0].length).trim();
            
        // ⭐ 修复：检查消息是否有实际内容
        if (!actualContent) {
            filteredCount++;
            console.log('⚠️ 过滤只有前缀无内容的消息:', text);
            return;
        }
            
        if (currentChatroomCode === '000000') {
            // 公屏模式：只显示[000000]的消息
            if (messageRoomCode === '000000') {
                chatMessages.push(msg);
                keptCount++;
            } else {
                filteredCount++;
            }
        } else {
            // 聊天室模式：显示[000000]或当前聊天室的消息
            if (messageRoomCode === '000000' || messageRoomCode === currentChatroomCode) {
                chatMessages.push(msg);
                keptCount++;
            } else {
                filteredCount++;
            }
        }
    } else {
        // 无前缀消息过滤掉
        filteredCount++;
    }
        });
    
        console.log(`🔍 重新过滤完成: 保留${keptCount}条，过滤${filteredCount}条`);
    
        // 更新UI
        updateChatMessages();
    }
    /**
     * 重置聊天室代码到000000（公屏模式）
     */
    function resetChatroomCode() {
        const input = document.getElementById('chatroomCodeInput');
        if (input) {
    input.value = "000000";
    updateChatroomCode();
        }
    }

    /**
     * 设置聊天室代码（点击建群气泡时调用）
     * @param {string} code - 聊天室代码
     */
    function setChatroomCode(code) {
        // ⭐ 获取聊天室名称
        const bubble = bubbles.find(b => b.type === 'group' && b.roomCode === code);
        const name = bubble ? bubble.title : code;
        
        // ⭐ 创建或切换到聊天室选项卡
        if (!tabs[code]) {
            createRoomTab(code, name);
        } else {
            switchTab(code);
        }
        
        // ⭐ 打开聊天面板
        if (!chatPanelVisible) {
            toggleChatPanel();
        }
        
        console.log('✅ 已进入聊天室:', code, name);
    }

    /**
     * 更新聊天输入框的提示文字
     * 根据当前聊天室状态显示不同提示
     */
    function updateChatInputPlaceholder() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;
    
        if (currentChatroomCode === "000000") {
    chatInput.placeholder = "输入公屏消息...";
    chatInput.value = "";  // 清空输入框
        } else {
    chatInput.placeholder = "输入消息（自动添加[" + currentChatroomCode + "]前缀，可删除以发公屏）";
    // 自动添加前缀
    if (!chatInput.value.startsWith('[' + currentChatroomCode + '] ')) {
        chatInput.value = '[' + currentChatroomCode + '] ';
    }
        }
    }

    function showNotification(message) {
        console.log('📢', message);
    
        // 创建通知元素
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(52, 152, 219, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease;
        `;
    
        document.body.appendChild(notification);
    
        // 3秒后淡出并移除
        setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

