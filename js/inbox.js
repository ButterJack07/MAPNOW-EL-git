// ==================== 收件箱 / 通知面板 ====================

function queryUnreadNotifications() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.log('⚠️ WebSocket未连接');
        return;
    }

    console.log('🔔 查询未读通知...');
    socket.send(JSON.stringify({
        type: 'queryUnreadNotifications'
    }));
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function openInbox() {
    openChatList();
    queryInboxUnread();
    console.log('📨 打开收件箱');
}

function closeInbox() {
    document.getElementById('chatListOverlay').style.display = 'none';
}

function queryInboxUnread() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
        type: 'queryInboxUnread'
    }));

    console.log('📨 查询收件箱未读数');
}

function updateInboxBadge(count) {
    const badge = document.getElementById('inboxBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
    refreshHeaderBadge();
}

function refreshHeaderBadge() {
    const chatCount = parseInt(document.getElementById('chatBadge')?.textContent || '0', 10);
    const inboxCount = parseInt(document.getElementById('inboxBadge')?.textContent || '0', 10);
    const chatVisible = document.getElementById('chatBadge')?.style.display !== 'none';
    const inboxVisible = document.getElementById('inboxBadge')?.style.display !== 'none';
    const total = (chatVisible ? chatCount : 0) + (inboxVisible ? inboxCount : 0);
    const hb = document.getElementById('headerBadge');
    if (hb) {
        if (total > 0) {
            hb.textContent = total > 99 ? '99+' : total;
            hb.style.display = 'block';
        } else {
            hb.style.display = 'none';
        }
    }
}

function showNotificationsList(type) {
    if (type === 'message') {
        return;
    }

    document.getElementById('chatListOverlay').style.display = 'none';
    document.getElementById('notificationsOverlay').style.display = 'flex';

    const titles = {
        like: '❤️ 点赞通知',
        favorite: '⭐ 收藏通知',
        comment: '💬 评论通知',
        friend_request: '👤 好友请求'
    };
    document.getElementById('notificationsTitle').textContent = titles[type] || '通知列表';

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'queryNotificationsByType',
            notificationType: type
        }));
    }

    document.getElementById('notificationsList').innerHTML = '<div class="uc-empty">加载中...</div>';
    console.log(`📨 查看${type}通知`);
}

function backToChatList() {
    document.getElementById('notificationsOverlay').style.display = 'none';
    document.getElementById('chatListOverlay').style.display = 'flex';
}

function displayNotificationsList(notifications, type) {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = '<div class="uc-empty">暂无通知</div>';
        return;
    }

    let html = '<div class="notifications-list">';
    notifications.forEach(notif => {
        const timeStr = formatTimeSimple(notif.created_at);
        const isRead = notif.is_read === 1;
        const readClass = isRead ? 'read' : '';

        let contentText = '';
        let actionButtons = '';
        if (type === 'like') {
            contentText = `${notif.from_user_name} 赞了你的气泡`;
        } else if (type === 'favorite') {
            contentText = `${notif.from_user_name} 收藏了你的气泡`;
        } else if (type === 'comment') {
            contentText = `${notif.from_user_name} 评论了你的气泡`;
            if (notif.content) {
                contentText += `: "${notif.content}"`;
            }
        } else if (type === 'friend_request') {
            const requestId = notif.content || '';
            contentText = `${notif.from_user_name} 请求加你为好友`;
            actionButtons = `
                <div style="display:flex;gap:6px;margin-top:8px;">
                    <button onclick="event.stopPropagation();acceptFriendRequest(${requestId});setTimeout(function(){showNotificationsList('friend_request')},500);" style="padding:5px 12px;border:none;border-radius:6px;background:#4CAF50;color:#fff;font-size:12px;cursor:pointer;">同意</button>
                    <button onclick="event.stopPropagation();rejectFriendRequest(${requestId});setTimeout(function(){showNotificationsList('friend_request')},500);" style="padding:5px 12px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#666;font-size:12px;cursor:pointer;">拒绝</button>
                </div>`;
        }

        html += `
        <div class="notification-item ${readClass}">
            <div class="notification-avatar">${renderAvatarPreview(notif.from_user_avatar || '👤')}</div>
            <div class="notification-content">
                <div class="notification-text">${contentText}</div>
                <div class="notification-time">${timeStr}</div>
                ${notif.bubble_title ? `<div class="notification-bubble-title">「${escapeHtml(notif.bubble_title)}」</div>` : ''}
                ${actionButtons}
            </div>
        </div>
    `;
    });
    html += '</div>';

    container.innerHTML = html;

    const badgeMap = { like: 'tabLikeBadge', favorite: 'tabFavoriteBadge', comment: 'tabCommentBadge', friend_request: 'tabFriendRequestBadge' };
    const badgeId = badgeMap[type];
    if (badgeId) {
        const badge = document.getElementById(badgeId);
        if (badge) badge.textContent = '0';
    }

    console.log(`✅ 显示 ${notifications.length} 条${type}通知`);
}