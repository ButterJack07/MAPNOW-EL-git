    // ==================== 地图初始化 ====================
    // ==================== 地图初始化 ====================
    /**
     * 初始化腾讯地图
     * 创建地图实例、绑定点击事件、定位当前用户
     */
    function initMap() {
        // 默认位置（上海中心）
        const defaultPosition = { lat: 31.2800, lng: 121.5000 };
    
        // ⭐ v9.7.8: 根据当前主题设置地图样式
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        // 创建地图实例
        const mapOptions = {
            center: new qq.maps.LatLng(defaultPosition.lat, defaultPosition.lng),
            zoom: 15,
            disableDefaultUI: true
        };
        
        map = new qq.maps.Map(document.getElementById('map'), mapOptions);

        let zoomRefreshTimer = null;
        qq.maps.event.addListener(map, 'zoom_changed', function() {
            if (window._suppressRefresh) return;
            if (zoomRefreshTimer) clearTimeout(zoomRefreshTimer);
            zoomRefreshTimer = setTimeout(() => {
                refreshBubbleMarkersForCurrentZoom();
            }, 120);
        });

        // 平移时重新聚合（bounds 变化 → 像素坐标变化）
        let panRefreshTimer = null;
        qq.maps.event.addListener(map, 'bounds_changed', function() {
            if (window._suppressRefresh) return;
            if (panRefreshTimer) clearTimeout(panRefreshTimer);
            panRefreshTimer = setTimeout(() => {
                refreshBubbleMarkersForCurrentZoom();
            }, 200);
        });
    
        console.log(`✅ 地图初始化完成，主题: ${currentTheme || 'light'}`);
    
        // ⭐ 检查腾讯地图 API 是否可用
        if (typeof qq !== 'undefined' && qq.maps) {
    console.log("✅ 腾讯地图 API 可用");
        
    // 检查搜索服务
    if (qq.maps.SearchService) {
        console.log("✅ 腾讯地图搜索服务可用");
    } else {
        console.warn("⚠️ 腾讯地图搜索服务不可用，检查 API 版本");
    }
        } else {
    console.error("❌ 腾讯地图 API 不可用");
        }
    
        // 地图初始化完成后请求附近气泡
        setTimeout(() => {
    requestNearbyBubbles();
        }, 1000);

        qq.maps.event.addListener(map, 'click', function() {
            clearSpiderfy();
        });

        // ⭐ v9.7.5: 完全禁用地图点击选点功能
        // 用户只能通过搜索来选择地点
        qq.maps.event.addListener(map, 'click', function(event) {
            console.log('🚫 地图点击已禁用，请使用搜索功能选择地点');
        });
    }

    function wgs84ToGcj02(lat, lng) {
        const a = 6378245.0;
        const ee = 0.00669342162296594323;

        function transformLat(x, y) {
            let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
            ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
            return ret;
        }

        function transformLng(x, y) {
            let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
            ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
            return ret;
        }

        function outOfChina(lat, lng) {
            return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
        }

        if (outOfChina(lat, lng)) return { lat, lng };

        let dLat = transformLat(lng - 105.0, lat - 35.0);
        let dLng = transformLng(lng - 105.0, lat - 35.0);
        const radLat = lat / 180.0 * Math.PI;
        let magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        const sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);

        return { lat: lat + dLat, lng: lng + dLng };
    }

    function getGPSLocation() {
        return new Promise((resolve, reject) => {
    // 检查浏览器是否支持
    if (!navigator.geolocation) {
        console.log('⚠️ 浏览器不支持Geolocation');
        myPosition = { lat: 39.9042, lng: 116.4074 };
        resolve(myPosition);
        return;
    }

    // 检查是否是安全上下文（HTTPS）
    if (!window.isSecureContext) {
        console.warn('⚠️ 非安全上下文，定位可能被浏览器阻止');
        // 继续尝试，但用户可能看不到权限弹窗
    }

    // 先检查权限状态
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
            console.log('📍 定位权限状态:', permissionStatus.state);
                
            if (permissionStatus.state === 'denied') {
                myPosition = { lat: 39.9042, lng: 116.4074 };
                resolve(myPosition);
                return;
            }
        }).catch(err => {
            console.log('无法查询权限状态:', err);
        });
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 30000,  // 增加超时时间到30秒
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const gcj02 = wgs84ToGcj02(lat, lng);
            gpsPosition = { lat: gcj02.lat, lng: gcj02.lng };
                
            // 如果当前是GPS模式，更新位置
            if (locationMode === 'gps') {
                updateMyPosition(gpsPosition);
            }
                
            console.log('✅ 获取到GPS定位 (已转GCJ-02):', gpsPosition, '原始WGS-84:', { lat, lng });
            resolve(gpsPosition);
                
            // 开始持续监控GPS位置
            startGPSWatching();
        },
        (error) => {
            console.log('⚠️ 定位失败:', error.message, '错误码:', error.code);
                
            let errorMessage = '定位失败，使用默认位置（北京天安门）';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '请在浏览器设置中允许位置权限，然后刷新页面';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '无法获取位置信息，使用默认位置';
                    break;
                case error.TIMEOUT:
                    errorMessage = '定位超时，使用默认位置';
                    break;
            }
                
            myPosition = { lat: 39.9042, lng: 116.4074 };
            updateMyMarker();
            requestNearbyBubbles();
            resolve(myPosition);
        },
        options
    );
        });
    }


    function startGPSWatching() {
        if (!navigator.geolocation || gpsWatchId) return;
            
        gpsWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const gcj02 = wgs84ToGcj02(position.coords.latitude, position.coords.longitude);
                gpsPosition = {
                    lat: gcj02.lat,
                    lng: gcj02.lng
                };
                    
                // 如果当前是GPS模式，更新位置（不自动回拉地图中心）
                if (locationMode === 'gps') {
                    updateMyPosition(gpsPosition, false);
                }
                    
                updateLocationStatus("📍 实时定位中");
            },
            (error) => {
                console.error("GPS监控错误:", error);
                updateLocationStatus("❌ 定位失败");
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000
            }
        );
            
        isLocationEnabled = true;
    }

    function stopGPSWatching() {
        if (gpsWatchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(gpsWatchId);
            gpsWatchId = null;
        }
        isLocationEnabled = false;
    }

    // ==================== 位置模式设置 ====================

    function setLocationMode(mode) {
        locationMode = mode;
    
        // 获取所有相关按钮
        const gpsCircleBtn = document.getElementById('gpsModeBtn');
        const manualCircleBtn = document.getElementById('manualModeBtn');
    
        // 移除所有激活状态
        [gpsCircleBtn, manualCircleBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
        });
    
        if (mode === 'gps') {
    // 激活GPS模式按钮
    if (gpsCircleBtn) gpsCircleBtn.classList.add('active');
        
    // 启用GPS定位（用户主动切换，回拉中心）
    if (gpsPosition) {
        updateMyPosition(gpsPosition, true);
    } else {
        getGPSLocation();
    }
        // 切换到 GPS 模式：清除手动位置标记优先权，确保 marker 和 范围圈 以 GPS 为准
        manualPosition = null;
        isFromSearchLocation = false;
        // 立即重建我的标记和范围，先销毁再重建以避免旧图标残留
        if (myMarker) { try { myMarker.setMap(null); } catch(e){} myMarker = null; }
        // 在显式切换到 GPS 时需要强制移除旧圈
        safeRemoveMyRangeCircle(true);
        setTimeout(()=>{ try { updateMyMarker(); updateMyRange(); refreshAllMarkers(); } catch(e){} }, 80);
        // 重新开启GPS实时监听
        startGPSWatching();
        } else {
    // 激活手动模式按钮
    if (manualCircleBtn) manualCircleBtn.classList.add('active');
        
    // 停止GPS监控
    stopGPSWatching();
        
    // ⭐ 打开位置选择弹窗
    openLocationModal();
        }
    
        updateLocationDisplay();
        // 切换定位模式后立即刷新我的标记与范围圈，保证界面及时反映（避免仅切换模式时范围不更新）
        try {
            updateMyMarker();
            updateMyRange();
            refreshAllMarkers();
        } catch (e) {
            console.warn('刷新定位显示失败：', e);
        }
            // 如果刚切换到手动/搜索定位，做一次范围 bounce（先小再还原）以强制触发所有相关刷新流程
            if (mode === 'manual') {
                try {
                    const oldRange = visibleRange || 1000;
                    // 先设为最小值（setRange 内会 clamp 到 100）然后短延迟还原
                    setTimeout(() => setRange(100), 60);
                    setTimeout(() => setRange(oldRange), 260);
                } catch (e) {
                    console.warn('范围 bounce 失败', e);
                }
            }
            // 再次延迟确保重建：覆盖可能的时序问题（若第一次 updateMyRange 被其他逻辑移除）
            if (mode === 'manual') {
                setTimeout(() => {
                    try {
                        console.log('🔁 手动模式：延迟强制重建范围圈/标记');
                        updateMyRange();
                        refreshAllMarkers();
                    } catch (e) { console.warn('延迟重建失败', e); }
                }, 420);
            }
    }


    // ==================== 手动位置选择 ====================
    function handleMapClick(event) {
        if (locationMode === 'manual') {
    manualPosition = {
        lat: event.latLng.getLat(),
        lng: event.latLng.getLng()
    };
        
    updateMyPosition(manualPosition);
        
    // ⭐ 如果位置选择弹窗是打开的，更新里面的信息并尝试获取地点名称
    if (document.getElementById('locationModal').style.display === 'flex') {
        updateLocationModalInfo();
            
        // 尝试反向地理编码，获取地点名称
        reverseGeocode(manualPosition);
    }
        
        }
    }

    // 反向地理编码（坐标转地址）- 通过后端
    function reverseGeocode(position) {
        if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
        type: "reverseGeocode",
        lat: position.lat,
        lng: position.lng
    }));
        }

    // ==================== 更新我的位置（核心函数） ====================
    function updateMyPosition(position, pan = false) {
        myPosition = position;
        console.log("📍 更新我的位置:", position);

        // 更新标记（内部会按模式决定是画圆圈还是 marker）
        updateMyMarker();

        // 仅当显式要求时才回拉地图中心（如用户点击定位按钮）
        if (map && pan) {
            map.panTo(new qq.maps.LatLng(position.lat, position.lng));
        }

        // 更新发布位置显示
        updatePublishLocationDisplay();

        // 刷新所有用户标记（包括自己）
        refreshAllMarkers();

        // 发送位置到服务器
        sendPositionToServer();

        // 查询附近的气泡
        requestNearbyBubbles();
    }
        


    // ==================== 更新我的标记 ====================
    /**
     * 更新地图上自己的位置标记。
     * - 头像为圆形裁剪，支持 emoji 与 Base64 图片。
     */
    async function updateMyMarker() {
        if (!map || !myPosition) return;

        // 局域模式：通常使用圆圈代表位置，但若是明确的 GPS 模式，应显示人物 marker
        // 搜索（manual）模式 或 全局模式：显示 marker，不显示圆圈
        const isLocalGps = !isGlobalMode && locationMode !== 'manual';
        // 只有当处于局域且不是 GPS 模式时，使用圆圈表示位置（保留向后兼容）
        if (isLocalGps && locationMode !== 'gps') {
            updateMyRange();
            return;
        }

        // 确保范围圈存在并更新位置/半径
        updateMyRange();

        // 标记位置：手动/搜索定位优先使用 manualPosition，否则使用 myPosition（默认 GPS）
        const markerPos = (locationMode === 'manual' && typeof manualPosition !== 'undefined' && manualPosition) ? manualPosition : myPosition;

        // 先同步更新已存在的 marker 的位置，或创建一个占位 marker，避免等待头像生成导致无标记显示
        const markerLatLng = new qq.maps.LatLng(markerPos.lat, markerPos.lng);

        if (myMarker) {
            try { myMarker.setPosition(markerLatLng); myMarker.setMap(map); } catch (e) { console.warn('更新现有 myMarker 位置失败', e); }
        } else {
            // 创建占位图标（简单圆点 SVG），立即显示
            const placeholderSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='20' cy='20' r='10' fill='%23FFAA00' stroke='white' stroke-width='2'/></svg>`)}`;
            const phIcon = new qq.maps.MarkerImage(
                placeholderSvg,
                new qq.maps.Size(40, 40),
                new qq.maps.Point(0, 0),
                new qq.maps.Point(20, 20)
            );
            myMarker = new qq.maps.Marker({ map: map, position: markerLatLng, title: currentUser ? currentUser.nickname : '我的位置', icon: phIcon });
        }

        // 异步生成并替换为头像 icon（不会阻塞 marker 的即时显示）
        (async () => {
            try {
                const avatar  = currentUser?.avatar || '👤';
                const iconUrl = await generateAvatarIconUrl(avatar, 48, '#FFAA00', true);
                if (!map || !myMarker) return;
                const icon = new qq.maps.MarkerImage(
                    iconUrl,
                    new qq.maps.Size(48, 48),
                    new qq.maps.Point(0, 0),
                    new qq.maps.Point(24, 24)
                );
                myMarker.setIcon(icon);
                myMarker.setTitle(currentUser ? currentUser.nickname : '我的位置');
            } catch (e) {
                console.warn('异步生成头像失败，保留占位图标', e);
            }
        })();
    }

    // ==================== 更新我的可见范围圆圈 ====================
    function updateMyRange() {
        // 选择圆心：若处于手动/搜索定位且存在 manualPosition，则以 manualPosition 为中心，否则使用 myPosition
        const centerPos = (locationMode === 'manual' && typeof manualPosition !== 'undefined' && manualPosition) ? manualPosition : myPosition;

        console.log('🔵 updateMyRange 调用', { locationMode, isGlobalMode, centerPos, visibleRange, mapExists: !!map });

        if (!map || !centerPos) {
            console.log('🔶 无法创建范围圈：map或中心坐标缺失', { map: !!map, centerPos });
            if (myRangeCircle) { myRangeCircle.setMap(null); myRangeCircle = null; }
            return;
        }

        // ⭐ 全局模式下不显示圆圈
        if (isGlobalMode) {
            if (myRangeCircle) {
                myRangeCircle.setMap(null);
                myRangeCircle = null;
                console.log('🔶 全局模式：移除范围圈');
            }
            return;
        }

        const primaryHex = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#7f8a90';
        const c = hexToRgb(primaryHex);
        const newCenter = new qq.maps.LatLng(centerPos.lat, centerPos.lng);

        if (myRangeCircle) {
            myRangeCircle.setCenter(newCenter);
            myRangeCircle.setRadius(visibleRange);
            myRangeCircle.setFillColor(new qq.maps.Color(c.r, c.g, c.b, 0.24));
            myRangeCircle.setStrokeColor(new qq.maps.Color(c.r, c.g, c.b, 0.58));
            return;
        }

        try {
            myRangeCircle = new qq.maps.Circle({
                map: map,
                center: newCenter,
                radius: visibleRange,
                fillColor: new qq.maps.Color(c.r, c.g, c.b, 0.24),
                strokeColor: new qq.maps.Color(c.r, c.g, c.b, 0.58),
                strokeWeight: 2
            });
            try { window._lastRangeCreatedAt = Date.now(); } catch (e) {}
            console.log('✅ 范围圆圈已创建', { centerPos, visibleRange });
        } catch (e) {
            console.error('❌ 创建范围圆圈失败：', e);
        }
    }

    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        return {
            r: parseInt(h.substring(0, 2), 16),
            g: parseInt(h.substring(2, 4), 16),
            b: parseInt(h.substring(4, 6), 16)
        };
    }
    // 安全移除我的范围圆圈，默认会跳过刚创建的圆圈以避免闪动
    function safeRemoveMyRangeCircle(force) {
        try {
            const last = (window && window._lastRangeCreatedAt) ? window._lastRangeCreatedAt : 0;
            if (!force && Date.now() - last < 600) {
                console.log('🔒 safeRemoveMyRangeCircle: 跳过刚创建的圆圈');
                return;
            }
            if (myRangeCircle) {
                myRangeCircle.setMap(null);
                myRangeCircle = null;
                console.log('🗑️ 安全移除范围圆圈', { force: !!force });
            }
        } catch (e) {
            console.warn('safeRemoveMyRangeCircle 错误', e);
        }
    }
        
    // ==================== ⭐ 局域范围调节功能 ====================
        
        

    

    // 应用范围变化（松开滑块或点击快捷按钮时）
    function applyRangeChange(value) {
        const newRange = parseInt(value);
        setRange(newRange);
    }
        
    // 设置范围（核心函数）
    function setRange(newRange) {
        if (newRange < 100) newRange = 100;
        if (newRange > 10000) newRange = 10000;
            
        const oldRange = visibleRange;
        visibleRange = newRange;
            
        console.log(`🔵 局域范围变更: ${oldRange}米 → ${visibleRange}米`);
            
        // 更新显示
        updateRangePreview(visibleRange);
            
        // 更新范围圆圈
        if (myRangeCircle && myPosition) {
            myRangeCircle.setRadius(visibleRange);
            console.log(`✅ 范围圆圈已更新: ${visibleRange}米`);
        } else {
            updateMyRange();
        }
            
        // ⭐ 重要：范围变化后需要做的事情
            
        // 1. 发送新的位置信息（包含新范围）到服务器
        sendPositionToServer();
            
        // 2. 重新查询附近气泡（使用新范围）
        requestNearbyBubbles();
            
        // 3. 刷新所有用户标记（重新计算可见性）
        refreshAllMarkers();
            
        // 4. 显示提示
            
        console.log(`✅ 范围调整完成，已触发气泡刷新和用户可见性更新`);
    }
        
    // 格式化范围显示
    function formatRangeDisplay(meters) {
        if (meters >= 1000) {
            return (meters / 1000).toFixed(1) + '公里';
        } else {
            return meters + '米';
        }
    }

    // ==================== 位置弹窗功能 ====================


    // ==================== 升级版：位置选择弹窗（支持手动定位+搜索） ====================
    function openLocationModal() {
        const modal = document.getElementById('locationModal');
        modal.style.display = 'flex';
    
        // 清空搜索框和结果
        const searchInput = document.getElementById('locationSearchInput');
        searchInput.value = '';
        document.getElementById('locationSuggestions').innerHTML = '';
    
        // 更新当前位置显示
        updateLocationModalInfo();
    
        // 自动聚焦到搜索框
        setTimeout(() => {
    searchInput.focus();
        }, 300);
    
        // 如果当前是手动模式且有手动位置，将地图中心移动到该位置
        if (locationMode === 'manual' && manualPosition) {
    map.panTo(new qq.maps.LatLng(manualPosition.lat, manualPosition.lng));
        }
    }

    function closeLocationModal() {
        document.getElementById('locationModal').style.display = 'none';
        document.getElementById('locationSearchInput').value = '';
        document.getElementById('locationSuggestions').innerHTML = '';
    }

    function searchLocation() {
        // ⭐ 新增：如果已经有正在执行的搜索，先清除之前的计时器（双重保险）
        if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
        }
    
        const input = document.getElementById('locationSearchInput').value.trim();
        const suggestionsDiv = document.getElementById('locationSuggestions');
    
        console.log('🔍 执行搜索:', input);
    
        if (!input) {
    suggestionsDiv.innerHTML = '';
    return;
        }
    
        // 如果距离上次搜索时间太短，这里可能还有重复调用，可以再加一层保护
        const now = Date.now();
        if (window.lastSearchTime && window.lastSearchKeyword === input && now - window.lastSearchTime < 1000) {
    console.log('⏱️ 搜索太频繁，忽略');
    return;
        }
    
        // 记录本次搜索
        window.lastSearchTime = now;
        window.lastSearchKeyword = input;
    
        // 显示加载中
        suggestionsDiv.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-tertiary);">搜索中...</div>';
    
        // 通过 WebSocket 发送搜索请求到后端
        if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
        type: "searchPlaces",
        keyword: input
    }));
        } else {
    suggestionsDiv.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-tertiary);">网络连接失败</div>';
        }
    }


    // 从搜索结果中选择位置
    function selectLocationFromSearch(place) {
        manualPosition = {
    lat: place.lat,
    lng: place.lng
        };
    
        // ⭐ v9.7.5: 标记为从搜索进入，禁用手动点击
        isFromSearchLocation = true;
    
        // 切换到手动模式（如果还没切换）
        if (locationMode !== 'manual') {
    setLocationMode('manual');
        }
    
        // 更新位置
        updateMyPosition(manualPosition);
    
        // 更新弹窗信息
        updateLocationModalInfo();
    
        // 将地图中心移动到选择的位置
        if (map) {
    map.panTo(new qq.maps.LatLng(place.lat, place.lng));
        }
    
        // 在搜索框中显示选中的地点名称
        document.getElementById('locationSearchInput').value = place.name;
        document.getElementById('locationSuggestions').innerHTML = '';
    
    }


    // 更新位置弹窗中的信息
    function updateLocationModalInfo() {
        const infoDiv = document.getElementById('selectedLocationInfo');
        const pos = locationMode === 'manual' && manualPosition ? manualPosition : myPosition;
    
        if (!pos) return;
    
        infoDiv.innerHTML = `
    <div style="margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
            <span style="color: var(--primary-color);">📍</span>
            <strong>当前位置:</strong>
        </div>
        <div style="font-family: monospace; font-size: 14px; padding: 5px; background: var(--bg-secondary); border-radius: 4px;">
            ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}
        </div>
    </div>
        
    <div style="margin: 15px 0; border-top: 1px solid #e0e0e0; padding-top: 15px;">
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 10px;">🔍 搜索地点</div>
            
        <!-- ⭐ v9.7.5: 移除手动定位，只保留搜索功能 -->
        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
            <span style="display: block; margin-bottom: 5px;">💡 在上方搜索框输入地点名称</span>
            <span style="display: block; font-size: 12px; color: var(--text-tertiary);">支持模糊搜索，点击结果即可定位</span>
        </div>
    </div>
        
    <div style="margin-top: 15px; font-size: 12px; color: var(--text-tertiary); border-top: 1px solid #eee; padding-top: 10px;">
        ${locationMode === 'manual' ? '🔍 当前模式: 搜索定位' : '📍 当前模式: GPS定位'}
    </div>
        `;
    }

    // 切换选项卡
    // ⭐ v9.7.5: 已移除手动定位功能，此函数保留以防其他地方调用
    function switchLocationTab(tab) {
        // 不再需要切换标签，因为只保留搜索功能
        console.log('switchLocationTab已弃用，只支持搜索定位');
    }

    // 确认位置选择
    function confirmLocation() {
        if (locationMode === 'manual' && manualPosition) {
    // 已经选择好了，直接关闭
    closeLocationModal();
        } else if (myPosition) {
    // 如果没有手动选择，但已有GPS位置，也允许确认
    closeLocationModal();
        } else {
        }
    }


    function closeLocationModal() {
        document.getElementById('locationModal').style.display = 'none';
        document.getElementById('locationSearchInput').value = '';
        document.getElementById('locationSuggestions').innerHTML = '';
    }


    // ==================== 位置状态更新 ====================
    function updateLocationStatus(text) {
        const element = document.getElementById('locationText');
        if (element) element.textContent = text;
    }

function updatePublishLocationDisplay() {
    const element = document.getElementById('publishLocationText');
    const submitLabel = document.getElementById('publishSubmitLabel');
    
    if (!myPosition) {
        if (element) element.textContent = '定位中...';
        if (submitLabel) submitLabel.textContent = '定位中发布';
        return;
    }
    
    const useSearchPosition = locationMode === 'manual' && !!manualPosition;
    const modeText = useSearchPosition ? '手动选择' : 'GPS定位';
    if (element) element.textContent = modeText;
    if (submitLabel) {
        submitLabel.textContent = useSearchPosition ? '在搜索位置发布' : '发布';
    }
}
    function updateLocationDisplay() {
        updateLocationStatus(locationMode === 'gps' ? ' GPS定位中' : ' 手动选择');
        updatePublishLocationDisplay();
        updateModeTopBanner();
    }

function updateModeTopBanner() {
    const banner = document.getElementById('modeTopBanner');
    const bannerText = document.getElementById('modeTopBannerText');
    if (!banner || !bannerText) return;

    const shortName = (name) => {
        if (!name) return '搜索地点';
        return name.length > 10 ? (name.slice(0, 10) + '...') : name;
    };

    if (isGlobalMode) {
        banner.style.display = 'flex';
        bannerText.textContent = '当前为全局模式';
        return;
    }

    if (locationMode === 'manual' && manualPosition) {
        banner.style.display = 'flex';
        bannerText.textContent = `当前为搜索定位：${shortName(lastManualLocationName)}`;
        return;
    }

        banner.style.display = 'none';
    }

    function backToCurrentLocation() {
        if (isGlobalMode) {
            deactivateGlobalMode();
        }

        lastManualLocationName = '';

    setLocationMode('gps');

        if (gpsPosition) {
            updateMyPosition(gpsPosition);
            if (map) {
                map.panTo(new qq.maps.LatLng(gpsPosition.lat, gpsPosition.lng));
            }
        } else {
            getGPSLocation();
        }

        updateModeTopBanner();
    }
