// ==================== 登录注册相关函数 ====================
        
    // 切换登录/注册模式
    function switchAuthMode(mode) {
        const loginTab = document.querySelector('.auth-tab:nth-child(1)');
        const registerTab = document.querySelector('.auth-tab:nth-child(2)');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const statusMessage = document.getElementById('statusMessage');
            
        // 清除状态消息
        statusMessage.className = 'status-message';
            
        if (mode === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    }

    // 显示状态消息
    function showAuthMessage(message, type = 'error') {
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = message;
        statusMessage.className = 'status-message ' + type;
            
        if (type === 'success') {
            setTimeout(() => {
                statusMessage.className = 'status-message';
            }, 3000);
        }
    }

    // 验证手机号格式
    function validatePhone(phone) {
        return /^1\d{10}$/.test(phone);
    }

    // 处理注册
    function handleRegister() {
        const phone = document.getElementById('registerPhone').value.trim();
        const id = document.getElementById('registerId').value.trim();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
            
        // 清除所有错误提示
        document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
            
        // 验证手机号
        if (!phone) {
            showAuthMessage('请输入手机号', 'error');
            return;
        }
        if (!validatePhone(phone)) {
            showAuthMessage('手机号格式错误，需要11位数字', 'error');
            return;
        }
            
        // 验证ID
        if (!id) {
            showAuthMessage('请输入用户ID', 'error');
            return;
        }
        if (id.length < 3 || id.length > 20) {
            showAuthMessage('ID长度应为3-20个字符', 'error');
            return;
        }
            
        // 验证密码
        if (!password) {
            showAuthMessage('请输入密码', 'error');
            return;
        }
        if (password.length < 6) {
            showAuthMessage('密码至少需要6位', 'error');
            return;
        }
        if (password !== passwordConfirm) {
            showAuthMessage('两次密码输入不一致', 'error');
            return;
        }
            
        // 发送注册请求
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'register',
                phone: phone,
                id: id,
                username: username || id,
                password: password
            }));
                
            showAuthMessage('正在注册...', 'success');
        } else {
            showAuthMessage('网络连接失败，请稍后重试', 'error');
        }
    }

    // ==================== ⭐ 登录头像显示功能 ====================
    let loginQueryTimer = null;
        
    // 监听登录ID输入
    function onLoginIdInput() {
        const loginId = document.getElementById('loginId').value.trim();
            
        clearTimeout(loginQueryTimer);
            
        if (loginId.length >= 3) {
            // 延迟500ms查询，避免频繁请求
            loginQueryTimer = setTimeout(() => {
                queryLoginUserInfo(loginId);
            }, 500);
        } else {
            hideLoginAvatar();
        }
    }
        
    // 查询登录用户信息
    function queryLoginUserInfo(loginId) {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
            
        socket.send(JSON.stringify({
            type: "queryUserByIdOrPhone",
            loginId: loginId
        }));
            
        console.log('🔍 查询用户信息:', loginId);
    }
        
    // 显示登录头像
    function showLoginAvatar(user) {
        const container = document.getElementById('loginAvatarContainer');
        const display = document.getElementById('loginAvatarDisplay');
            
        const isBase64 = user.avatar && user.avatar.startsWith('data:image');
        const avatarHTML = isBase64 
            ? `<img src="${user.avatar}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`
            : user.avatar || '👤';
            
        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; padding: 10px; background: #f5f7fa; border-radius: 10px;">
                <div style="font-size: 60px;">${avatarHTML}</div>
                <div style="text-align: left;">
                    <div style="font-size: 16px; font-weight: bold; color: var(--text-primary);">${escapeHtml(user.username)}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary);">ID: ${user.id}</div>
                </div>
            </div>
        `;
        display.style.display = 'block';
        console.log('✅ 显示用户头像:', user.username);
    }
        
    // 隐藏登录头像
    function hideLoginAvatar() {
        const display = document.getElementById('loginAvatarDisplay');
        display.style.display = 'none';
    }

    // 处理登录
    // ==================== ⭐ v9.4.3: 记住登录功能 ====================
        
    // 保存登录信息到localStorage
    function saveLoginInfo(loginId, password) {
        const rememberPassword = document.getElementById('rememberPassword').checked;
        const autoLogin = document.getElementById('autoLogin').checked;
            
        console.log(`💾 保存登录信息: 记住密码=${rememberPassword}, 自动登录=${autoLogin}`);
            
        if (rememberPassword || autoLogin) {
            // 保存用户名
            localStorage.setItem('savedLoginId', loginId);
            // 保存勾选状态
            localStorage.setItem('rememberPassword', rememberPassword ? '1' : '0');
            localStorage.setItem('autoLogin', autoLogin ? '1' : '0');
                
            // 如果勾选了记住密码或自动登录，保存密码（简单Base64编码）
            if (rememberPassword || autoLogin) {
                localStorage.setItem('savedPassword', btoa(password));
            }
                
            console.log('✅ 登录信息已保存');
        } else {
            // 如果都没勾选，清除保存的信息
            clearLoginInfo();
        }
    }
        
    // 清除保存的登录信息
    function clearLoginInfo() {
        localStorage.removeItem('savedLoginId');
        localStorage.removeItem('savedPassword');
        localStorage.removeItem('rememberPassword');
        localStorage.removeItem('autoLogin');
        console.log('🗑️ 已清除登录信息');
    }
        
    // 从localStorage加载登录信息
    function loadLoginInfo() {
        const savedLoginId = localStorage.getItem('savedLoginId');
        const savedPassword = localStorage.getItem('savedPassword');
        const rememberPassword = localStorage.getItem('rememberPassword') === '1';
        const autoLogin = localStorage.getItem('autoLogin') === '1';
            
        console.log(`📋 加载登录信息: 记住密码=${rememberPassword}, 自动登录=${autoLogin}`);
            
        // 填充用户名
        if (savedLoginId) {
            document.getElementById('loginId').value = savedLoginId;
            console.log('✅ 已填充用户名:', savedLoginId);
        }
            
        // 填充密码
        if (rememberPassword && savedPassword) {
            try {
                const password = atob(savedPassword);
                document.getElementById('loginPassword').value = password;
                console.log('✅ 已填充密码');
            } catch (e) {
                console.error('❌ 密码解码失败:', e);
                clearLoginInfo();
            }
        }
            
        // 设置勾选框状态
        document.getElementById('rememberPassword').checked = rememberPassword;
        document.getElementById('autoLogin').checked = autoLogin;
            
        return { savedLoginId, savedPassword, autoLogin };
    }
        
    // 尝试自动登录
    function tryAutoLogin() {
        const loginInfo = loadLoginInfo();
            
        // 如果勾选了自动登录且有保存的登录信息
        if (loginInfo.autoLogin && loginInfo.savedLoginId && loginInfo.savedPassword) {
            console.log('🤖 检测到自动登录，准备自动登录...');
                
            // 等待WebSocket连接建立
            let attempts = 0;
            const maxAttempts = 10;
                
            const checkAndLogin = setInterval(() => {
                attempts++;
                    
                if (socket && socket.readyState === WebSocket.OPEN) {
                    clearInterval(checkAndLogin);
                    console.log('🚀 WebSocket已连接，开始自动登录');
                        
                    // 延迟500ms后自动登录，让用户看到界面
                    setTimeout(() => {
                        handleLogin();
                    }, 500);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkAndLogin);
                    console.log('❌ WebSocket连接超时，取消自动登录');
                }
            }, 500);
        }
    }
        
    // 初始化勾选框联动
    function initCheckboxListeners() {
        // 监听"记住密码"勾选框
        document.getElementById('rememberPassword').addEventListener('change', function() {
            // 如果取消记住密码，也取消自动登录
            if (!this.checked) {
                document.getElementById('autoLogin').checked = false;
                clearLoginInfo();
                console.log('🔓 已取消记住密码和自动登录');
            }
        });
            
        // 监听"自动登录"勾选框
        document.getElementById('autoLogin').addEventListener('change', function() {
            // 如果勾选自动登录，自动勾选记住密码
            if (this.checked) {
                document.getElementById('rememberPassword').checked = true;
                console.log('🔒 勾选自动登录，自动勾选记住密码');
            }
        });
    }

    function handleLogin() {
        const loginId = document.getElementById('loginId').value.trim();
        const password = document.getElementById('loginPassword').value;
            
        // 清除错误提示
        document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
            
        if (!loginId) {
            showAuthMessage('请输入ID或手机号', 'error');
            return;
        }
        if (!password) {
            showAuthMessage('请输入密码', 'error');
            return;
        }
            
        // 发送登录请求
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'authLogin',
                loginId: loginId,
                password: password
            }));
                
            showAuthMessage('正在登录...', 'success');
        } else {
            showAuthMessage('网络连接失败，请稍后重试', 'error');
        }
    }

    // 隐藏登录界面
    function hideAuthOverlay() {
        const authOverlay = document.getElementById('authOverlay');
        authOverlay.style.display = 'none';
    }

    // 显示登录界面
    function showAuthOverlay() {
        const authOverlay = document.getElementById('authOverlay');
        authOverlay.style.display = 'flex';
    }


    // 距离计算已移入 src/utils.js

