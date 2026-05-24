// ==================== 简化版局域面板功能 ====================

    function toggleRangePanel() {
        const overlay = document.getElementById('rangePanelOverlay');
        if (overlay.style.display === 'none' || overlay.style.display === '') {
    overlay.style.display = 'flex';
    overlay.classList.add('show');
    setBottomNavActive('rangeButton');
    // 更新位置显示
    updateRangeLocationDisplay();
    const slider = document.getElementById('rangeSlider');
    if (slider) {
        if (isGlobalMode) {
            slider.value = 3000;
            updateRangePreview(3000);
        } else {
            slider.value = visibleRange;
            updateRangePreview(visibleRange);
        }
    }
        } else {
    overlay.style.display = 'none';
    overlay.classList.remove('show');
    setBottomNavActive(null);
        }
    }

    function closeRangeModal() {
        const panelOverlay = document.getElementById('rangePanelOverlay');
        if (panelOverlay && panelOverlay.style.display === 'flex') {
            panelOverlay.style.display = 'none';
            panelOverlay.classList.remove('show');
        }

        const legacyModal = document.getElementById('rangeModal');
        if (legacyModal) {
            legacyModal.style.display = 'none';
            legacyModal.classList.remove('show');
        }

        setBottomNavActive(null);
    }

    function setBottomNavActive(activeId) {
        const ids = ['filterButton', 'publishButton', 'chatButton', 'rangeButton', 'mobileUserButton'];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (activeId && id === activeId) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }


    // 从范围面板设置定位模式
    function setLocationModeFromRange(mode) {
        const gpsBtn = document.getElementById('rangeGpsBtn');
        const searchBtn = document.getElementById('rangeSearchBtn');
        const searchArea = document.getElementById('rangeSearchArea');
    
    if (mode === 'gps') {
        // 切换到GPS模式
        gpsBtn.style.background = '#9a938b';
        gpsBtn.style.color = '#f6f3ee';
        gpsBtn.style.borderColor = '#857f77';
        searchBtn.style.background = '#f8f7f4';
        searchBtn.style.color = '#4e4a46';
        searchBtn.style.borderColor = '#cec8c1';

        // 隐藏搜索区域
        searchArea.style.display = 'none';

        // 调用原有的GPS定位
        setLocationMode('gps');
        updateRangeLocationDisplay();

        // 恢复局域圆圈，隐藏 marker
        updateMyRange();
        if (myMarker) { myMarker.setMap(null); myMarker = null; }
        // 重新适配缩放并刷新气泡
        if (typeof adaptMapZoomToRange === 'function') adaptMapZoomToRange(visibleRange);
        requestNearbyBubbles();
        if (typeof window.refreshBubbleMarkersForCurrentZoom === 'function')
            window.refreshBubbleMarkersForCurrentZoom();
    } else {
        // 切换到搜索模式
        if (isGlobalMode) {
            deactivateGlobalMode();
        }

        searchBtn.style.background = '#9a938b';
        searchBtn.style.color = '#f6f3ee';
        searchBtn.style.borderColor = '#857f77';
        gpsBtn.style.background = '#f8f7f4';
        gpsBtn.style.color = '#4e4a46';
        gpsBtn.style.borderColor = '#cec8c1';

        // 搜索模式：隐藏范围圆圈，用 marker 代替
        if (myRangeCircle) { myRangeCircle.setMap(null); myRangeCircle = null; }

        // 显示搜索区域
        searchArea.style.display = 'block';

        // 自动聚焦到搜索框
        setTimeout(() => {
            document.getElementById('rangeSearchInput').focus();
        }, 100);

        // 如果已经有手动位置，显示在搜索框中
        if (manualPosition) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "reverseGeocode",
                    lat: manualPosition.lat,
                    lng: manualPosition.lng
                }));
            }
        }
    }
}


    // 显示搜索区域
    function showRangeSearch() {
        setLocationModeFromRange('search');
    }

    // 搜索地点 - 完全复用 searchLocation 的逻辑
    function searchLocationFromRange() {
        // 复用 searchLocation 的防抖逻辑
        if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
        }
    
        const input = document.getElementById('rangeSearchInput').value.trim();
        const resultsDiv = document.getElementById('rangeSearchResults');
    
        console.log('🔍 执行范围面板搜索:', input);
    
        if (!input) {
    resultsDiv.innerHTML = '';
    return;
        }
    
        // 如果距离上次搜索时间太短，过滤频繁请求
        const now = Date.now();
        if (window.lastRangeSearchTime && window.lastRangeSearchKeyword === input && now - window.lastRangeSearchTime < 1000) {
    console.log('⏱️ 搜索太频繁，忽略');
    return;
        }
    
        // 记录本次搜索
        window.lastRangeSearchTime = now;
        window.lastRangeSearchKeyword = input;
    
        // 显示加载中
        resultsDiv.innerHTML = '<div style="padding: 8px; text-align: center; color: var(--text-tertiary);">搜索中...</div>';
    
        // 通过 WebSocket 发送搜索请求到后端
        if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
        type: "searchPlaces",
        keyword: input
    }));
        } else {
    resultsDiv.innerHTML = '<div style="padding: 8px; text-align: center; color: var(--text-tertiary);">网络连接失败</div>';
        }
    }

    // 更新位置显示
    function updateRangeLocationDisplay() {
        const display = document.getElementById('rangeLocationDisplay');
        if (!display) return;

        // 位置展示模块已移除，保留函数仅用于兼容旧调用点
        display.innerHTML = '';
    }

    // 初始化范围面板的搜索框事件
    function initRangeSearch() {
        const searchInput = document.getElementById('rangeSearchInput');
        const searchBtn = document.getElementById('rangeSearchBtn');
    
        if (searchInput) {
    // 输入事件（防抖）
    searchInput.addEventListener('input', function(e) {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            searchLocationFromRange();
        }, 500);
    });
        
    // 回车事件
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (this.timer) clearTimeout(this.timer);
            searchLocationFromRange();
        }
    });
        
    // 聚焦时自动选中所有文本
    searchInput.addEventListener('focus', function() {
        this.select();
    });
        }
    
        // 如果搜索按钮存在，添加点击事件
        if (searchBtn) {
    searchBtn.addEventListener('click', function() {
        searchLocationFromRange();
    });
        }
    }


    function toggleSearchArea() {
        const searchArea = document.getElementById('rangeSearchArea');
        const gpsBtn = document.getElementById('rangeGpsBtn');
        const searchBtn = document.getElementById('rangeSearchBtn');
    
        if (searchArea.style.display === 'none' || searchArea.style.display === '') {
    // 显示搜索区域
    searchArea.style.display = 'block';
    searchBtn.style.background = '#9a938b';
    searchBtn.style.color = '#f6f3ee';
    searchBtn.style.borderColor = '#857f77';
    gpsBtn.style.background = '#f8f7f4';
    gpsBtn.style.color = '#4e4a46';
    gpsBtn.style.borderColor = '#cec8c1';
        
    // 自动聚焦到搜索框
    setTimeout(() => {
        document.getElementById('rangeSearchInput').focus();
    }, 100);
        } else {
    // 隐藏搜索区域，切换回GPS模式
    searchArea.style.display = 'none';
    gpsBtn.style.background = '#9a938b';
    gpsBtn.style.color = '#f6f3ee';
    gpsBtn.style.borderColor = '#857f77';
    searchBtn.style.background = '#f8f7f4';
    searchBtn.style.color = '#4e4a46';
    searchBtn.style.borderColor = '#cec8c1';
        
    // 调用GPS定位
    setLocationMode('gps');
        }
    }


    // 初始化
    setTimeout(initRangeSearch, 1000);

