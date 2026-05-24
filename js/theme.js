// ==================== 主题选择系统 ====================

function editTheme() {
    const modal = document.createElement('div');
    modal.className = 'theme-modal-overlay';
    modal.id = 'themeModalOverlay';

    const currentTheme = currentUser.theme || 'light';

    modal.innerHTML = `
        <div class="theme-modal-container">
            <div class="theme-modal-header">
                <h2 class="theme-modal-title">选择主题</h2>
                <button class="theme-modal-close" onclick="closeThemeModal()">×</button>
            </div>

            <div class="theme-modal-body">
                <div class="theme-option ${currentTheme === 'light' ? 'active' : ''}" onclick="selectTheme('light', event)">
                    <div class="theme-preview theme-preview-light">
                        <div class="theme-preview-header"></div>
                        <div class="theme-preview-content">
                            <div class="theme-preview-card"></div>
                            <div class="theme-preview-card"></div>
                        </div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">清新灰</div>
                        <div class="theme-desc">清爽简约，自然舒适</div>
                    </div>
                    <div class="theme-check">${currentTheme === 'light' ? '✓' : ''}</div>
                </div>

                <div class="theme-option ${currentTheme === 'gradient' ? 'active' : ''}" onclick="selectTheme('gradient', event)">
                    <div class="theme-preview theme-preview-gradient">
                        <div class="theme-preview-header"></div>
                        <div class="theme-preview-content">
                            <div class="theme-preview-card"></div>
                            <div class="theme-preview-card"></div>
                        </div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">深邃紫</div>
                        <div class="theme-desc">深邃优雅，神秘质感</div>
                    </div>
                    <div class="theme-check">${currentTheme === 'gradient' ? '✓' : ''}</div>
                </div>

                <div class="theme-option ${currentTheme === 'ocean' ? 'active' : ''}" onclick="selectTheme('ocean', event)">
                    <div class="theme-preview theme-preview-ocean">
                        <div class="theme-preview-header"></div>
                        <div class="theme-preview-content">
                            <div class="theme-preview-card"></div>
                            <div class="theme-preview-card"></div>
                        </div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">海洋蓝</div>
                        <div class="theme-desc">清新海洋，自由辽阔</div>
                    </div>
                    <div class="theme-check">${currentTheme === 'ocean' ? '✓' : ''}</div>
                </div>

                <div class="theme-option ${currentTheme === 'green' ? 'active' : ''}" onclick="selectTheme('green', event)">
                    <div class="theme-preview theme-preview-green">
                        <div class="theme-preview-header"></div>
                        <div class="theme-preview-content">
                            <div class="theme-preview-card"></div>
                            <div class="theme-preview-card"></div>
                        </div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">青春绿</div>
                        <div class="theme-desc">活力生机，自然清新</div>
                    </div>
                    <div class="theme-check">${currentTheme === 'green' ? '✓' : ''}</div>
                </div>

                <div class="theme-option ${currentTheme === 'yellow' ? 'active' : ''}" onclick="selectTheme('yellow', event)">
                    <div class="theme-preview theme-preview-yellow">
                        <div class="theme-preview-header"></div>
                        <div class="theme-preview-content">
                            <div class="theme-preview-card"></div>
                            <div class="theme-preview-card"></div>
                        </div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">温暖黄</div>
                        <div class="theme-desc">温暖治愈，阳光活力</div>
                    </div>
                    <div class="theme-check">${currentTheme === 'yellow' ? '✓' : ''}</div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeThemeModal() {
    const modal = document.getElementById('themeModalOverlay');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function selectTheme(theme, mouseEvent) {
    updateUserInfo('theme', theme);
    applyTheme(theme);

    localStorage.setItem('userTheme', theme);

    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
    });
    if (mouseEvent?.currentTarget) {
        mouseEvent.currentTarget.classList.add('active');
    }

    document.querySelectorAll('.theme-check').forEach(check => {
        check.textContent = '';
    });
    if (mouseEvent?.currentTarget) {
        const check = mouseEvent.currentTarget.querySelector('.theme-check');
        if (check) check.textContent = '✓';
    }

    setTimeout(() => {
        closeThemeModal();
    }, 500);
}

/**
 * 应用界面主题
 * @param {string} theme - 主题标识符
 */
function applyTheme(theme) {
    const html = document.documentElement;
    const themeNames = {
        light: '清新灰',
        gradient: '深邃紫',
        ocean: '海洋蓝',
        green: '青春绿',
        yellow: '温暖黄'
    };
    if (theme === 'light') {
        html.removeAttribute('data-theme');
    } else {
        html.setAttribute('data-theme', theme);
    }
    const el = document.getElementById('settingsTheme');
    if (el) {
        el.textContent = themeNames[theme] || '清新灰';
    }
    if (map && map.setMapStyleId) map.setMapStyleId('style1');
    if (typeof updateMyRange === 'function') updateMyRange();
    console.log(`🎨 应用主题: ${theme}`);
}