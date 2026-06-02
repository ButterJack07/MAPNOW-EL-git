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
        