    // ==================== 响应式布局处理 ====================
    function handleResize() {
        if (window.innerWidth <= 768) {
            // 手机端：自动调整布局
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
    }

    // ==================== 面板收起/展开功能 ====================
    function togglePanel() {
        const panel = document.getElementById('controlPanel');
        const mapContainer = document.getElementById('mapContainer');

        panelCollapsed = !panelCollapsed;
            
        if (panelCollapsed) {
            panel.classList.add('collapsed');
            mapContainer.classList.add('full-width');
            toggleBtn.textContent = '展开面板';
        } else {
            panel.classList.remove('collapsed');
            mapContainer.classList.remove('full-width');
            toggleBtn.textContent = '收起面板';
        }
    }

    // ==================== 定期刷新函数 ====================
    function startAutoRefresh() {
        console.log("🔄 启动自动刷新定时器（每10秒全量同步一次）");
            
        // 如果已有定时器，先清除
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
            
        // 创建新的定时器，每10秒全量同步一次
        refreshTimer = setInterval(() => {
            console.log("⏰ 定时刷新触发 - " + new Date().toLocaleTimeString());
                
            // 如果清除模式中，不请求气泡
            if (clearBubblesFlag) {
                console.log("⏸️ 清除模式中，跳过气泡请求");
                return;
            }

            // 如果已登录且有地图，就刷新标记
            if (currentUser && map && myPosition) {
                // 1. 先请求在线用户列表
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: "requestOnlineUsers"
                    }));
                }
                    
                // 2. 刷新标记（即使位置不变也刷新）
                refreshAllMarkers();
                    
                // 3. 请求附近气泡 - 关键！（全量同步由 queryResult 处理）
                requestNearbyBubbles();
                    
                // 4. 清理过期气泡
                cleanupExpiredBubbles();
            } else {
                console.log("⏸️ 定时刷新暂停：用户未登录或地图未初始化");
            }
        }, 10000); // 改为10000毫秒 = 10秒
            
        console.log("✅ 自动刷新定时器已启动，间隔10秒");
    }

    // ⭐ 新增：清理过期气泡函数
    function cleanupExpiredBubbles() {
        const now = Date.now();
        let expiredCount = 0;
            
        // 从bubbles数组中移除过期气泡
        bubbles = bubbles.filter(bubble => {
            if (bubble.expiresAt && bubble.expiresAt < now) {
                expiredCount++;
                return false;
            }
            return true;
        });
            
        // 从地图上移除过期气泡标记
        bubbleMarkers.forEach((info, id) => {
            if (info.bubble.expiresAt && info.bubble.expiresAt < now) {
                if (info.label) {
                    info.label.setMap(null);
                }
                bubbleMarkers.delete(id);
                expiredCount++;
            }
        });
            
        if (expiredCount > 0) {
            console.log(`🧹 清理了 ${expiredCount} 个过期气泡`);
            refreshBubbleMarkersForCurrentZoom();
        }
    }
    function stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
            console.log("🛑 自动刷新定时器已停止");
        }
    }
