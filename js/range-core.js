// ==================== 范围修改功能 ====================

    // 打开范围修改弹窗（复用简化版局域面板）
    function openRangeModal() {
        toggleRangePanel();
    }

    // 更新预览值
    // 更新预览值 - 第二个 updateRangePreview（约第13500行）
    function updateRangePreview(value) {
        const intValue = parseInt(value);
        const display = document.getElementById('currentRangeDisplay');
        if (!display) return;
        display.textContent = isGlobalMode ? '全局模式' : intValue;

        const confirmLabel = document.getElementById('rangeConfirmText');
        if (confirmLabel) {
            if (isGlobalMode) {
                confirmLabel.textContent = '确认';
            } else {
                confirmLabel.textContent = `确认`;
            }
        }
    }

    function setRangeFromTick(value) {
        const slider = document.getElementById('rangeSlider');
        if (!slider) return;
        slider.value = value;
        updateRangePreview(value);
    }

    // 兼容旧入口
    function setRangePreset(value) {
        setRangeFromTick(value);
    }

    // 确认范围修改（修改后自动关闭）
    function confirmRangeChange() {
        const newRange = parseInt(document.getElementById('rangeSlider').value);
    
        if (newRange === visibleRange && !isGlobalMode) {
    // 范围未变化，直接关闭
    toggleRangePanel();
    return;
        }
    
        // ⭐ 如果之前是全局模式，现在退出全局模式
        if (isGlobalMode) {
            deactivateGlobalMode();
        }
    
        // 更新范围
        visibleRange = newRange;
    
        // 更新我的范围圆圈
        updateMyRange();
    
        // 刷新所有用户标记（重新计算可见性）
        refreshAllMarkers();
    
        // 发送新范围到服务器
        if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
    socket.send(JSON.stringify({
        type: "updateRange",
        userId: currentUser.id,
        range: visibleRange
    }));
        
    // 同时更新位置信息（包含新范围）
    sendPositionToServer();
        }
    
        // 更新工具提示
        const tooltip = document.getElementById('rangeTooltip');
        if (tooltip) {
    tooltip.textContent = `当前: ${visibleRange}米`;
        }
    
        // ⭐ 适配地图缩放
        adaptMapZoomToRange(visibleRange);
    
        // ⭐ 局域模式下，将地图中心重新定位到用户当前位置
        if (map && myPosition) {
            map.panTo(myPosition);
            console.log(`📍 地图中心已重新定位到: ${myPosition.lat}, ${myPosition.lng}`);
        }
    
        // 显示成功消息
    
        // ✅ 确认后自动关闭弹窗
        toggleRangePanel();

        // 双保险：确保面板关闭
        const rangeOverlay = document.getElementById('rangePanelOverlay');
        if (rangeOverlay) {
            rangeOverlay.style.display = 'none';
            rangeOverlay.classList.remove('show');
        }
        setBottomNavActive(null);
     
        console.log(`🎯 范围已修改: ${visibleRange}米`);
    }

    // ⭐ 激活全局模式
    function activateGlobalMode() {
        const globalRange = 50000; // 50公里，全局可见
        isGlobalMode = true; // ⭐ 设置全局模式标志
        
        // 直接应用全局范围
        visibleRange = globalRange;
        
        // ⭐ 隐藏范围圆圈（全局模式下不显示圆圈）
        if (myRangeCircle) {
            myRangeCircle.setMap(null);
            myRangeCircle = null;
        }
        
        // 刷新所有用户标记
        refreshAllMarkers();
        
        // 发送新范围到服务器
        if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
            socket.send(JSON.stringify({
                type: "updateRange",
                userId: currentUser.id,
                range: visibleRange
            }));
            sendPositionToServer();
        }
        
        // 更新工具提示
        const tooltip = document.getElementById('rangeTooltip');
        if (tooltip) {
            tooltip.textContent = '当前: 全局模式';
        }
        
        // ⭐ 全局模式下不改变地图缩放级别，保持当前视角
        // adaptMapZoomToRange(globalRange); // 已移除，保持用户当前的地图缩放级别
        
        // 显示成功消息
        
        console.log('🌍 已切换到全局模式: 50km (保持当前缩放级别)');
        updateModeTopBanner();
    }

    // ⭐ 退出全局模式
    function deactivateGlobalMode() {
        isGlobalMode = false;
        visibleRange = 1000;
        updateMyRange();
        updateModeTopBanner();
        // 重新适配缩放并刷新气泡
        adaptMapZoomToRange(visibleRange);
        if (map && myPosition) map.panTo(new qq.maps.LatLng(myPosition.lat, myPosition.lng));
        requestNearbyBubbles();
        if (typeof window.refreshBubbleMarkersForCurrentZoom === 'function')
            window.refreshBubbleMarkersForCurrentZoom();
        console.log('🔵 已退出全局模式');
    }

    // ⭐ 根据范围适配地图缩放级别
    function adaptMapZoomToRange(range) {
        if (!map || !myPosition) return;
        
        // 获取窗口尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const minDimension = Math.min(windowWidth, windowHeight);
        
        // 计算需要的缩放级别，让圈圈直径约等于窗口较短边
        // Google Maps zoom level 的计算公式：
        // 每个zoom level，156543.03392 * Math.cos(latRadians) / Math.pow(2, zoom) = meters per pixel
        
        const lat = myPosition.lat;
        const latRadians = lat * Math.PI / 180;
        const metersPerPixelAtZoom0 = 156543.03392 * Math.cos(latRadians);
        
        // 圈圈直径的像素数应该等于窗口较短边
        const circleDiameterMeters = range * 2; // 直径是半径的2倍
        const targetMetersPerPixel = circleDiameterMeters / minDimension;
        
        // 计算需要的zoom级别
        const targetZoom = Math.log2(metersPerPixelAtZoom0 / targetMetersPerPixel);
        
        // 限制在合理范围内 (4-18)
        const finalZoom = Math.max(4, Math.min(18, Math.round(targetZoom)));
        
        // 平滑缩放到新级别
        map.setZoom(finalZoom);
        
        console.log(`🔍 地图缩放适配: range=${range}m, window=${minDimension}px, zoom=${finalZoom}`);
    }

    // 初始化范围显示
    function initRangeDisplay() {
        const tooltip = document.getElementById('rangeTooltip');
        if (tooltip) {
    tooltip.textContent = `当前: ${visibleRange}米`;
        }
    }

    // 在页面加载完成后调用
    setTimeout(initRangeDisplay, 1000);

