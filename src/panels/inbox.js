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
    document.getElementById('inboxOverlay').style.display = 'flex';
    switchInboxTab('like');

    currentInboxTab = null;

    document.querySelectorAll('.inbox-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.inbox-content-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    document.getElementById('inboxContent').style.maxHeight = '0';
    queryInboxUnread();
    console.log('📨 打开收件箱');
}

function closeInbox() {
    document.getElementById('inboxOverlay').style.display = 'none';
}

function queryInboxUnread() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
        type: 'queryInboxUnread'
    }));

    console.log('📨 查询收件箱未读数');
}

/**
 * 更新收件箱（通知）小红点，并同步刷新主界面头像入口总角标。
 * @param {number} count - 未读通知总数
 */
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

/**
 * 刷新主界面头像按钮上的总角标（私信未读 + 通知未读）。
 * 任何角标变化后都应调用此函数。
 */
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

    document.getElementById('inboxOverlay').style.display = 'none';
    document.getElementById('notificationsOverlay').style.display = 'flex';

    const titles = {
        like: '❤️ 点赞通知',
        favorite: '⭐ 收藏通知',
        comment: '💬 评论通知'
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

function backToInbox() {
    document.getElementById('notificationsOverlay').style.display = 'none';
    document.getElementById('inboxOverlay').style.display = 'flex';
}

function displayNotificationsList(notifications, type) {
    let panelId = '';
    if (type === 'like') panelId = 'inboxLikePanel';
    else if (type === 'favorite') panelId = 'inboxFavoritePanel';
    else if (type === 'comment') panelId = 'inboxCommentPanel';

    const container = document.getElementById(panelId);
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = '<div class="inbox-empty">暂无通知</div>';
        return;
    }

    let html = '<div class="notifications-list">';
    notifications.forEach(notif => {
        const timeStr = formatTimeSimple(notif.created_at);
        const isRead = notif.is_read === 1;
        const readClass = isRead ? 'read' : '';

        let contentText = '';
        if (type === 'like') {
            contentText = `${notif.from_user_name} 赞了你的气泡`;
        } else if (type === 'favorite') {
            contentText = `${notif.from_user_name} 收藏了你的气泡`;
        } else if (type === 'comment') {
            contentText = `${notif.from_user_name} 评论了你的气泡`;
            if (notif.content) {
                contentText += `: "${notif.content}"`;
            }
        }

        html += `
        <div class="notification-item ${readClass}">
            <div class="notification-avatar">${renderAvatarPreview(notif.from_user_avatar || '👤')}</div>
            <div class="notification-content">
                <div class="notification-text">${contentText}</div>
                <div class="notification-time">${timeStr}</div>
                ${notif.bubble_title ? `<div class="notification-bubble-title">「${escapeHtml(notif.bubble_title)}」</div>` : ''}
            </div>
        </div>
    `;
    });
    html += '</div>';

    container.innerHTML = html;

    if (type === 'like') {
        document.getElementById('tabLikeBadge').textContent = '0';
    } else if (type === 'favorite') {
        document.getElementById('tabFavoriteBadge').textContent = '0';
    } else if (type === 'comment') {
        document.getElementById('tabCommentBadge').textContent = '0';
    }

    console.log(`✅ 显示 ${notifications.length} 条${type}通知到面板`);
}