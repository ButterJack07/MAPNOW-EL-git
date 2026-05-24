// ⭐ 切换发布面板
    function togglePublishPanel() {
        const publishPanel = document.getElementById('publishPanel');
        const chatPanel = document.getElementById('chatPanel');
        const publishBtn = document.getElementById('publishButton');
        const chatBtn = document.getElementById('chatButton');
        
        const isOpen = publishPanel.classList.contains('show');
        
        if (isOpen) {
            // ⭐ v9.6.10: 关闭发布面板，添加动画
            publishPanel.classList.add('closing');
            setTimeout(() => {
                publishPanel.classList.remove('show', 'closing');
                if (publishBtn) publishBtn.classList.remove('active');
                setBottomNavActive(null);
            }, 300); // 动画时长
        } else {
            // 打开发布面板
            publishPanel.classList.add('show');
            if (publishBtn) publishBtn.classList.add('active');
            setBottomNavActive('publishButton');
            setPublishWizardStep(0);
            
            // ⭐ v9.6.10: 初始化时间选择器滑动
            initTimeSelector();
            
            // 关闭聊天面板（互斥）
            if (chatPanel && chatPanel.classList.contains('show')) {
                chatPanel.classList.add('closing');
                setTimeout(() => {
                    chatPanel.classList.remove('show', 'closing');
                    if (chatBtn) chatBtn.classList.remove('active');
                    chatPanelVisible = false;
                }, 300);
            }
        }
    }

    function setPublishWizardStep(step) {
        const maxStep = 2;
        publishWizardStep = Math.max(0, Math.min(maxStep, step));

        const track = document.getElementById('publishWizardTrack');
        if (track) {
            track.style.transform = `translateX(-${publishWizardStep * 33.3333}%)`;
        }

        const prevBtn = document.getElementById('publishPrevBtn');
        const nextBtn = document.getElementById('publishNextBtn');
        if (prevBtn) prevBtn.disabled = publishWizardStep === 0;
        if (nextBtn) {
            if (publishWizardStep >= maxStep) {
                nextBtn.disabled = true;
                nextBtn.textContent = '已到最后';
            } else {
                nextBtn.disabled = false;
                nextBtn.textContent = '下一步 →';
            }
        }

        const dots = document.querySelectorAll('#publishWizardDots .wizard-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === publishWizardStep);
        });
    }

    function publishWizardNext() {
        setPublishWizardStep(publishWizardStep + 1);
    }

    function publishWizardPrev() {
        setPublishWizardStep(publishWizardStep - 1);
    }

    
    // ⭐ v9.6.10: 初始化时间选择器滑动
    let timeSelectorInitialized = false;
    function initTimeSelector() {
        if (timeSelectorInitialized) return;
        timeSelectorInitialized = true;
        
        const wrapper = document.getElementById('timeSelectorWrapper');
        if (!wrapper) return;
        
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        // 触摸事件
        wrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });
        
        wrapper.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        }, { passive: true });
        
        wrapper.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            const diff = currentX - startX;
            const threshold = 50; // 滑动阈值50px
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    // 右滑 - 返回默认页面
                    wrapper.classList.remove('show-custom');
                } else {
                    // 左滑 - 显示自定义页面
                    wrapper.classList.add('show-custom');
                }
            }
            
            isDragging = false;
        });
        
        // 鼠标事件（PC端支持）
        wrapper.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            isDragging = true;
            e.preventDefault();
        });
        
        wrapper.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            currentX = e.clientX;
        });
        
        wrapper.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            const diff = currentX - startX;
            const threshold = 50;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    wrapper.classList.remove('show-custom');
                } else {
                    wrapper.classList.add('show-custom');
                }
            }
            
            isDragging = false;
        });
        
        wrapper.addEventListener('mouseleave', () => {
            isDragging = false;
        });
    }
    
    function hidePublishPanel() {
        const publishPanel = document.getElementById('publishPanel');
        const publishBtn = document.getElementById('publishButton');
        
        // ⭐ v9.6.10: 添加关闭动画
        publishPanel.classList.add('closing');
        setTimeout(() => {
            publishPanel.classList.remove('show', 'closing');
            if (publishBtn) publishBtn.classList.remove('active');
        }, 300);
    }
    
    function showPublishPanel() {
        const publishPanel = document.getElementById('publishPanel');
        const chatPanel = document.getElementById('chatPanel');
        const publishBtn = document.getElementById('publishButton');
        const chatBtn = document.getElementById('chatButton');
        
        publishPanel.classList.add('show');
        if (publishBtn) publishBtn.classList.add('active');
        
        // ⭐ v9.6.10: 初始化时间选择器滑动
        initTimeSelector();
        
        // 关闭聊天面板（互斥）
        if (chatPanel && chatPanel.classList.contains('show')) {
            chatPanel.classList.add('closing');
            setTimeout(() => {
                chatPanel.classList.remove('show', 'closing');
                if (chatBtn) chatBtn.classList.remove('active');
                chatPanelVisible = false;
            }, 300);
        }
        
        // 展开发布面板
        publishPanel.classList.add('show');
        if (publishBtn) publishBtn.classList.add('active');
    }



// 切换自定义模式

// 切换自定义模式
function toggleCustomTime() {
    // VIP检查
    if (!currentUser || !currentUser.isVip) {
        showVipRequiredNotification();
        return;
    }
    
    const defaultSel = document.getElementById('defaultTimeSelection');
    const customSel = document.getElementById('customTimeSelection');
    
    if (customSel.style.display === 'none') {
        defaultSel.style.display = 'none';
        customSel.style.display = 'block';
        isCustomTimeMode = true;
        
        // 清除默认时间的高亮状态
        document.querySelectorAll('.time-chip').forEach(chip => {
            chip.classList.remove('active');
        });
    } else {
        defaultSel.style.display = 'block';
        customSel.style.display = 'none';
        isCustomTimeMode = false;
        
        // 恢复默认时间的高亮状态（60分钟）
        document.querySelectorAll('.time-chip').forEach(chip => {
            if (parseInt(chip.dataset.minutes) === 60) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }
}
// VIP提示
function showVipRequiredNotification() {
    // 创建一个简约的提示卡片
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--card-bg);
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        z-index: 21000;
        text-align: center;
        min-width: 240px;
        animation: fadeIn 0.2s ease;
    `;
    
    toast.innerHTML = `
        <div style="font-size: 40px; margin-bottom: 12px;">👑</div>
        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">VIP专属功能</div>
        <div style="font-size: 14px; color: var(--text-tertiary); margin-bottom: 20px;">自定义气泡时长需要开通会员</div>
        <button onclick="this.parentElement.remove(); openVipCenter()" 
                style="background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%); 
                       border: none; 
                       border-radius: 24px; 
                       padding: 10px 24px; 
                       color: white; 
                       font-size: 14px; 
                       font-weight: 600; 
                       cursor: pointer;
                       width: 100%;">去开通</button>
        <button onclick="this.parentElement.remove()" 
                style="background: none; 
                       border: none; 
                       color: var(--text-tertiary); 
                       font-size: 13px; 
                       cursor: pointer;
                       margin-top: 12px;">稍后再说</button>
    `;
    
    document.body.appendChild(toast);
    
    // 3秒后自动关闭
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}
// PC端更新
function updateCustomTime() {
    const hours = parseInt(document.getElementById('customHoursInput').value) || 0;
    const minutes = parseInt(document.getElementById('customMinutesInput').value) || 0;
    
    customTimeHours = Math.min(99, Math.max(0, hours));
    customTimeMinutes = Math.min(59, Math.max(0, minutes));
    
    updateCustomTimePreview();
}

// 移动端更新
function updateCustomTimeFromSlider(type) {
    if (type === 'hours') {
        customTimeHours = parseInt(document.getElementById('customHoursSlider').value);
        document.getElementById('hoursValue').textContent = customTimeHours;
    } else {
        customTimeMinutes = parseInt(document.getElementById('customMinutesSlider').value);
        document.getElementById('minutesValue').textContent = customTimeMinutes;
    }
    updateCustomTimePreview();
}

// 更新预览
function updateCustomTimePreview() {
    const total = customTimeHours * 60 + customTimeMinutes;
    const preview = document.getElementById('customTimePreview');
    
    if (total === 0) {
        preview.textContent = '0分钟';
    } else if (total < 60) {
        preview.textContent = total + '分钟';
    } else {
        const h = Math.floor(total / 60);
        const m = total % 60;
        preview.textContent = m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
    }
}

// VIP提示
function showVipRequiredNotification() {
    alert('⭐ VIP专属功能\n\n自定义气泡时长需要VIP会员');
}

