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
})();
