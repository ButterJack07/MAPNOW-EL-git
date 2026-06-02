    function selectBubbleType(type) {
        selectedBubbleType = type;
            
        // 更新UI - 药丸按钮
        document.querySelectorAll('.bubble-type-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        const pillBtn = document.querySelector(`.bubble-type-btn[data-type="${type}"]`);
        if (pillBtn) pillBtn.classList.add('selected');
        
        // 更新UI - 圆形选择器
        document.querySelectorAll('.type-circle').forEach(circle => {
            if (circle.dataset.type === type) {
                circle.classList.add('active');
            } else {
                circle.classList.remove('active');
            }
        });
        
        // ⭐ 建群类型禁用content输入框
        const contentInput = document.getElementById('bubbleContent');
        const contentPanelInput = document.getElementById('bubbleContentPanel');
        
        if (type === 'group') {
            // 禁用并清空content输入框
            if (contentInput) {
                contentInput.disabled = true;
                contentInput.value = '';
                contentInput.placeholder = '建群类型无需填写内容';
                contentInput.style.background = '#f5f5f5';
            }
            if (contentPanelInput) {
                contentPanelInput.disabled = true;
                contentPanelInput.value = '';
                contentPanelInput.placeholder = '建群类型无需填写内容';
                contentPanelInput.style.background = '#f5f5f5';
            }
        } else {
            // 启用content输入框
            if (contentInput) {
                contentInput.disabled = false;
                contentInput.placeholder = '输入气泡内容';
                contentInput.style.background = 'white';
            }
            if (contentPanelInput) {
                contentPanelInput.disabled = false;
                contentPanelInput.placeholder = '输入气泡内容';
                contentPanelInput.style.background = 'white';
            }
        }
            
        console.log("✅ 选择气泡类型:", type);
    }

    // ⭐ 新增：处理图片上传（发布面板）
    function handleImageUploadPanel(event) {
        const files = Array.from(event.target.files);
        
        // 限制最多3张
        const remainingSlots = 3 - bubbleImages.length;
        const filesToAdd = files.slice(0, remainingSlots);
        
        if (files.length > remainingSlots) {
        }
        
        filesToAdd.forEach(file => {
            // 检查文件大小（最大5MB）
            if (file.size > 5 * 1024 * 1024) {
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                bubbleImages.push(e.target.result);
                updateImagePreviewPanel();
            };
            reader.readAsDataURL(file);
        });
        
        // 清空input以便再次选择
        event.target.value = '';
    }

    // ⭐ 新增：更新图片预览（发布面板）
    function updateImagePreviewPanel() {
        const container = document.getElementById('imagePreviewPanel');
        if (!container) return;
        
        if (bubbleImages.length === 0) {
            container.innerHTML = '<div style="color: var(--text-tertiary); font-size: 13px; text-align: center; width: 100%; padding: 10px;">暂无图片</div>';
            return;
        }
        
        container.innerHTML = bubbleImages.map((img, index) => `
            <div style="position: relative; width: 80px; height: 80px; border-radius: 6px; overflow: hidden; border: 2px solid #dee2e6;">
                <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
                <button onclick="removeImagePanel(${index})" 
                        style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px;
                               background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%;
                               cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;"
                        title="删除">×</button>
            </div>
        `).join('');
    }

    // ⭐ 新增：删除图片（发布面板）
    function removeImagePanel(index) {
        bubbleImages.splice(index, 1);
        updateImagePreviewPanel();
    }

    function addBubble(bubble, skipRangeCheck = false, deferRender = false) {
        // 检查清除标记
        if (window.clearBubblesFlag) {
            console.log('🚫 清除模式中，忽略新气泡:', bubble.id);
            return;
        }

        // ✅ 局域范围过滤：只接受在当前可见范围内的气泡
        if (!skipRangeCheck && myPosition && bubble.lat && bubble.lng) {
            const dist = calculateDistance(
                myPosition.lat, myPosition.lng,
                bubble.lat, bubble.lng
            );
            const range = visibleRange || 1000;
            if (dist > range) {
                console.log(`🚫 气泡超出局域范围 (${dist.toFixed(0)}m > ${range}m)，已过滤: ${bubble.title}`);
                return null;
            }
        }

        // 检查是否已存在
        const existingBubble = bubbles.find(b => b.id === bubble.id);
        if (existingBubble) {
            console.log('⚠️ 气泡已存在，跳过:', bubble.id);
            return;
        }

        // ⭐ 关键：建群气泡的roomCode应该由服务器提供
        if (bubble.type === 'group') {
            if (!bubble.roomCode) {
                console.error("❌ 建群气泡缺少roomCode！");
                console.error("   气泡ID:", bubble.id);
                console.error("   这个气泡无法正常使用，请检查服务器端代码");
                console.error("   服务器需要保存客户端发送的roomCode");
                // 不再自动生成，避免每个客户端生成不同的代码
            } else {
                console.log("✅ 建群气泡roomCode:", bubble.roomCode);
            }
        }
            
        // 确保气泡有必要的字段
        if (!bubble.createdAt) {
            bubble.createdAt = Date.now();
        }
        if (!bubble.time) {
            bubble.time = bubble.createdAt;
        }
            
        // 添加到列表
        bubbles.push(bubble);

        // 按当前缩放级别重绘（包含重叠聚合）
        if (!deferRender) {
            refreshBubbleMarkersForCurrentZoom();
        }
            
        return bubble;
    }

    // 显示长按提示
    let currentHint = null;

    function showLongPressHint(bubbleTitle, position) {
        // 移除现有的提示
        hideLongPressHint();
            
        // 创建提示元素
        currentHint = document.createElement('div');
        currentHint.className = 'long-press-hint';
        currentHint.textContent = `长按显示 ${bubbleTitle} 详情`;
            
        // 计算位置
        const pixelPosition = map.getProjection().fromLatLngToContainerPixel(position);
        currentHint.style.left = (pixelPosition.x + 10) + 'px';
        currentHint.style.top = (pixelPosition.y + 60) + 'px';
            
        document.body.appendChild(currentHint);
    }

    // 隐藏长按提示
    function hideLongPressHint() {
        if (currentHint) {
            currentHint.remove();
            currentHint = null;
        }
    }


    function getBubbleTypeName(type) {
        const names = {
            recommend: '推荐',
            help: '求助',
            team: '组队',
            warning: '避雷',
            news: '见闻'
        };
        return names[type] || type;
    }


            
    // ⭐ 聚合距离阈值（占屏幕宽度的百分比），可通过调试按钮实时调整
    let bubbleClusterThresholdPct = 5.0; // 默认 5%

    function getBubbleClusterThresholdPx() {
        // 将屏幕宽度百分比转换为像素距离
        return window.innerWidth * (bubbleClusterThresholdPct / 100);
    }

    function groupBubblesByDistance(sourceBubbles) {
        if (!map || !sourceBubbles.length) return sourceBubbles.map(b => [b]);

        const thresholdPx = getBubbleClusterThresholdPx();

        let bounds;
        try { bounds = map.getBounds(); } catch(e) { bounds = null; }
        if (!bounds) return sourceBubbles.map(b => [b]);

        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const mapW = window.innerWidth;
        const mapH = window.innerHeight;

        const lngSpan = ne.getLng() - sw.getLng();
        const latSpan = ne.getLat() - sw.getLat();
        if (lngSpan <= 0 || latSpan <= 0) return sourceBubbles.map(b => [b]);

        // 只聚合当前视口内的气泡，视口外的不参与
        const inBounds = sourceBubbles.filter(b =>
            b.lat >= sw.getLat() && b.lat <= ne.getLat() &&
            b.lng >= sw.getLng() && b.lng <= ne.getLng()
        );
        if (!inBounds.length) return [];

        const pts = inBounds.map(b => ({
            bubble: b,
            x: ((b.lng - sw.getLng()) / lngSpan) * mapW,
            y: ((ne.getLat() - b.lat) / latSpan) * mapH
        }));

        // 单链接聚合（single-linkage）：
        // 新成员加入后，以该新成员为起点继续扩展，
        // 确保链式分布也能被完整合并。
        const used = new Set();
        const groups = [];

        for (let i = 0; i < pts.length; i++) {
            if (used.has(i)) continue;
            used.add(i);

            const groupIdxs = [i];
            const queue = [i];

            while (queue.length) {
                const cur = queue.shift();
                const ax = pts[cur].x, ay = pts[cur].y;

                for (let j = 0; j < pts.length; j++) {
                    if (used.has(j)) continue;
                    const dx = ax - pts[j].x;
                    const dy = ay - pts[j].y;
                    if (Math.sqrt(dx * dx + dy * dy) <= thresholdPx) {
                        used.add(j);
                        groupIdxs.push(j);
                        queue.push(j);
                    }
                }
            }

            groups.push(groupIdxs.map(idx => pts[idx].bubble));
        }

        // 第二遍：将视觉上与某聚合重心重叠的单气泡并入该聚合
        // （处理"聚合重心滑到单气泡旁边"的边界情况）
        const singles = groups.filter(g => g.length === 1);
        const clusters = groups.filter(g => g.length > 1);

        if (singles.length && clusters.length) {
            // 计算各聚合重心像素坐标
            const clusterCentroids = clusters.map(cl => {
                const xs = cl.map(b => ((b.lng - sw.getLng()) / lngSpan) * mapW);
                const ys = cl.map(b => ((ne.getLat() - b.lat) / latSpan) * mapH);
                return {
                    cx: xs.reduce((a, v) => a + v, 0) / xs.length,
                    cy: ys.reduce((a, v) => a + v, 0) / ys.length
                };
            });

            const absorbed = new Set();
            singles.forEach((sg, si) => {
                const b = sg[0];
                const bx = ((b.lng - sw.getLng()) / lngSpan) * mapW;
                const by = ((ne.getLat() - b.lat) / latSpan) * mapH;
                for (let ci = 0; ci < clusters.length; ci++) {
                    const { cx, cy } = clusterCentroids[ci];
                    const dx = bx - cx, dy = by - cy;
                    if (Math.sqrt(dx * dx + dy * dy) <= thresholdPx) {
                        clusters[ci].push(b);
                        absorbed.add(si);
                        break;
                    }
                }
            });

            // 重建最终分组：未被吸收的单气泡 + 所有聚合
            return [
                ...singles.filter((_, si) => !absorbed.has(si)),
                ...clusters
            ];
        }

        return groups;
    }

    function clearBubbleLabelsOnly() {
        const removed = new Set();
        bubbleMarkers.forEach((markerInfo) => {
            if (markerInfo && markerInfo.label && !removed.has(markerInfo.label)) {
                markerInfo.label.setMap(null);
                removed.add(markerInfo.label);
            }
        });
        bubbleMarkers.clear();
        clusterLookup.clear();
    }

    function addBubbleToMap(bubble) {
        if (!map || !bubble) return null;

        const icons = {
            recommend: '👍',
            help: '🆘',
            team: '👥',
            warning: '⚠️',
            news: '📰',
            group: '💬'
        };

        const icon = icons[bubble.type] || '📍';
        const label = new qq.maps.Label({
            position: new qq.maps.LatLng(bubble.lat, bubble.lng),
            map: map,
            content: `<div class="bubble bubble-${bubble.type}" data-bubble-id="${bubble.id}" style="cursor:pointer;pointer-events:none;" title="点击查看详情">${icon}</div>`,
            style: { border: 'none', background: 'transparent' }
        });

        qq.maps.event.addListener(label, 'click', function() {
            if (currentOpenBubbleId === bubble.id && currentInfoWindow) {
                currentInfoWindow.close();
                currentInfoWindow = null;
                currentOpenBubbleId = null;
            } else {
                showBubbleInfoWindow(bubble, label);
            }
        });

        return label;
    }

    function clearSpiderfy() {
        _suppressRefresh = false;
        spiderfyState.labels.forEach(l => l && l.setMap && l.setMap(null));
        spiderfyState.lines.forEach(p => p && p.setMap && p.setMap(null));
        spiderfyState.clusterId = null;
        spiderfyState.labels = [];
        spiderfyState.lines = [];
        hideSpiderfyOverlay();
        restorePreClusterView();
    }

    function restorePreClusterView() {
        if (preClusterZoomSnap && map) {
            map.setZoom(preClusterZoomSnap.zoom);
            map.setCenter(preClusterZoomSnap.center);
            preClusterZoomSnap = null;
        }
    }
    window.restorePreClusterView = restorePreClusterView;

    function showSpiderfyOverlay() {
        let ov = document.getElementById('spiderfyOverlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'spiderfyOverlay';
            // z-index 低于 QQ Maps 标记层（~8000），高于普通 UI
            ov.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.35);backdrop-filter:blur(1px);-webkit-backdrop-filter:blur(1px);';
            ov.addEventListener('click', () => clearSpiderfy());
            document.body.appendChild(ov);
        }
        ov.style.display = 'block';
    }

    function hideSpiderfyOverlay() {
        const ov = document.getElementById('spiderfyOverlay');
        if (ov) ov.style.display = 'none';
    }

    function spiderfyCluster(clusterId, centerLat, centerLng) {
        const clusterBubbles = clusterLookup.get(clusterId) || [];
        if (!clusterBubbles.length) return;

        clearSpiderfy();
        spiderfyState.clusterId = clusterId;

        const count = clusterBubbles.length;
        const radiusMeters = count > 8 ? 45 : 32;

        const icons = {
            recommend: '👍',
            help: '🆘',
            team: '👥',
            warning: '⚠️',
            news: '📰',
            group: '💬'
        };

        for (let i = 0; i < count; i++) {
            const bubble = clusterBubbles[i];
            const angle = (Math.PI * 2 * i) / count;

            const dx = radiusMeters * Math.cos(angle);
            const dy = radiusMeters * Math.sin(angle);

            const dLat = (dy / 111111);
            const dLng = (dx / (111111 * Math.cos((centerLat * Math.PI) / 180)));

            const targetLat = centerLat + dLat;
            const targetLng = centerLng + dLng;

            const line = new qq.maps.Polyline({
                map,
                path: [
                    new qq.maps.LatLng(centerLat, centerLng),
                    new qq.maps.LatLng(targetLat, targetLng)
                ],
                strokeColor: '#9a938b',
                strokeWeight: 1,
                strokeOpacity: 0.8
            });
            spiderfyState.lines.push(line);

            const icon = icons[bubble.type] || '📍';
            const spiderLabel = new qq.maps.Label({
                position: new qq.maps.LatLng(targetLat, targetLng),
                map,
                content: `<div class="bubble-spider" style="pointer-events:none;" title="${escapeHtml(bubble.title || '无标题')}">${icon}</div>`,
                style: { border: 'none', background: 'transparent' }
            });

            qq.maps.event.addListener(spiderLabel, 'click', function() {
                clearSpiderfy();
                showBubbleInfoWindow(bubble, spiderLabel);
            });

            spiderfyState.labels.push(spiderLabel);
        }
    }

    function showOverlapBubbleList(clusterId, lat, lng) {
        const clusterBubbles = clusterLookup.get(clusterId) || [];
        if (!clusterBubbles.length) return;

        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }

        const typeMap = {
            recommend: '推荐',
            help: '求助',
            team: '组队',
            warning: '避雷',
            news: '见闻',
            group: '建群'
        };

        const listHtml = clusterBubbles
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .map(b => {
                const t = typeMap[b.type] || '气泡';
                const timeStr = formatTime(b.createdAt || Date.now());
                return `<button onclick="openOverlapBubble('${clusterId}', '${b.id}')" style="display:block;width:100%;text-align:left;padding:8px 10px;border:1px solid var(--border-light);background:#f8f7f4;border-radius:8px;margin-bottom:6px;cursor:pointer;color:var(--text-primary);font-size:13px;"><div style='font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>${escapeHtml(b.title || '无标题')}</div><div style='display:flex;justify-content:space-between;color:var(--text-secondary);font-size:11px;margin-top:2px;'><span>${t} · ${escapeHtml(b.author || '匿名')}</span><span>${timeStr}</span></div></button>`;
            })
            .join('');

        const summary = clusterBubbles.reduce((acc, b) => {
            const k = b.type || 'other';
            acc[k] = (acc[k] || 0) + 1;
            return acc;
        }, {});

        const summaryText = Object.entries(summary)
            .map(([k, n]) => `${typeMap[k] || '其他'} ${n}`)
            .join(' · ');

        const content = `<div style="width:280px;max-height:300px;overflow-y:auto;padding:10px;background:var(--card-bg);border-radius:12px;"><div style="font-weight:700;margin-bottom:4px;color:var(--text-primary);">重叠气泡 ${clusterBubbles.length} 条</div><div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">${summaryText}</div>${listHtml}</div>`;

        const infoWindow = new qq.maps.InfoWindow({
            map,
            position: new qq.maps.LatLng(lat, lng),
            content
        });

        qq.maps.event.addListener(infoWindow, 'closeclick', function() {
            restorePreClusterView();
        });

        infoWindow.open();
        currentInfoWindow = infoWindow;
        currentOpenBubbleId = null;
    }

    window.openOverlapBubble = function(clusterId, bubbleId) {
        const clusterBubbles = clusterLookup.get(clusterId) || [];
        const bubble = clusterBubbles.find(b => b.id === bubbleId);
        if (!bubble) return;

        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }

        const markerInfo = bubbleMarkers.get(bubble.id);
        const label = markerInfo && markerInfo.label;
        if (label) {
            showBubbleInfoWindow(bubble, label);
        }
    };

    function refreshBubbleMarkersForCurrentZoom() {
        if (!map) return;

        clearSpiderfy();
        clearBubbleLabelsOnly();

        const groups = groupBubblesByDistance(
            typeof getFilteredBubbles === 'function' ? getFilteredBubbles() : bubbles
        );
        groups.forEach((group, idx) => {
            if (!group.length) return;

            if (group.length === 1) {
                const bubble = group[0];
                const label = addBubbleToMap(bubble);
                if (label) bubbleMarkers.set(bubble.id, { bubble, label });
                return;
            }

            const centerLat = group.reduce((s, b) => s + b.lat, 0) / group.length;
            const centerLng = group.reduce((s, b) => s + b.lng, 0) / group.length;
            const clusterId = `cluster_${idx}_${group.length}`;
            clusterLookup.set(clusterId, group);

            // 类型摘要：去重后取中文名，·分隔
            const typeNameMap = { recommend:'推荐', help:'求助', team:'组队', warning:'避雷', news:'见闻', group:'建群' };
            const typeSet = [...new Set(group.map(b => b.type || 'other'))];
            const typeLabel = typeSet.map(t => typeNameMap[t] || t).join('·');

            // 模式读取
            const isModeB = false;

            const clusterLabel = new qq.maps.Label({
                position: new qq.maps.LatLng(centerLat, centerLng),
                map,
                content: `<div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;">
                    <span class="bubble-cluster-glow" style="pointer-events:none;"></span>
                    <div class="bubble-cluster" style="pointer-events:none;" title="${isModeB ? '点击展开' : '点击查看列表'}">${group.length}</div>
                    <div style="pointer-events:none;font-size:10px;color:var(--text-primary);background:rgba(248,247,244,.94);border:1px solid var(--border-light);border-radius:8px;padding:2px 7px;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${typeLabel}</div>
                </div>`,
                style: { border: 'none', background: 'transparent' }
            });

            qq.maps.event.addListener(clusterLabel, 'click', function() {
                const mode = localStorage.getItem('clusterInteractionMode') || 'A';

                // 保存视图快照
                preClusterZoomSnap = {
                    zoom: map.getZoom(),
                    center: map.getCenter()
                };

                // 聚焦地图（禁止触发重新聚合）
                _suppressRefresh = true;
                map.setCenter(new qq.maps.LatLng(centerLat, centerLng));

                if (mode === 'B') {
                    if (spiderfyState.clusterId === clusterId) {
                        _suppressRefresh = false;
                        clearSpiderfy();
                    } else {
                        spiderfyCluster(clusterId, centerLat, centerLng);
                        // 等地图稳定后再显示遮罩，避免 bounds_changed 闪退
                        setTimeout(() => {
                            _suppressRefresh = false;
                            showSpiderfyOverlay();
                        }, 320);
                    }
                } else {
                    // 方式 A：显示气泡列表
                    setTimeout(() => { _suppressRefresh = false; }, 320);
                    if (currentInfoWindow) {
                        currentInfoWindow.close();
                        currentInfoWindow = null;
                    }
                    showOverlapBubbleList(clusterId, centerLat, centerLng);
                }
            });

            group.forEach((bubble) => {
                bubbleMarkers.set(bubble.id, { bubble, label: clusterLabel, clusterId });
            });
        });
    }

    // 暴露给外部筛选函数调用
    window.refreshBubbleMarkersForCurrentZoom = refreshBubbleMarkersForCurrentZoom;
    function showBubbleInfoWindow(bubble, label) {
        console.log(`🪟 显示气泡信息窗口: ${bubble.title}`);
    
        // ⭐ 记录浏览
        recordBubbleView(bubble.id);
    
        // 关闭现有的信息窗口
        if (currentInfoWindow) {
    currentInfoWindow.close();
    currentInfoWindow = null;
        }
    
        const typeNames = {
    recommend: '推荐',
    help: '求助',
    team: '组队',
    warning: '避雷',
    news: '见闻',
    group: '💬 建群'
        };
    
        const typeName = typeNames[bubble.type] || bubble.type;
    
        // 添加房间代码显示
        const roomCodeDisplay = bubble.type === 'group' && bubble.roomCode ? 
    `<div style="margin: 10px 0; padding: 10px; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid #FFD700;">
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 5px;">💬 群聊代码</div>
        <div style="font-family: 'Courier New', monospace; font-size: 20px; color: var(--text-primary); letter-spacing: 2px; text-align: center; padding: 8px;">
            ${bubble.roomCode}
        </div>
        <button onclick="setChatroomCode('${bubble.roomCode}')" 
                style="width: 100%; padding: 8px; margin-top: 8px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); border: none; border-radius: 6px; color: var(--text-primary); font-weight: 600; cursor: pointer;"
                onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(255, 215, 0, 0.4)';"
                onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
            加入此群聊
        </button>
    </div>` : '';
    
        // ⭐ 气泡互动状态
        const bubbleInteraction = bubbleInteractions[bubble.id] || {};
        const isLiked = bubbleInteraction.liked || false;
        const isFavorited = bubbleInteraction.favorited || false;
    
    // 创建信息窗口内容
    const content = `
        <div style="
    background: var(--card-bg);
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    width: 320px;  /* 固定宽度 */
    min-height: 280px;  /* 最小高度 */
    max-height: 500px;  /* 最大高度 */
    overflow-y: auto;  /* 内容过多时滚动 */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    position: relative;
        ">
    <!-- 标题和类型 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(bubble.title)}</div>
        <span style="padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; color: white; background: ${getBubbleColor(bubble.type)}; flex-shrink: 0;">${typeName}</span>
    </div>
        
    <!-- 群聊代码（如果有） -->
    ${roomCodeDisplay}
        
    <!-- 气泡内容（建群类型不显示内容）-->
    ${bubble.type !== 'group' && bubble.content ? `<div style="color: #495057; font-size: 14px; line-height: 1.6; margin: 10px 0; padding: 8px; background: var(--bg-secondary); border-radius: 8px; max-height: 150px; overflow-y: auto;">${escapeHtml(bubble.content).replace(/\n/g, '<br>')}</div>` : ''}
    
    <!-- ⭐ 气泡图片 -->
    ${bubble.images && bubble.images.length > 0 ? `
        <div style="display: flex; gap: 6px; margin: 10px 0; flex-wrap: wrap;">
            ${bubble.images.slice(0, 3).map((img, idx) => `
                <img src="${img}" 
                     onclick="window.open('${img}', '_blank')"
                     style="width: ${bubble.images.length === 1 ? '100%' : 'calc(50% - 3px)'}; 
                            max-width: ${bubble.images.length === 1 ? '300px' : '150px'};
                            height: ${bubble.images.length === 1 ? 'auto' : '100px'}; 
                            object-fit: cover; 
                            border-radius: 8px; 
                            cursor: pointer;
                            border: 1px solid var(--border-color);
                            transition: all 0.2s;"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'">
            `).join('')}
        </div>
    ` : ''}

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6c757d;">
        <div style="display: flex; align-items: center; gap: 5px;">
    <span style="font-size: 16px; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;">
        ${renderAvatarPreview(bubble.avatar)}
    </span>
    <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(bubble.author || '匿名')}</span>
        </div>
        <button onclick="startChatFromBubble('${bubble.author_id || bubble.authorId}')" 
        style="padding: 4px 10px; border-radius: 8px; background: #4CAF50; border: none; cursor: pointer; font-size: 11px; color: white; font-weight: 500; transition: all 0.2s; flex-shrink: 0;"
        onmouseover="this.style.background='#45a049';"
        onmouseout="this.style.background='#4CAF50';">
    💬 私聊
        </button>
        <div style="flex-shrink: 0;">${formatTime(bubble.createdAt || Date.now())}</div>
    </div>
        
    <!-- 互动按钮区域 -->
    <div style="display: flex; justify-content: space-around; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
        <button id="likeBtn-${bubble.id}" onclick="likeBubble('${bubble.id}')" 
                style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); cursor: pointer; transition: all 0.3s; font-size: 13px; color: ${isLiked ? '#FF6B6B' : '#666'}; font-weight: 500;">
            ${isLiked ? '❤️' : '🤍'} 点赞
        </button>
        <button id="favBtn-${bubble.id}" onclick="favoriteBubble('${bubble.id}')" 
                style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); cursor: pointer; transition: all 0.3s; font-size: 13px; color: ${isFavorited ? '#FFD700' : '#666'}; font-weight: 500;">
            ${isFavorited ? '⭐' : '☆'} 收藏
        </button>
        <!-- ⭐ 评论区按钮 -->
        <button onclick="showBubbleComments('${bubble.id}', '${bubble.title}', '${bubble.type}', '${bubble.author}', '${bubble.avatar}')" 
                style="
                    flex: 1;
                    padding: 8px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
                    cursor: pointer;
                    font-size: 13px;
                    color: white;
                    font-weight: 500;
                ">
            💬 评论区
        </button>
    </div>
        </div>
    `;


        try {
    console.log(`📍 气泡位置: ${bubble.lat}, ${bubble.lng}`);
        
    // 获取标签的位置
    const labelPosition = label.getPosition();
    console.log(`📍 标签位置: ${labelPosition.getLat()}, ${labelPosition.getLng()}`);
        
    // 创建信息窗口
    const infoWindow = new qq.maps.InfoWindow({
        map: map,
        position: labelPosition,
        content: content
    });
        
    // 打开信息窗口
    infoWindow.open();
    currentInfoWindow = infoWindow;
    currentOpenBubbleId = bubble.id; // ⭐ v9.7.6: 记录当前打开的气泡ID
    
    // ⭐ v9.7.6: 监听信息窗口关闭事件（点击×按钮时）
    qq.maps.event.addListener(infoWindow, 'closeclick', function() {
        console.log("🔽 信息窗口被×按钮关闭");
        currentOpenBubbleId = null;
        currentInfoWindow = null;
        // 移除气泡高亮
        const bubbleEl = document.querySelector(`[data-bubble-id="${bubble.id}"]`);
        if (bubbleEl) {
            bubbleEl.classList.remove('active');
        }
    });
        
    console.log("✅ 气泡信息窗口已打开");
        
    // 高亮选中的气泡
    document.querySelectorAll('.bubble').forEach(el => el.classList.remove('active'));
    const bubbleEl = document.querySelector(`[data-bubble-id="${bubble.id}"]`);
    if (bubbleEl) {
        bubbleEl.classList.add('active');
        console.log("✨ 气泡高亮");
    }
        
    return infoWindow;
        
        } catch (error) {
    console.error("❌ 创建信息窗口失败:", error);
    return null;
        }
    }


    function closeBubbleInfoWindow() {
        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }
        // 移除所有气泡的高亮状态
        document.querySelectorAll('.bubble').forEach(el => el.classList.remove('active'));
    }


    function getBubbleIcon(type) {
        const emojis = {
            recommend: '👍',
            help: '🆘',
            team: '👥',
            warning: '⚠️',
            news: '📰'
        };
            
        const emoji = emojis[type] || '🎈';
        const color = getBubbleColor(type);
            
        // 创建SVG图标
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="${color}" stroke="white" stroke-width="3"/>
                <text x="24" y="32" text-anchor="middle" fill="white" font-size="24" font-family="Arial">${emoji}</text>
            </svg>
        `;
            
        return new qq.maps.MarkerImage(
            'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
            new qq.maps.Size(48, 48),
            new qq.maps.Point(0, 0),
            new qq.maps.Point(24, 24)
        );
    }

    function getBubbleColor(type) {
        const colors = {
            recommend: '#FF4444',
            help: '#FFD700',
            team: '#4169E1',
            warning: '#9932CC',
            news: '#FF69B4'
        };
        return colors[type] || '#5483B3';
    }


    function showBubbleInfo(bubble) {
        let roomCodeInfo = '';
        if (bubble.type === 'group' && bubble.roomCode) {
            roomCodeInfo = `\n💬 群聊代码: ${bubble.roomCode}\n点击"加入此群聊"即可进入`;
        }
            
        const info = `
    🎈 气泡详情：
    标题：${bubble.title}
    类型：${getBubbleTypeName(bubble.type)}
    作者：${bubble.author}
    内容：${bubble.content || "无内容"}
    时间：${formatTime(bubble.time)}
    位置：${bubble.lat.toFixed(4)}, ${bubble.lng.toFixed(4)}
    ${roomCodeInfo}
        `;
            
    }

    function clearAllBubbles() {
        console.log("🗑️ 开始清除所有气泡");
            
        // 设置清除标记，防止新气泡被添加
        clearBubblesFlag = true;
            
        // 10秒后自动解除清除模式
        if (clearTimeoutId) clearTimeout(clearTimeoutId);
        clearTimeoutId = setTimeout(() => {
            clearBubblesFlag = false;
            console.log("🔄 自动解除清除模式");
        }, 10000);
            
        // 1. 先发送请求到服务器清除气泡
        if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
            socket.send(JSON.stringify({
                type: "clearBubbles",
                userId: currentUser.id,
                clearAll: true
            }));
            console.log("📤 已发送清除气泡请求到服务器");
        }
            
        // 2. 从地图上移除所有气泡标记
        bubbleMarkers.forEach((markerInfo, bubbleId) => {
            if (markerInfo.label) {
                markerInfo.label.setMap(null);
            }
        });
            
        // 3. 清空存储
        bubbleMarkers.clear();
        bubbles.length = 0;
        clearSpiderfy();
            
        // 4. 更新UI
        updateBubblesList();
            
        // 5. 关闭信息窗口
        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }
            
        console.log("✅ 气泡清除完成（锁定10秒）");
    }

    // 添加解除清除模式的函数
    function enableBubbleReceiving() {
        clearBubblesFlag = false;
        if (clearTimeoutId) {
            clearTimeout(clearTimeoutId);
            clearTimeoutId = null;
        }
        console.log("🔄 已启用气泡接收");
    }   
  


            // ==================== 公屏聊天功能 ====================