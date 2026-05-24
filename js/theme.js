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
                        <div class="theme-name">✨ 炫彩主题</div>
                        <div class="theme-desc">明亮清新，蓝紫配色</div>
                    </div>
                    <div class="theme-check">${currentTheme === 'light' ? '✓' : ''}</div>
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
 * @param {string} theme - 主题标识符（light 或 dark）
 */
function applyTheme(theme) {
    const html = document.documentElement;
    html.removeAttribute('data-theme');
    if (map && map.setMapStyleId) map.setMapStyleId('style1');
    console.log(`🎨 应用主题: ${theme}`);
}