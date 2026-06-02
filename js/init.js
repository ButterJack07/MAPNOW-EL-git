    // ==================== 初始化 ====================
        

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



    // ==================== 页面加载时初始化 ====================

