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
        gpsBtn.style.background = 'linear-gradient(135deg, #a09890 0%, #8b857e 100%)';
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

        searchBtn.style.background = 'linear-gradient(135deg, #a09890 0%, #8b857e 100%)';
        searchBtn.style.color = '#f6f3ee';
        searchBtn.style.borderColor = '#857f77';
        gpsBtn.style.background = '#f8f7f4';
        gpsBtn.style.color = '#4e4a46';
        gpsBtn.style.borderColor = '#cec8c1';

        // 搜索模式：切换到手动/搜索定位状态，停止 GPS，刷新范围圈与标记，保证局域圈立即可见
        // 标记当前为手动模式（search 等价于 manual）
        locationMode = 'manual';
        // 停止 GPS 监控（避免位置被覆盖）
        if (typeof stopGPSWatching === 'function') stopGPSWatching();
        // 刷新 UI 并通过 setRange(visibleRange) 触发范围更新流程（即使值不变也强制刷新显示）
        updateLocationDisplay();
        if (typeof setRange === 'function') {
            try { setRange(visibleRange); } catch (e) { console.warn('setRange 调用失败:', e); }
        } else {
            // 回退：直接刷新范围和标记
            updateMyRange();
            if (typeof updateMyMarker === 'function') updateMyMarker();
            if (typeof refreshAllMarkers === 'function') refreshAllMarkers();
        }

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

    // ==================== 搜索建议和位置选择 ====================

    // 显示搜索建议
    function displaySearchSuggestions(places) {
        // 判断是哪个搜索框在请求
        const locationSuggestions = document.getElementById('locationSuggestions');
        const rangeSearchResults = document.getElementById('rangeSearchResults');

        // 如果位置选择弹窗是打开的，显示在 locationSuggestions
        if (document.getElementById('locationModal').style.display === 'flex') {
            locationSuggestions.innerHTML = '';

            if (!places || places.length === 0) {
                locationSuggestions.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-tertiary);">未找到相关地点</div>';
                return;
            }

            places.forEach(place => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerHTML = `
                    <div class="suggestion-name">${escapeHtml(place.name)}</div>
                    <div class="suggestion-address">${escapeHtml(place.address || place.district || '')}</div>
                `;
                item.onclick = () => selectLocationFromSearch(place);
                locationSuggestions.appendChild(item);
            });
        } 
        // 如果范围面板是打开的，显示在 rangeSearchResults
        else if (document.getElementById('rangePanelOverlay').style.display === 'flex') {
            rangeSearchResults.innerHTML = '';

            if (!places || places.length === 0) {
                rangeSearchResults.innerHTML = '<div style="padding: 8px; text-align: center; color: var(--text-tertiary);">未找到相关地点</div>';
                return;
            }

            places.forEach(place => {
                const item = document.createElement('div');
                item.style.cssText = 'padding: 8px 10px; border-bottom: 1px solid #e0e0e0; cursor: pointer; font-size: 12px; transition: background 0.2s;';
                item.onmouseover = () => item.style.background = '#e0e0e0';
                item.onmouseout = () => item.style.background = 'white';
                item.onclick = () => selectRangeLocation(place);

                item.innerHTML = `
                    <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(place.name || '未知地点')}</div>
                    <div style="font-size: 11px; color: var(--text-secondary);">${escapeHtml(place.address || place.district || '')}</div>
                `;
                rangeSearchResults.appendChild(item);
            });
        }
    }

    // 从搜索结果中选择位置（范围面板专用）- 不弹窗版本
    function selectRangeLocation(place) {
        console.log('📍 范围面板选择地点:', place);

        // 更新手动位置
        manualPosition = {
            lat: place.lat,
            lng: place.lng
        };
        lastManualLocationName = place.name || place.address || '';

        if (isGlobalMode) {
            deactivateGlobalMode();
        }

        // 切换到手动模式（但不要打开位置选择弹窗）
        if (locationMode !== 'manual') {
            // 直接设置模式，不调用 setLocationMode 因为那会打开弹窗
            locationMode = 'manual';

            // 更新UI按钮状态
            const gpsCircleBtn = document.getElementById('gpsModeBtn');
            const manualCircleBtn = document.getElementById('manualModeBtn');
            if (gpsCircleBtn) gpsCircleBtn.classList.remove('active');
            if (manualCircleBtn) manualCircleBtn.classList.add('active');

            // 停止GPS监控
            stopGPSWatching();
        }

        // 更新我的位置
        updateMyPosition(manualPosition);

        // 更新范围面板的位置显示（兼容旧节点）
        const rangeDisplay = document.getElementById('rangeLocationDisplay');
        if (rangeDisplay) {
            rangeDisplay.innerHTML = `${escapeHtml(place.name || '当前位置')}`;
        }

        // 在搜索框中显示选中的地点名称
        document.getElementById('rangeSearchInput').value = place.name || '';

        // 清空搜索结果
        document.getElementById('rangeSearchResults').innerHTML = '';

        // 移动地图到选择的位置
        if (map) {
            map.panTo(new qq.maps.LatLng(place.lat, place.lng));
            map.setZoom(15);
        }

        updateModeTopBanner();
    }

