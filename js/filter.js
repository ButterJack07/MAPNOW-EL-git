// ==================== 气泡筛选功能 (统一版本) ====================

// 筛选状态
let filterSettings = {
    types: [], // 选中的气泡类型
    timeRange: 0 // 时间范围: 0=全部, 1=10分钟, 2=30分钟, 3=1小时, 4=3小时, 5=全天
};

// 时间档位配置（分钟）- 与UI保持一致
const TIME_FILTER_OPTIONS = [
    { value: 0, label: '全部时间', minutes: Infinity },
    { value: 1, label: '10分钟内', minutes: 10 },
    { value: 2, label: '30分钟内', minutes: 30 },
    { value: 3, label: '1小时内', minutes: 60 },
    { value: 4, label: '3小时内', minutes: 180 },
    { value: 5, label: '全天', minutes: 1440 }
];

// 打开筛选弹窗
function openFilterModal() {
    console.log("🔍 打开筛选弹窗");
    const modal = document.getElementById('filterModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.classList.add('show');
    setBottomNavActive('filterButton');
    
    const inactiveBg = '#f8f7f4';
    const inactiveText = '#4e4a46';
    const inactiveBorder = '#cec8c1';
    const activeBg = '#9a938b';
    const activeText = '#f6f3ee';
    const activeBorder = '#857f77';

    // 恢复当前筛选状态
    if (filterSettings && filterSettings.types) {
        // 重置所有按钮样式
        ['recommend', 'help', 'team', 'warning', 'news', 'group'].forEach(type => {
            const btn = document.getElementById('filter-' + type);
            if (btn) {
                btn.style.background = inactiveBg;
                btn.style.color = inactiveText;
                btn.style.borderColor = inactiveBorder;
            }
        });
        
        // 高亮选中的类型
        filterSettings.types.forEach(type => {
            const btn = document.getElementById('filter-' + type);
            if (btn) {
                btn.style.background = activeBg;
                btn.style.color = activeText;
                btn.style.borderColor = activeBorder;
            }
        });
    }
    
    const timeSlider = document.getElementById('filterTimeSlider');
    if (timeSlider && filterSettings) {
        timeSlider.value = filterSettings.timeRange || 0;
        updateFilterTimePreview(filterSettings.timeRange || 0);
    }
}

// 关闭筛选弹窗
function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    setBottomNavActive(null);
}

// 切换类型筛选
function toggleFilterType(type) {
    const btn = document.getElementById('filter-' + type);
    if (!btn) return;

    const inactiveBg = '#f8f7f4';
    const inactiveText = '#4e4a46';
    const inactiveBorder = '#cec8c1';
    const activeBg = '#9a938b';
    const activeText = '#f6f3ee';
    const activeBorder = '#857f77';
    
    const index = filterSettings.types.indexOf(type);
    if (index > -1) {
        // 取消选中
        filterSettings.types.splice(index, 1);
        btn.style.background = inactiveBg;
        btn.style.color = inactiveText;
        btn.style.borderColor = inactiveBorder;
    } else {
        // 选中
        filterSettings.types.push(type);
        btn.style.background = activeBg;
        btn.style.color = activeText;
        btn.style.borderColor = activeBorder;
    }
    
    console.log('筛选类型:', filterSettings.types);
}

// 更新时间筛选预览
function updateFilterTimePreview(value) {
    const timeLabels = ['全部', '10分钟内', '30分钟内', '1小时内', '3小时内', '全天'];
    const label = document.getElementById('filterTimeLabel');
    if (label) {
        label.textContent = timeLabels[value] || '全部';
    }
    filterSettings.timeRange = parseInt(value);
}

// 重置筛选
function resetFilter() {
    const inactiveBg = '#f8f7f4';
    const inactiveText = '#4e4a46';
    const inactiveBorder = '#cec8c1';

    filterSettings.types = [];
    ['recommend', 'help', 'team', 'warning', 'news', 'group'].forEach(type => {
        const btn = document.getElementById('filter-' + type);
        if (btn) {
            btn.style.background = inactiveBg;
            btn.style.color = inactiveText;
            btn.style.borderColor = inactiveBorder;
        }
    });

    filterSettings.timeRange = 0;
    const timeSlider = document.getElementById('filterTimeSlider');
    if (timeSlider) timeSlider.value = 0;
    updateFilterTimePreview(0);

    if (typeof window.refreshBubbleMarkersForCurrentZoom === 'function') {
        window.refreshBubbleMarkersForCurrentZoom();
    }
}

// 获取筛选后的气泡列表
// 球面距离（米）
function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getFilteredBubbles() {
    const allBubbles = (window.__getBubbles && window.__getBubbles()) || [];
    if (!allBubbles.length) return [];
    const now = Date.now();
    const timeRanges = [
        Infinity,
        10 * 60 * 1000,
        30 * 60 * 1000,
        60 * 60 * 1000,
        3 * 60 * 60 * 1000,
        24 * 60 * 60 * 1000
    ];
    const maxAge = timeRanges[filterSettings.timeRange] || Infinity;

    // 获取当前参考位置和可见范围
    const refPos = (typeof myPosition !== 'undefined' && myPosition) ||
                   (typeof manualPosition !== 'undefined' && manualPosition);
    const range = (typeof visibleRange !== 'undefined' && visibleRange) || Infinity;

    return allBubbles.filter(bubble => {
        const typeMatch = filterSettings.types.length === 0 || filterSettings.types.includes(bubble.type);
        const timeMatch = (now - (bubble.createdAt || 0)) <= maxAge;
        // 局域范围过滤：只显示在可见范围内的气泡
        const inRange = !refPos || haversineMeters(refPos.lat, refPos.lng, bubble.lat, bubble.lng) <= range;
        return typeMatch && timeMatch && inRange;
    });
}

// 应用筛选
function applyFilter() {
    console.log('应用筛选:', filterSettings);
    closeFilterModal();
    if (typeof window.refreshBubbleMarkersForCurrentZoom === 'function') {
        window.refreshBubbleMarkersForCurrentZoom();
    }
    const typeText = filterSettings.types.length > 0 ? `类型:${filterSettings.types.length}项` : '全部类型';
    const timeText = filterSettings.timeRange > 0 ?
        ['', '10分钟', '30分钟', '1小时', '3小时', '全天'][filterSettings.timeRange] : '全部时间';
    console.log(`筛选: ${typeText} / ${timeText}`);
}

// ==================== 筛选气泡功能 ====================

// 按类型筛选气泡
function filterBubbles(bubbles) {
    // 如果没有筛选设置，直接返回原数组
    if (!filterSettings || filterSettings.types.length === 0) {
        return bubbles;
    }
    
    // 按类型筛选
    return bubbles.filter(bubble => 
        filterSettings.types.includes(bubble.type)
    );
}
