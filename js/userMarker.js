    // ==================== 刷新所有用户标记（新版） ====================
    // ==================== 刷新所有用户标记（新版） ====================
    function refreshAllMarkers() {
        console.log("\n" + "=".repeat(60));
        console.log("🔄 开始刷新所有用户标记");
        console.log("=".repeat(60));
            
        if (!myPosition || !map) {
            console.log("⚠️ 无法刷新：地图或我的位置不存在");
            return;
        }
        
        // 计算用于显示的圆心：手动/搜索定位优先使用 manualPosition
        const centerUsed = (locationMode === 'manual' && manualPosition) ? manualPosition : myPosition;
        const myLatLng = new qq.maps.LatLng(myPosition.lat, myPosition.lng);
        const myCenterLatLng = centerUsed ? new qq.maps.LatLng(centerUsed.lat, centerUsed.lng) : myLatLng;

        // 1. 更新我的标记或圆圈位置（标记与圆心均以手动选点优先，否则使用 GPS）
        const markerPosUsed = (locationMode === 'manual' && manualPosition) ? manualPosition : myPosition;
        const markerLatLng = new qq.maps.LatLng(markerPosUsed.lat, markerPosUsed.lng);
        if (myMarker) {
            myMarker.setPosition(markerLatLng);
        }
        if (myRangeCircle) {
            myRangeCircle.setCenter(markerLatLng);
        }
        
        // ⭐ 关键修复：先检查开关，如果关闭则隐藏所有其他用户
        if (!showOtherUsers) {
            console.log('📴 用户位置显示已关闭，隐藏所有其他用户');
            
            // 隐藏所有其他用户的标记和圆圈
            Object.keys(userMarkers).forEach(userId => {
                const isSelf = currentUser && (String(userId) === String(currentUser.id) || String(userId) === String(currentUser.userId));
                if (!isSelf) {
                    if (userMarkers[userId]) {
                        userMarkers[userId].setMap(null);
                    }
                    if (userRangeCircles[userId]) {
                        userRangeCircles[userId].setMap(null);
                    }
                }
            });
            
            console.log("✅ 已隐藏所有其他用户标记");
            return; // 直接返回，不处理后面的可见性判断
        }
        
        // 3. 获取在线用户列表（开关打开时才继续处理）
        const onlineUserIds = Object.keys(onlineUsers);
        console.log(`👥 在线用户总数: ${onlineUserIds.length}`);
        
        // 统计变量
        let visibleCount = 0;
        let hiddenCount = 0;
        let noPositionCount = 0;
        
        // 4. 处理每个在线用户
        onlineUserIds.forEach(userId => {
            const user = onlineUsers[userId];
            
            // 跳过自己（支持 server 返回的 userId 或 id 两种字段）
            if (currentUser && (String(userId) === String(currentUser.id) || String(userId) === String(currentUser.userId))) {
                console.log(`⏭️ 跳过自己: ${userId} (${user.nickname})`);
                return;
            }
            
            // 跳过设置了「暂时勿扰」的用户（他们主动隐藏了位置）
            if (user && user.invisible) {
                if (userMarkers[userId]) {
                    userMarkers[userId].setMap(null);
                }
                if (userRangeCircles[userId]) {
                    userRangeCircles[userId].setMap(null);
                }
                return;
            }

            // 检查用户是否有位置
            if (!user || !user.lat || !user.lng) {
                console.log(`⚠️ 用户 ${userId} (${user?.nickname || '未知'}) 无位置信息`);
                noPositionCount++;
                    
                // 隐藏可能存在的标记和圆圈
                if (userMarkers[userId]) {
                    userMarkers[userId].setMap(null);
                    console.log(`   🗑️ 隐藏用户标记: ${user.nickname} (无位置)`);
                }
                if (userRangeCircles[userId]) {
                    userRangeCircles[userId].setMap(null);
                    console.log(`   🗑️ 隐藏用户范围圆圈: ${user.nickname} (无位置)`);
                }
                return;
            }
                
            // 计算距离
            const distance = calculateDistance(
                myPosition.lat, myPosition.lng,
                user.lat, user.lng
            );
                
            // 获取双方范围
            const myRange = visibleRange;
            const userRange = user.range || 1000;
                
            // 判断可见性
            const iCanSeeThem = distance <= myRange;
            const theyCanSeeMe = distance <= userRange;
            const isVisible = iCanSeeThem && theyCanSeeMe;
                
            console.log(`\n👤 用户: ${user.nickname} (${userId})`);
            console.log(`   位置: (${user.lat.toFixed(6)}, ${user.lng.toFixed(6)})`);
            console.log(`   距离: ${Math.round(distance)}米`);
            console.log(`   我的范围: ${myRange}米 | 对方范围: ${userRange}米`);
            console.log(`   我能看到他: ${iCanSeeThem ? '✅' : '❌'} | 他能看到我: ${theyCanSeeMe ? '✅' : '❌'}`);
            console.log(`   最终可见性: ${isVisible ? '✅ 可见' : '❌ 不可见'}`);
                
            // 根据可见性处理
            if (isVisible) {
                visibleCount++;
                    
                // 可见：显示或更新标记和圆圈
                const theirLatLng = new qq.maps.LatLng(user.lat, user.lng);
                    
                // 创建或更新用户标记
                if (!userMarkers[userId]) {
                    console.log(`   🆕 创建新用户标记: ${user.nickname}`);
                        
                    // 使用头像生成圆形 icon（异步），保持与搜索进入时的样式一致
                    (function(uId, u, pos){
                        const avatar = u.avatar || '👤';
                        const borderColor = u.isVip ? '#f6c90e' : '#FFAA00';
                        generateAvatarIconUrl(avatar, 40, borderColor, true).then(iconUrl => {
                            const icon = new qq.maps.MarkerImage(
                                iconUrl,
                                new qq.maps.Size(40, 40),
                                new qq.maps.Point(0, 0),
                                new qq.maps.Point(20, 20)
                            );

                            const marker = new qq.maps.Marker({
                                map: map,
                                position: pos,
                                title: `${u.nickname} (${uId})`,
                                icon: icon
                            });

                            userMarkers[uId] = marker;

                            // 单击事件 - 显示用户信息
                            qq.maps.event.addListener(marker, 'click', function() {
                                showUserInfoWindow(u, pos);
                            });
                        }).catch(err => {
                            console.warn('生成用户头像图标失败，回退到默认图标', err);
                            // 回退到原始 SVG 占位图标
                            const fallback = new qq.maps.MarkerImage(
                                'data:image/svg+xml;utf8,' + encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                        <circle cx="20" cy="20" r="18" fill="#FFAA00" stroke="white" stroke-width="2"/>
                                        <text x="20" y="28" text-anchor="middle" fill="white" font-size="18" font-family="Arial">👤</text>
                                    </svg>
                                `),
                                new qq.maps.Size(40, 40),
                                new qq.maps.Point(0, 0),
                                new qq.maps.Point(20, 20)
                            );
                            const marker = new qq.maps.Marker({ map: map, position: pos, title: `${u.nickname} (${uId})`, icon: fallback });
                            userMarkers[uId] = marker;
                            qq.maps.event.addListener(marker, 'click', function() { showUserInfoWindow(u, pos); });
                        });
                    })(userId, user, theirLatLng);
                        
                } else {
                    // 更新现有标记位置并确保显示
                    userMarkers[userId].setPosition(theirLatLng);
                    userMarkers[userId].setMap(map);
                    console.log(`   🔄 更新用户标记位置: ${user.nickname}`);
                }
                    
                // 创建或更新用户范围圆圈
                if (!userRangeCircles[userId]) {
                    console.log(`   🆕 创建用户范围圆圈: ${user.nickname} (${userRange}米)`);
                        
                    userRangeCircles[userId] = new qq.maps.Circle({
                        map: map,
                        center: theirLatLng,
                        radius: userRange,
                        fillColor: new qq.maps.Color(255, 170, 0, 0.2),
                        strokeColor: new qq.maps.Color(255, 170, 0, 0.5),
                        strokeWeight: 1
                    });
                } else {
                    userRangeCircles[userId].setCenter(theirLatLng);
                    userRangeCircles[userId].setRadius(userRange);
                    userRangeCircles[userId].setMap(map);
                    console.log(`   🔄 更新用户范围圆圈: ${user.nickname} (${userRange}米)`);
                }
                    
            } else {
                hiddenCount++;
                    
                // 不可见：隐藏标记和圆圈
                if (userMarkers[userId]) {
                    userMarkers[userId].setMap(null);
                    console.log(`   🗑️ 隐藏用户标记: ${user.nickname} (距离${Math.round(distance)}米 > 互相可见范围)`);
                }
                if (userRangeCircles[userId]) {
                    userRangeCircles[userId].setMap(null);
                    console.log(`   🗑️ 隐藏用户范围圆圈: ${user.nickname}`);
                }
            }
        });
        
        console.log("\n" + "=".repeat(60));
        console.log("📊 刷新统计:");
        console.log(`   可见用户: ${visibleCount} 人`);
        console.log(`   隐藏用户: ${hiddenCount} 人`);
        console.log(`   无位置用户: ${noPositionCount} 人`);
        console.log("=".repeat(60));
    }

    // ==================== 用户标记悬停功能 ====================
    let currentUserInfoWindow = null;

    function showUserInfoWindow(user, position) {
        // 移除现有的信息窗口
        if (currentUserInfoWindow) {
            currentUserInfoWindow.close();
        }

            
        // 创建药丸形态的信息窗口内容（无背景框）
        const content = `
            <div style="
                background: transparent;
                padding: 8px 12px 8px 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                pointer-events: auto;
            ">
                <!-- 左侧：用户头像圆 -->
                <div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #5483B3 0%, #052659 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    flex-shrink: 0;
                    border: 2px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    ${user.avatar || '👤'}
                </div>
                    
                <!-- 中间：用户信息（药丸背景） -->
                <div style="
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                    background: linear-gradient(135deg, rgba(248, 249, 250, 0.95) 0%, rgba(233, 236, 239, 0.95) 100%);
                    backdrop-filter: blur(10px);
                    border-radius: 50px;
                    padding: 6px 15px 6px 12px;
                    border: 2px solid rgba(84, 131, 179, 0.8);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
                ">
                    <div style="
                        font-weight: 600;
                        color: var(--text-primary);
                        font-size: 11px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        margin-bottom: 1px;
                    ">
                        ${user.nickname}${user.isVip ? ' <span style="color:#f6c90e;font-size:10px;">👑</span>' : ''}
                    </div>
                    <div style="
                        font-size: 9px;
                        color: #6c757d;
                        font-family: 'Courier New', monospace;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    ">
                        ${user.userId ? 'ID: ' + user.userId.substring(0, 8) + '...' : 'ID: 未知'}
                    </div>
                </div>
            </div>
        `;
            
        // 创建信息窗口（下移更多）
        currentUserInfoWindow = new qq.maps.InfoWindow({
            map: map,
            position: position,
            content: content,
            offset: new qq.maps.Size(0, -80) // 下移更多，在标记下方显示
        });
            
        currentUserInfoWindow.open();
            
        console.log(`👤 显示用户信息: ${user.nickname}`);
            


        currentUserInfoWindow.open();
    
        console.log(`👤 显示用户信息: ${user.nickname}`);
            

            
        // 添加点击地图关闭功能
        qq.maps.event.addListenerOnce(map, 'click', function() {
            hideUserInfoWindow();
        });
            
        // 添加地图拖动关闭功能
        qq.maps.event.addListenerOnce(map, 'dragstart', function() {
            hideUserInfoWindow();
        });

    }

    function hideUserInfoWindow() {
        if (currentUserInfoWindow) {
            currentUserInfoWindow.close();
            currentUserInfoWindow = null;
        }
    }

