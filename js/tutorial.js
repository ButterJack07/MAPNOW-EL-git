// 新手教程逻辑（独立文件）

let newUserTutorialState = {
    active: false,
    stepIndex: -1,
    steps: [],
    currentTarget: null
};

function startNewUserTutorial() {
    newUserTutorialState.steps = [
        {
            title: '先认识设置页',
            description: '这里可以修改头像、昵称、个人简介、地区和界面风格。以后想重新看教程，也可以从这里进入。',
            target: '#settingsTutorialItem',
            prepare: function () {
                if (typeof openSettings === 'function') openSettings();
            }
        },
        {
            title: '主界面按钮区',
            description: '右下角这组按钮是最常用的入口：筛选、发布、聊天和可见范围。熟悉它们后，日常操作会更快。',
            target: '#floating-buttons',
            prepare: function () {
                if (typeof closeSettings === 'function') closeSettings();
                if (typeof closeUserCenter === 'function') closeUserCenter();
                if (typeof closeRangeModal === 'function') closeRangeModal();
                if (typeof closeAboutApp === 'function') closeAboutApp();
                if (typeof closePrivacyPolicy === 'function') closePrivacyPolicy();
                const publishPanel = document.getElementById('publishPanel');
                if (publishPanel) publishPanel.classList.remove('show', 'closing');
                const chatPanel = document.getElementById('chatPanel');
                if (chatPanel) chatPanel.classList.remove('show', 'closing');
            }
        },
        {
            title: '用户中心',
            description: '点这里可以查看我的发布、点赞、收藏、评论和历史，还能修改头像、状态和资料。',
            target: '#userCenterOverlay .uc-tabs',
            prepare: function () {
                if (typeof closeSettings === 'function') closeSettings();
                if (typeof closeRangeModal === 'function') closeRangeModal();
                if (typeof closeAboutApp === 'function') closeAboutApp();
                if (typeof closePrivacyPolicy === 'function') closePrivacyPolicy();
                const publishPanel = document.getElementById('publishPanel');
                if (publishPanel) publishPanel.classList.remove('show', 'closing');
                const chatPanel = document.getElementById('chatPanel');
                if (chatPanel) chatPanel.classList.remove('show', 'closing');
                if (typeof openUserCenter === 'function') openUserCenter();
            }
        },
        {
            title: '发布气泡',
            description: '这里会带你完成内容、地点和时间的发布流程，适合分享推荐、求助、组队或见闻。',
            target: '#publishPanel .publish-panel-container',
            prepare: function () {
                if (typeof closeUserCenter === 'function') closeUserCenter();
                if (typeof closeSettings === 'function') closeSettings();
                if (typeof closeRangeModal === 'function') closeRangeModal();
                if (typeof closeAboutApp === 'function') closeAboutApp();
                if (typeof closePrivacyPolicy === 'function') closePrivacyPolicy();
                const publishPanel = document.getElementById('publishPanel');
                if (publishPanel && !publishPanel.classList.contains('show')) {
                    if (typeof togglePublishPanel === 'function') togglePublishPanel();
                }
                const chatPanel = document.getElementById('chatPanel');
                if (chatPanel) chatPanel.classList.remove('show', 'closing');
            }
        },
        {
            title: '可见范围',
            description: '范围越小越聚焦，越大能看到更广的附近内容。你可以按使用场景灵活调整。',
            target: '#rangeModal > div',
            prepare: function () {
                if (typeof closeUserCenter === 'function') closeUserCenter();
                if (typeof closeSettings === 'function') closeSettings();
                const publishPanel = document.getElementById('publishPanel');
                if (publishPanel) publishPanel.classList.remove('show', 'closing');
                const chatPanel = document.getElementById('chatPanel');
                if (chatPanel) chatPanel.classList.remove('show', 'closing');
                if (typeof openRangeModal === 'function') openRangeModal();
            }
        },
        {
            title: '消息和通知',
            description: '收件箱和聊天入口会汇总新的互动消息。看到提示数字时，可以优先在这里查看。',
            target: '#userCenterOverlay .uc-icon-btn[title="收件箱"]',
            prepare: function () {
                if (typeof closeSettings === 'function') closeSettings();
                if (typeof closeRangeModal === 'function') closeRangeModal();
                const publishPanel = document.getElementById('publishPanel');
                if (publishPanel) publishPanel.classList.remove('show', 'closing');
                const chatPanel = document.getElementById('chatPanel');
                if (chatPanel) chatPanel.classList.remove('show', 'closing');
                if (typeof openUserCenter === 'function') openUserCenter();
            }
        },
        {
            title: '个性化与帮助',
            description: '你可以在设置里更换主题、查看关于应用和隐私政策。以后如果想再看一遍，随时回到这里。',
            target: '#settingsThemeItem',
            prepare: function () {
                if (typeof closeUserCenter === 'function') closeUserCenter();
                if (typeof closeRangeModal === 'function') closeRangeModal();
                const publishPanel = document.getElementById('publishPanel');
                if (publishPanel) publishPanel.classList.remove('show', 'closing');
                const chatPanel = document.getElementById('chatPanel');
                if (chatPanel) chatPanel.classList.remove('show', 'closing');
                if (typeof openSettings === 'function') openSettings();
            }
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
        <div class="new-user-tutorial-mask"></div>
        <div class="new-user-tutorial-card">
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
        highlightNewUserTutorialTarget(step.target);
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
}

function finishNewUserTutorial() {
    if (newUserTutorialState.currentTarget) {
        newUserTutorialState.currentTarget.classList.remove('new-user-tutorial-target');
        newUserTutorialState.currentTarget = null;
    }

    const overlay = document.getElementById('newUserTutorialOverlay');
    if (overlay) overlay.classList.remove('show');
    if (overlay) overlay.style.display = 'none';

    newUserTutorialState.active = false;
    newUserTutorialState.stepIndex = -1;
}
