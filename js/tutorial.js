// 新手教程逻辑（独立文件）

let newUserTutorialState = {
    active: false,
    stepIndex: -1,
    steps: [],
    currentTarget: null,
    _actionListener: null
};

function startNewUserTutorial() {
    // 完全由用户交互触发每一步，移除任何自动打开/切换面板的调用
    newUserTutorialState.steps = [
        {
            title: '开始：打开设置',
            description: '请点击“新手教程”或手动打开设置，按顺序完善个人信息，最后关闭设置返回主界面。',
            target: '#settingsTutorialItem',
            waitForAction: true,
            prepare: function () { /* 不自动打开，用户自行点击 */ }
        },
        {
            title: '设置：头像',
            description: '请点击“头像”并按提示上传或更换头像。完成后返回设置列表继续。',
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
            title: '设置：个人简介',
            description: '请点击“个人简介”填写你的简介，保存后返回设置列表继续。',
            target: '.settings-item[onclick*="editBio"]',
            waitForAction: true,
            prepare: function () { }
        },
        {
            title: '设置：性别',
            description: '请点击“性别”选择或修改你的性别，完成后返回设置列表继续。',
            target: '.settings-item[onclick*="editGender"]',
            waitForAction: true,
            prepare: function () { }
        },
        {
            title: '设置：生日',
            description: '请点击“生日”并设置你的生日信息（可选），完成后返回设置列表继续。',
            target: '.settings-item[onclick*="editBirthday"]',
            waitForAction: true,
            prepare: function () { }
        },
        {
            title: '设置：地区',
            description: '请点击“地区”设置你的所在地区，完成后返回设置列表继续。',
            target: '.settings-item[onclick*="editRegion"]',
            waitForAction: true,
            prepare: function () { }
        },
        {
            title: '设置：界面风格',
            description: '请点击“界面风格”选择你喜欢的主题，完成后返回设置列表继续。',
            target: '#settingsThemeItem',
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
        {
            title: '主界面：发布按钮',
            description: '现在你已回到主界面，点击发布按钮开始一次发布流程（尝试发布一条测试内容）。',
            target: '#publishButton',
            waitForAction: true,
            prepare: function () { }
        }
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
        // 如果当前步骤需要用户实际操作，设置监听器并禁止下一步按钮
        setupActionListenerForStep(step, targetEl);
    }, 80);
}

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

    if (!selector) return;

    const target = document.querySelector(selector);
    if (!target) return;

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
    // 清理上一步的监听
    removeCurrentActionListener();

    const nextBtn = document.getElementById('newUserTutorialNextBtn');
    if (!step || !step.waitForAction) {
        if (nextBtn) nextBtn.disabled = false;
        return;
    }

    if (!targetEl) {
        // 如果目标不存在，允许用户手动点击下一步
        if (nextBtn) nextBtn.disabled = false;
        return;
    }

    // 禁用下一步按钮，直到用户在目标上执行操作
    if (nextBtn) nextBtn.disabled = true;

    const handler = function (ev) {
        // 用户在目标上点击，移除监听并进入下一步
        removeCurrentActionListener();
        // 给界面一点时间处理（如打开面板）
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
