// 新手教程逻辑（独立文件）

let newUserTutorialState = {
    active: false,
    stepIndex: -1,
    steps: [],
    currentTarget: null,
    _actionListener: null
};

function startNewUserTutorial() {
    // 步骤：设置（仅头像与昵称） -> 关闭设置 -> 逐个解释底部模块并用箭头指示
    newUserTutorialState.steps = [
        { title: '开始：打开设置', description: '请点击“新手教程”或手动打开设置开始个人信息配置。', target: '#settingsTutorialItem', waitForAction: true },
        { title: '设置：头像', description: '请点击“头像”上传或选择一个表情作为头像，保存后返回设置列表。', target: '.settings-item[onclick*="changeAvatar"]', waitForAction: true },
        { title: '设置：昵称', description: '请点击“昵称”设置你的显示名称，保存后返回设置列表继续。', target: '.settings-item[onclick*="editNickname"]', waitForAction: true },
        { title: '完成设置并返回主界面', description: '请点击左上角返回以关闭设置，返回主界面继续下一部分教程。', target: '.settings-back', waitForAction: true },

        { title: '模块：筛选', description: '筛选按钮用于筛选附近气泡的类型和时间。', target: '#filterButton', waitForAction: false, showArrow: true },
        { title: '模块：发布', description: '发布按钮用于创建新的气泡，分享你的内容与位置。', target: '#publishButton', waitForAction: false, showArrow: true },
        { title: '模块：聊天', description: '聊天按钮打开聊天面板，与他人交流。', target: '#chatButton', waitForAction: false, showArrow: true },
        { title: '模块：范围', description: '范围按钮调整你能看到的附近内容半径。', target: '#rangeButton', waitForAction: false, showArrow: true },
        { title: '模块：个人中心', description: '个人中心汇总你的发布、消息和设置。', target: '#mobileUserButton', waitForAction: false, showArrow: true }
    ];

    newUserTutorialState.active = true;
    newUserTutorialState.stepIndex = -1;
    ensureNewUserTutorialOverlay();
    goToNewUserTutorialStep(0);
}

function ensureNewUserTutorialOverlay() {
    let overlay = document.getElementById('newUserTutorialOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'newUserTutorialOverlay';
    overlay.className = 'new-user-tutorial-overlay';
    overlay.innerHTML = `
        <div class="new-user-tutorial-card" id="newUserTutorialCard">
            <button class="tutorial-toggle" id="newUserTutorialToggleBtn">—</button>
            <div class="new-user-tutorial-badge">新手教程</div>
            <h3 class="new-user-tutorial-title" id="newUserTutorialTitle"></h3>
            <p class="new-user-tutorial-desc" id="newUserTutorialDesc"></p>
            <div class="new-user-tutorial-footer">
                <span class="new-user-tutorial-progress" id="newUserTutorialProgress"></span>
                <div class="new-user-tutorial-actions">
                    <button class="new-user-tutorial-btn ghost" id="newUserTutorialPrevBtn" type="button">上一步</button>
                    <button class="new-user-tutorial-btn ghost" id="newUserTutorialSkipBtn" type="button">跳过</button>
                    <button class="new-user-tutorial-btn primary" id="newUserTutorialNextBtn" type="button">下一步</button>
                </div>
            </div>
        </div>
    `;
    // 创建箭头容器
    const arrow = document.createElement('div');
    arrow.id = 'newUserTutorialArrow';
    arrow.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2 L20 14 H4 Z" fill="rgba(102,126,234,0.95)" />
        </svg>
    `;
    overlay.appendChild(arrow);

    document.body.appendChild(overlay);

    overlay.querySelector('#newUserTutorialPrevBtn').onclick = function () {
        goToNewUserTutorialStep(newUserTutorialState.stepIndex - 1);
    };
    overlay.querySelector('#newUserTutorialNextBtn').onclick = function () {
        goToNewUserTutorialStep(newUserTutorialState.stepIndex + 1);
    };
    overlay.querySelector('#newUserTutorialSkipBtn').onclick = finishNewUserTutorial;
    const toggle = overlay.querySelector('#newUserTutorialToggleBtn');
    const card = overlay.querySelector('#newUserTutorialCard');
    if (toggle && card) {
        toggle.onclick = function () {
            card.classList.toggle('collapsed');
            // 切换符号
            toggle.textContent = card.classList.contains('collapsed') ? '+' : '—';
        };
    }

    return overlay;
}

function showTutorialArrowForTarget(target) {
    const arrow = document.getElementById('newUserTutorialArrow');
    if (!arrow) return;
    if (!target) { arrow.style.display = 'none'; return; }

    const rect = target.getBoundingClientRect();
    // 放在目标上方，指向目标中心
    const left = rect.left + rect.width / 2 - 24; // 24 = half arrow width
    let top = rect.top - 54; // place 54px above target
    // 如果顶部空间不足，则放在目标下方
    if (top < 8) top = rect.bottom + 8;

    arrow.style.left = `${Math.max(8, left)}px`;
    arrow.style.top = `${top}px`;
    arrow.style.display = 'block';
}

function hideTutorialArrow() {
    const arrow = document.getElementById('newUserTutorialArrow');
    if (arrow) arrow.style.display = 'none';
}

function goToNewUserTutorialStep(stepIndex) {
    const steps = newUserTutorialState.steps;
    if (!steps.length) return;

    if (stepIndex < 0) stepIndex = 0;
    if (stepIndex >= steps.length) {
        finishNewUserTutorial();
        return;
    }

    const step = steps[stepIndex];
    if (typeof step.prepare === 'function') step.prepare();

    newUserTutorialState.stepIndex = stepIndex;
    const overlay = ensureNewUserTutorialOverlay();
    overlay.style.display = 'flex';
    overlay.classList.add('show');

    window.setTimeout(() => {
        updateNewUserTutorialStep(step);
        const targetEl = highlightNewUserTutorialTarget(step.target);
        // 根据步骤决定是否显示箭头（主要用于底部模块按钮）
        if (step.showArrow) {
            showTutorialArrowForTarget(targetEl);
        } else {
            hideTutorialArrow();
        }
        // 如果当前步骤需要用户实际操作，设置监听器并禁止下一步按钮
        setupActionListenerForStep(step, targetEl);
    }, 80);
}

function updateNewUserTutorialStep(step) {
    newUserTutorialState.steps = [
        // 设置部分：仅头像与昵称
        {
            title: '开始：打开设置',
            description: '请点击“新手教程”或手动打开设置，开始个人信息配置。',
            target: '#settingsTutorialItem',
            waitForAction: true,
            prepare: function () { }
        },
        {
            title: '设置：头像',
            description: '请点击“头像”上传或选择一个表情作为头像（完成后返回设置列表）。',
            target: '.settings-item[onclick*="changeAvatar"]',
            waitForAction: true,
            prepare: function () { }
        },
        {
            title: '设置：昵称',
            description: '请点击“昵称”设置你的显示名称，保存后返回设置列表继续。',
            target: '.settings-item[onclick*="editNickname"]',
            waitForAction: true,
            prepare: function () { }
        },
        {
            title: '完成设置并返回主界面',
            description: '请点击左上角返回以关闭设置，返回主界面继续下一部分教程。',
            target: '.settings-back',
            waitForAction: true,
            prepare: function () { }
        },
        // 主界面底部模块：逐个解释并用箭头指向
        {
            title: '模块：筛选',
            description: '筛选按钮用于筛选附近气泡的类型和时间。',
            target: '#filterButton',
            waitForAction: false,
            showArrow: true
        },
        {
            title: '模块：发布',
            description: '发布按钮用于创建新的气泡，分享你的内容与位置。',
            target: '#publishButton',
            waitForAction: false,
            showArrow: true
        },
        {
            title: '模块：聊天',
            description: '聊天按钮打开聊天面板，与他人交流。',
            target: '#chatButton',
            waitForAction: false,
            showArrow: true
        },
        {
            title: '模块：范围',
            description: '范围按钮调整你能看到的附近内容半径。',
            target: '#rangeButton',
            waitForAction: false,
            showArrow: true
        },
        {
            title: '模块：个人中心',
            description: '个人中心汇总你的发布、消息和设置。',
            target: '#mobileUserButton',
            waitForAction: false,
            showArrow: true
        }
    ];

    // 更新步骤展示（标题、描述、进度、按钮状态）
    function updateNewUserTutorialStep(step) {
        const total = newUserTutorialState.steps.length;
        const titleEl = document.getElementById('newUserTutorialTitle');
        const descEl = document.getElementById('newUserTutorialDesc');
        const progressEl = document.getElementById('newUserTutorialProgress');
        const prevBtn = document.getElementById('newUserTutorialPrevBtn');
        const nextBtn = document.getElementById('newUserTutorialNextBtn');

        if (titleEl) titleEl.textContent = step.title;
        if (descEl) descEl.textContent = step.description;
        if (progressEl) progressEl.textContent = `步骤 ${newUserTutorialState.stepIndex + 1} / ${total}`;
        if (prevBtn) prevBtn.disabled = newUserTutorialState.stepIndex === 0;
        if (nextBtn) nextBtn.textContent = newUserTutorialState.stepIndex === total - 1 ? '完成' : '下一步';
    }

    function highlightNewUserTutorialTarget(selector) {
        if (newUserTutorialState.currentTarget) {
            newUserTutorialState.currentTarget.classList.remove('new-user-tutorial-target');
            newUserTutorialState.currentTarget = null;
        }

        if (!selector) return null;

        const target = document.querySelector(selector);
        if (!target) return null;

        target.classList.add('new-user-tutorial-target');
        newUserTutorialState.currentTarget = target;

        if (typeof target.scrollIntoView === 'function') {
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        return target;
    }

    function removeCurrentActionListener() {
        if (newUserTutorialState._actionListener && newUserTutorialState._actionListener.el) {
            try {
                newUserTutorialState._actionListener.el.removeEventListener('click', newUserTutorialState._actionListener.fn);
            } catch (e) {}
        }
        newUserTutorialState._actionListener = null;
        const nextBtn = document.getElementById('newUserTutorialNextBtn');
        if (nextBtn) nextBtn.disabled = false;
    }

    function setupActionListenerForStep(step, targetEl) {
        removeCurrentActionListener();
        const nextBtn = document.getElementById('newUserTutorialNextBtn');
        if (!step || !step.waitForAction) {
            if (nextBtn) nextBtn.disabled = false;
            return;
        }
        if (!targetEl) {
            if (nextBtn) nextBtn.disabled = false;
            return;
        }
        if (nextBtn) nextBtn.disabled = true;

        const handler = function (ev) {
            removeCurrentActionListener();
            window.setTimeout(() => {
                goToNewUserTutorialStep(newUserTutorialState.stepIndex + 1);
            }, 250);
        };

        try {
            targetEl.addEventListener('click', handler);
            newUserTutorialState._actionListener = { el: targetEl, fn: handler };
        } catch (e) {
            if (nextBtn) nextBtn.disabled = false;
        }
    }

function finishNewUserTutorial() {
    if (newUserTutorialState.currentTarget) {
        newUserTutorialState.currentTarget.classList.remove('new-user-tutorial-target');
        newUserTutorialState.currentTarget = null;
    }

    // 清理任何残留的监听器
    removeCurrentActionListener();

    const overlay = document.getElementById('newUserTutorialOverlay');
    if (overlay) overlay.classList.remove('show');
    if (overlay) overlay.style.display = 'none';

    newUserTutorialState.active = false;
    newUserTutorialState.stepIndex = -1;
}
