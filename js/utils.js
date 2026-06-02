(function(){
    // 简化时间格式
    function formatTimeSimple(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
            
        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        } else if (diff < 86400000) {
            return Math.floor(diff / 3600000) + '小时前';
        } else if (diff < 604800000) {
            return Math.floor(diff / 86400000) + '天前';
        } else {
            return date.getMonth() + 1 + '月' + date.getDate() + '日';
        }
    }

    // 距离计算工具函数
    function calculateDistance(lat1, lng1, lat2, lng2) {
        // 将经纬度转换为弧度
        const toRad = (degree) => degree * Math.PI / 180;
            
        const R = 6371000; // 地球半径（米）
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
            
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // 返回距离（米）
    }

    // ⭐ 气泡类型配置（图标和颜色）
    const BUBBLE_CONFIG = {
        recommend: {
            icon: '👍',
            name: '推荐',
            color: '#FF6B35',
            gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
        },
        help: {
            icon: '🆘',
            name: '求助',
            color: '#FFD93D',
            gradient: 'linear-gradient(135deg, #FFD93D 0%, #FFA500 100%)'
        },
        team: {
            icon: '👥',
            name: '组队',
            color: '#4A90E2',
            gradient: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)'
        },
        group: {
            icon: '💬',
            name: '建群',
            color: '#6BCF7F',
            gradient: 'linear-gradient(135deg, #6BCF7F 0%, #4CAF50 100%)'
        },
        warning: {
            icon: '⚠️',
            name: '避雷',
            color: '#9B59B6',
            gradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)'
        },
        news: {
            icon: '📰',
            name: '见闻',
            color: '#FF85A1',
            gradient: 'linear-gradient(135deg, #FF85A1 0%, #FF6B9D 100%)'
        }
    };

    // 暴露到全局，兼容当前代码（直接调用全局函数）
    window.utils = window.utils || {};
    window.utils.formatTimeSimple = formatTimeSimple;
    window.utils.calculateDistance = calculateDistance;
    window.formatTimeSimple = formatTimeSimple;
    window.calculateDistance = calculateDistance;
    window.BUBBLE_CONFIG = BUBBLE_CONFIG;

    // ==================== 辅助函数 ====================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ⭐ 新增：处理HTML转义并保留换行
    function escapeHtmlWithBreaks(text) {
        if (!text) return '';
        return escapeHtml(text).replace(/\n/g, '<br>');
    }

    function formatTime(timestamp, showSeconds = false) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
            
        // 如果是今天
        if (diff < 24 * 60 * 60 * 1000) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = showSeconds ? ':' + date.getSeconds().toString().padStart(2, '0') : '';
            return `${hours}:${minutes}${seconds}`;
        }
            
        // 如果是今年
        if (date.getFullYear() === now.getFullYear()) {
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${month}-${day}`;
        }
            
        return date.toLocaleDateString();
    }

    // ⭐ v9.7.7: 已删除 showNetworkStatus 函数
    
    // ⭐ v9.6.10: 优美的发布成功通知（类似QQ消息）
    function showPublishSuccessNotification(title, type, duration) {
        // 创建或获取通知容器
        let notification = document.getElementById('publishNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'publishNotification';
            notification.className = 'publish-notification';
            document.body.appendChild(notification);
        }
        
        // 气泡类型配置
        const typeConfig = {
            'recommend': { icon: '👍', name: '推荐', color: '#4facfe' },
            'help': { icon: '🆘', name: '求助', color: '#8B0000' },
            'team': { icon: '👥', name: '组队', color: '#f093fb' },
            'group': { icon: '💬', name: '建群', color: '#a8edea' },
            'warning': { icon: '⚠️', name: '避雷', color: '#feca57' },
            'news': { icon: '📰', name: '见闻', color: '#48dbfb' }
        };
        
        const config = typeConfig[type] || typeConfig['recommend'];
        
        // 格式化时长
        const days = Math.floor(duration / (24 * 60));
        const hours = Math.floor((duration % (24 * 60)) / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (days > 0) durationText += `${days}天`;
        if (hours > 0) durationText += `${hours}小时`;
        if (minutes > 0) durationText += `${minutes}分钟`;
        if (!durationText) durationText = '0分钟';
        
        // 设置通知内容
        notification.innerHTML = `
            <div class="notification-icon" style="background: transparent; font-size: 24px;">
                ${config.icon}
            </div>
            <div class="notification-content">
                <div class="notification-title">气泡发布成功</div>
                <div class="notification-desc">${config.name} · ${title}</div>
            </div>
            <div class="notification-close" onclick="hidePublishNotification()">×</div>
            <div class="notification-time" style="position: absolute; bottom: 8px; right: 16px; font-size: 11px; color: var(--text-tertiary);">
                ${durationText}
            </div>
        `;
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 3秒后自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    function hidePublishNotification() {
        const notification = document.getElementById('publishNotification');
        if (notification) {
            notification.classList.remove('show');
        }
    }

    window.escapeHtml = escapeHtml;
    window.escapeHtmlWithBreaks = escapeHtmlWithBreaks;
    window.formatTime = formatTime;
    window.showPublishSuccessNotification = showPublishSuccessNotification;
    window.hidePublishNotification = hidePublishNotification;
})();