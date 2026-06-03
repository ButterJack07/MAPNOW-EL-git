// ==================== ⭐ 设置页面函数 ====================
        
    // 打开设置页面
    /**
     * 打开设置页
     */
    function openSettings() {
        document.getElementById('settingsOverlay').style.display = 'block';
        loadUserSettings();
        console.log('⚙️ 打开设置页面');
    }

    // 关闭设置页面
    function closeSettings() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) overlay.style.display = 'none';
        if (typeof setBottomNavActive === 'function') setBottomNavActive(null);
        console.log('⚙️ 关闭设置页面');
    }

    // 新手教程逻辑已拆分至 js/tutorial.js，保留此处作为占位。

    // 加载设置页显示
    function loadUserSettings() {
        if (!currentUser) return;
        const avatarEl = document.getElementById('settingsAvatar');
        if (avatarEl) avatarEl.textContent = currentUser.avatar || '👤';
        const nickEl = document.getElementById('settingsNickname');
        if (nickEl) nickEl.textContent = currentUser.nickname || currentUser.username || '未设置';
        const genderEl = document.getElementById('settingsGender');
        if (genderEl) genderEl.textContent = currentUser.gender || '保密';
        const birthdayEl = document.getElementById('settingsBirthday');
        if (birthdayEl) birthdayEl.textContent = currentUser.birthday || '未设置';
        const regionEl = document.getElementById('settingsRegion');
        if (regionEl) regionEl.textContent = currentUser.region || '未设置';
        const themeEl = document.getElementById('settingsTheme');
        if (themeEl) themeEl.textContent = currentUser.theme === 'light' ? '清新灰' : currentUser.theme === 'gradient' ? '深邃紫' : currentUser.theme === 'ocean' ? '海洋蓝' : currentUser.theme === 'green' ? '青春绿' : currentUser.theme === 'yellow' ? '温暖黄' : '清新灰';
    }

    // 地区选择逻辑在 js/region.js

    // 编辑昵称
    function editNickname() {
        const currentNickname = currentUser.nickname || currentUser.username || '';

        const overlay = document.createElement('div');
        overlay.className = 'settings-modal-overlay';
        overlay.innerHTML = `
            <div class="settings-modal-container">
                <div class="settings-modal-header">
                    <h3 class="settings-modal-title">✏️ 修改昵称</h3>
                    <button class="settings-modal-close" onclick="this.closest('.settings-modal-overlay').remove()">×</button>
                </div>
                <div class="settings-modal-body">
                    <input class="settings-modal-input" id="nicknameInput" type="text"
                        maxlength="20" placeholder="输入新昵称" value="${escapeHtml(currentNickname)}">
                    <div class="settings-modal-btn-row" style="margin-top:16px;">
                        <button class="settings-modal-btn settings-modal-btn-cancel" onclick="this.closest('.settings-modal-overlay').remove()">取消</button>
                        <button class="settings-modal-btn settings-modal-btn-primary" onclick="saveNickname(this)">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('nicknameInput').focus(), 100);
    }

    function saveNickname(btn) {
        const overlay = btn.closest('.settings-modal-overlay');
        const input = document.getElementById('nicknameInput');
        const val = input.value.trim();
        if (!val || val === (currentUser.nickname || currentUser.username)) { overlay.remove(); return; }
        updateUserInfo('username', val);
        overlay.remove();
    }

    // 编辑性别
    function editGender() {
        const current = currentUser.gender || '保密';
        const options = ['男', '女', '保密'];

        const overlay = document.createElement('div');
        overlay.className = 'settings-modal-overlay';
        overlay.innerHTML = `
            <div class="settings-modal-container">
                <div class="settings-modal-header">
                    <h3 class="settings-modal-title">⚤ 修改性别</h3>
                    <button class="settings-modal-close" onclick="this.closest('.settings-modal-overlay').remove()">×</button>
                </div>
                <div class="settings-modal-body">
                    ${options.map(g => `
                        <div class="settings-modal-option" data-value="${g}" onclick="selectGender(this)"
                            style="padding:14px 16px;border-radius:10px;cursor:pointer;margin-bottom:8px;transition:all 0.2s;display:flex;align-items:center;gap:10px;
                                ${g === current ? 'background:var(--primary-color,#667eea);color:white;font-weight:600;' : 'background:var(--bg-secondary,#f5f5f5);color:var(--text-primary);'}"
                            onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
                            <span style="font-size:20px;">${g === '男' ? '♂️' : g === '女' ? '♀️' : '❓'}</span>
                            <span>${g}</span>
                            ${g === current ? '<span style="margin-left:auto;">✓</span>' : ''}
                        </div>
                    `).join('')}
                    <div class="settings-modal-btn-row">
                        <button class="settings-modal-btn settings-modal-btn-cancel" onclick="this.closest('.settings-modal-overlay').remove()">取消</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function selectGender(el) {
        const val = el.getAttribute('data-value');
        if (val === currentUser.gender) { el.closest('.settings-modal-overlay').remove(); return; }
        updateUserInfo('gender', val);
        el.closest('.settings-modal-overlay').remove();
    }

    // 编辑生日
    function editBirthday() {
        const current = currentUser.birthday || '';
        let [curYear, curMonth, curDay] = current.split('-');
        const now = new Date();
        const thisYear = now.getFullYear();

        const years = [];
        for (let y = thisYear; y >= 1950; y--) years.push(y);
        const months = Array.from({length: 12}, (_, i) => i + 1);
        const days = Array.from({length: 31}, (_, i) => i + 1);

        const overlay = document.createElement('div');
        overlay.className = 'settings-modal-overlay';
        overlay.innerHTML = `
            <div class="settings-modal-container">
                <div class="settings-modal-header">
                    <h3 class="settings-modal-title">🎂 修改生日</h3>
                    <button class="settings-modal-close" onclick="this.closest('.settings-modal-overlay').remove()">×</button>
                </div>
                <div class="settings-modal-body">
                    <div style="display:flex;gap:8px;margin-bottom:16px;">
                        <select id="birthYear" style="flex:1;padding:12px 10px;border:2px solid var(--border-color,#e8ecff);border-radius:10px;font-size:15px;outline:none;background:var(--card-bg,#fff);">
                            <option value="">年</option>
                            ${years.map(y => `<option value="${y}"${y === parseInt(curYear) ? ' selected' : ''}>${y}</option>`).join('')}
                        </select>
                        <select id="birthMonth" style="flex:1;padding:12px 10px;border:2px solid var(--border-color,#e8ecff);border-radius:10px;font-size:15px;outline:none;background:var(--card-bg,#fff);">
                            <option value="">月</option>
                            ${months.map(m => `<option value="${String(m).padStart(2,'0')}"${String(m).padStart(2,'0') === curMonth ? ' selected' : ''}>${m}月</option>`).join('')}
                        </select>
                        <select id="birthDay" style="flex:1;padding:12px 10px;border:2px solid var(--border-color,#e8ecff);border-radius:10px;font-size:15px;outline:none;background:var(--card-bg,#fff);">
                            <option value="">日</option>
                            ${days.map(d => `<option value="${String(d).padStart(2,'0')}"${String(d).padStart(2,'0') === curDay ? ' selected' : ''}>${d}日</option>`).join('')}
                        </select>
                    </div>
                    <div class="settings-modal-btn-row">
                        <button class="settings-modal-btn settings-modal-btn-cancel" onclick="this.closest('.settings-modal-overlay').remove()">取消</button>
                        <button class="settings-modal-btn settings-modal-btn-primary" onclick="saveBirthday(this)">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function saveBirthday(btn) {
        const overlay = btn.closest('.settings-modal-overlay');
        const year = document.getElementById('birthYear').value;
        const month = document.getElementById('birthMonth').value;
        const day = document.getElementById('birthDay').value;
        if (!year || !month || !day) return;
        const val = `${year}-${month}-${day}`;
        if (val === currentUser.birthday) { overlay.remove(); return; }
        updateUserInfo('birthday', val);
        overlay.remove();
    }

    // 打开关于应用
    function openAboutApp() {
        document.getElementById('aboutAppOverlay').style.display = 'flex';
    }

    function closeAboutApp() {
        document.getElementById('aboutAppOverlay').style.display = 'none';
    }

    // 打开隐私政策
    function openPrivacyPolicy() {
        document.getElementById('privacyPolicyOverlay').style.display = 'flex';
    }

    function closePrivacyPolicy() {
        document.getElementById('privacyPolicyOverlay').style.display = 'none';
    }

    // 编辑个人简介
    function editBio() {
        const currentBio = currentUser.bio || '';

        const overlay = document.createElement('div');
        overlay.className = 'settings-modal-overlay';

        overlay.innerHTML = `
            <div class="settings-modal-container">
                <div class="settings-modal-header">
                    <h3 class="settings-modal-title">📝 修改个人简介</h3>
                    <button class="settings-modal-close" onclick="this.closest('.settings-modal-overlay').remove()">×</button>
                </div>
                <div class="settings-modal-body">
                    <textarea class="settings-modal-textarea" id="bioInput"
                        maxlength="100" placeholder="介绍一下自己吧..."
                        oninput="updateBioCount(this)">${escapeHtml(currentBio)}</textarea>
                    <div class="settings-modal-count">
                        <span id="bioCount">${currentBio.length}</span>/100
                    </div>
                    <div class="settings-modal-btn-row">
                        <button class="settings-modal-btn settings-modal-btn-cancel" onclick="this.closest('.settings-modal-overlay').remove()">取消</button>
                        <button class="settings-modal-btn settings-modal-btn-primary" onclick="saveBio(this)">保存</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            document.getElementById('bioInput').focus();
        }, 100);
    }


    // 更新字数统计
    function updateBioCount(textarea) {
        const count = textarea.value.length;
        document.getElementById('bioCount').textContent = count;
    
        // 超过90字时变色提醒
        const countSpan = document.getElementById('bioCount');
        if (count > 90) {
    countSpan.style.color = '#ff6b6b';
        } else {
    countSpan.style.color = '#999';
        }
    }

    function saveBio(btn) {
        const overlay = btn.closest('.settings-modal-overlay');
        const textarea = document.getElementById('bioInput');
        const newBio = textarea.value.trim();

        if (newBio === currentUser.bio) {
            overlay.remove();
            return;
        }

        updateUserInfo('bio', newBio);
        overlay.remove();
    }
        

    // 更新用户信息
    /**
     * 更新用户信息字段
     * @param {string} field - 字段名
     * * @param value - 新值
     */
function updateUserInfo(field, value) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
    }
        
    socket.send(JSON.stringify({
        type: "updateUserInfo",
        field: field,
        value: value
    }));
    
    // ⭐ 如果是VIP状态更新，刷新自定义按钮状态
    if (field === 'isVip') {
        setTimeout(updateCustomTimeButtonState, 500);
    }
        
    console.log(`⚙️ 更新${field}: ${value}`);
}      
    // 退出登录
    /**
     * 退出登录
     * 清除本地 token，断开 WebSocket，刷新页面
     */
    function logout() {
        const overlay = document.createElement('div');
        overlay.className = 'settings-modal-overlay';
        overlay.innerHTML = `
            <div class="settings-modal-container" style="max-width:360px;">
                <div class="settings-modal-header">
                    <h3 class="settings-modal-title">🚪 退出登录</h3>
                    <button class="settings-modal-close" onclick="this.closest('.settings-modal-overlay').remove()">×</button>
                </div>
                <div class="settings-modal-body" style="text-align:center;">
                    <div style="font-size:48px;margin-bottom:12px;">👋</div>
                    <div style="font-size:16px;font-weight:600;color:var(--text-primary);margin-bottom:6px;">确定要退出吗？</div>
                    <div style="font-size:13px;color:var(--text-tertiary);margin-bottom:20px;">退出后需要重新登录</div>
                    <div class="settings-modal-btn-row">
                        <button class="settings-modal-btn settings-modal-btn-cancel" onclick="this.closest('.settings-modal-overlay').remove()">取消</button>
                        <button class="settings-modal-btn settings-modal-btn-primary" onclick="confirmLogout()" style="background:linear-gradient(135deg,#ef4444,#dc2626);">退出</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function confirmLogout() {
        localStorage.setItem('autoLogin', '0');
        if (socket) socket.close();
        currentUser = null;
        location.reload();
    }
    
        
    // 主题选择系统在 js/theme.js
    // 用户中心记录函数在 js/records.js

        

    window.onload = function() {
        console.log("🚀 此刻地图 " + (window.APP_VERSION || 'A1.0.3') + " 已加载");
        
        // ⭐ v9.7.6: 应用保存的主题
        const savedTheme = localStorage.getItem('userTheme') || 'light';
        applyTheme(savedTheme);
            
        // 检查是否 HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && !location.hostname.includes('127.0.0.1')) {
            console.warn('⚠️ 当前不是HTTPS连接，地理位置功能可能受限');
        }
            
        // 先初始化地图
        initMap();
            
        // 初始化事件监听
        initEventListeners();

        document.getElementById('controlPanel').classList.add('collapsed');
        document.getElementById('mapContainer').classList.add('full-width');

            
        // ⭐ 立即连接WebSocket（用于注册和登录）
        connectWebSocket();
            
        // ⭐ 检查是否为自动登录模式
        const autoLogin = localStorage.getItem('autoLogin') === '1';
        const savedLoginId = localStorage.getItem('savedLoginId');
        const savedPassword = localStorage.getItem('savedPassword');
            
        if (autoLogin && savedLoginId && savedPassword) {
            console.log("🤖 检测到自动登录，跳过登录界面");
            // 直接隐藏登录界面（虽然还没显示，但以防万一）
            document.getElementById('authOverlay').style.display = 'none';
            // 不需要调用 showAuthOverlay()
        } else {
            // 不是自动登录，显示登录界面
            showAuthOverlay();
        }
            
        // ⭐ v9.4.3: 初始化记住登录功能
        setTimeout(() => {
            // 初始化勾选框联动
            initCheckboxListeners();
                
            // 加载保存的登录信息
            loadLoginInfo();
                
            // 尝试自动登录（注意：这里还是会调用，但会再次检查 autoLogin）
            tryAutoLogin();
        }, 100);
            
        // 尝试获取GPS位置
        getGPSLocation().then(() => {
            console.log("✅ GPS位置获取完成");
        }).catch((error) => {
            console.error("❌ GPS位置获取失败:", error);
        });
            
        // 添加欢迎消息（登录成功后显示）
        function showWelcomeMessage() {
            setTimeout(() => {
                addChatMessage({
                    from: "系统",
                    avatar: "🤖",
                    text: "欢迎使用此刻地图！你可以在地图上发布气泡、查看附近动态，也可以和其他用户聊天。",
                    time: Date.now(),
                    isSystem: true
                });
            }, 500);
        }
            
        // 在登录成功后调用欢迎消息
        window.showWelcomeMessage = showWelcomeMessage;

        // 定期请求在线用户列表
        setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
                socket.send(JSON.stringify({
                    type: "requestOnlineUsers"
                }));
                console.log("📡 请求在线用户列表");
            }
        }, 5000); // 每5秒请求一次

        setTimeout(() => {
            startAutoRefresh();
        }, 3000);

        // 初始化范围显示
        setTimeout(initRangeDisplay, 1000);
        
        // ⭐ 初始化时间滚轮选择器
        setTimeout(initTimeWheelPickers, 500);
    };

    // ==================== 事件监听初始化 ====================
    function initEventListeners() {
        console.log('✅ 初始化所有事件监听器');
    
        // 窗口大小变化时调整布局
        window.addEventListener('resize', handleResize);
    
    // 位置搜索输入框事件
    const locationSearchInput = document.getElementById('locationSearchInput');
    if (locationSearchInput) {
        console.log('🔍 找到位置搜索输入框');
    
        // ⭐ 修改：输入时使用防抖
        locationSearchInput.addEventListener('input', function(e) {
    // 清除之前的计时器
    if (searchTimer) {
        clearTimeout(searchTimer);
    }
        
    // 显示"输入中..."提示
    const input = e.target.value.trim();
    const suggestionsDiv = document.getElementById('locationSuggestions');
    if (input && suggestionsDiv) {
        suggestionsDiv.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-tertiary); font-style: italic;">输入中...</div>';
    }
        
    // 设置新的计时器，500ms后执行搜索
    searchTimer = setTimeout(() => {
        searchLocation();
    }, 500);
        });
    
        // 回车键搜索（立即执行，不用防抖）
        locationSearchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
            
        // 如果有等待中的防抖，先清除
        if (searchTimer) {
            clearTimeout(searchTimer);
            searchTimer = null;
        }
            
        // 立即执行搜索
        searchLocation();
    }
        });
    }
    
        // ===== 聊天室相关事件监听 =====
        console.log('🔍 初始化聊天室相关事件监听器');
    
        // 聊天室代码输入框
        const chatroomInput = document.getElementById('chatroomCodeInput');
        if (chatroomInput) {
    console.log('🔍 找到聊天室代码输入框');
        
    chatroomInput.addEventListener('change', function() {
        updateChatroomCode();
    });
        
    chatroomInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            updateChatroomCode();
        }
    });
        }
    
        // 聊天输入框
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
    console.log('🔍 找到聊天输入框');
        
    chatInput.addEventListener('focus', function() {
        updateChatInputPlaceholder();
    });
        }
    
        // 初始化聊天输入框提示
        updateChatInputPlaceholder();

    }


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
        let _suppressRefresh = false;
        qq.maps.event.addListener(map, 'zoom_changed', function() {
            if (_suppressRefresh) return;
            if (zoomRefreshTimer) clearTimeout(zoomRefreshTimer);
            zoomRefreshTimer = setTimeout(() => {
                if (typeof refreshClusterLabels === 'function') refreshClusterLabels();
            }, 120);
        });

        let panRefreshTimer = null;
        qq.maps.event.addListener(map, 'bounds_changed', function() {
            if (_suppressRefresh) return;
            if (panRefreshTimer) clearTimeout(panRefreshTimer);
            panRefreshTimer = setTimeout(() => {
                if (typeof refreshClusterLabels === 'function') refreshClusterLabels();
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
                    
                // 如果当前是GPS模式，更新位置
                if (locationMode === 'gps') {
                    updateMyPosition(gpsPosition);
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
        try { window._forcePanTo = true; } catch (e) {}
    
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
        
    // 启用GPS定位
    if (gpsPosition) {
        updateMyPosition(gpsPosition);
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
    }

    // ==================== 更新我的位置（核心函数） ====================
    function updateMyPosition(position) {
        myPosition = position;
        console.log("📍 更新我的位置:", position);

        // 更新标记（内部会按模式决定是画圆圈还是 marker）
        updateMyMarker();

        // 更新地图中心（平滑移动）
        if (map) {
            try {
                if (!window._userInteractingWithMap && !window._forcePanTo) {
                    map.panTo(new qq.maps.LatLng(position.lat, position.lng));
                } else if (window._forcePanTo) {
                    map.panTo(new qq.maps.LatLng(position.lat, position.lng));
                    window._forcePanTo = false;
                }
            } catch (e) { console.warn('panTo 失败', e); }
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
     * - 若状态为「暂时勿扰」(statusId=6) 则隐藏标记，不暴露位置。
     * - 头像为圆形裁剪，支持 emoji 与 Base64 图片。
     */
    async function updateMyMarker() {
        if (!map || !myPosition) return;

        // 暂时勿扰：隐藏位置标记和范围圆圈
            if (userStats && userStats.status === 6) {
            console.log('🔕 暂时勿扰模式：位置标记已隐藏');
            safeRemoveMyRangeCircle(true); // 强制移除
            return;
        }

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
            try { myMarker.setPosition(markerLatLng); } catch (e) { console.warn('更新现有 myMarker 位置失败', e); }
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
            try {
                qq.maps.event.addListener(myMarker, 'dblclick', function() {
                    centerAndZoomToRange();
                });
            } catch (e) {}
            // 首次创建时异步生成头像
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
                strokeWeight: 2,
                clickable: false
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
        // 根据范围返回一个合适的缩放等级（经验映射）
        function getZoomForRange(rangeMeters) {
            if (!rangeMeters || rangeMeters <= 0) return 15;
            if (rangeMeters <= 100) return 18;
            if (rangeMeters <= 250) return 17;
            if (rangeMeters <= 500) return 16;
            if (rangeMeters <= 1000) return 15;
            if (rangeMeters <= 2000) return 14;
            if (rangeMeters <= 5000) return 13;
            return 12;
        }

        // 将视角移到我的位置（或 manualPosition）并按当前局域范围设置缩放
        function centerAndZoomToRange() {
            if (!map || !myPosition) return;
            const centerPos = (locationMode === 'manual' && manualPosition) ? manualPosition : myPosition;
            try {
                window._forcePanTo = true;
            } catch (e) {}
            try {
                map.panTo(new qq.maps.LatLng(centerPos.lat, centerPos.lng));
            } catch (e) {}
            try {
                const z = getZoomForRange(visibleRange || 1000);
                map.setZoom(z);
            } catch (e) {}
        }
        
        

    

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
        try { centerAndZoomToRange(); } catch (e) {}
    }
        
    // 格式化范围显示
    function formatRangeDisplay(meters) {
        if (meters >= 1000) {
            return (meters / 1000).toFixed(1) + '公里';
        } else {
            return meters + '米';
        }
    }
        
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


    // ==================== 显示私聊提示（借鉴提供的代码） ====================
    function showPrivateChatHint(userId, nickname, position) {
        // 简化为直接使用新的悬停功能
        // 这个函数现在由 showUserInfoWindow 替代
        console.log(`📢 提示: 点击用户标记可查看 ${nickname} 的详细信息`);
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
    // WebSocket 连接函数在 js/websocket.js

    // 气泡功能函数在 js/bubbleCore.js
    // 聊天/测试/覆盖函数在 js/chat.js 和 js/init-extras.js
