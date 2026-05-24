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

    // 暴露到全局，兼容当前代码（直接调用全局函数）
    window.utils = window.utils || {};
    window.utils.formatTimeSimple = formatTimeSimple;
    window.utils.calculateDistance = calculateDistance;
    window.formatTimeSimple = formatTimeSimple;
    window.calculateDistance = calculateDistance;
})();
