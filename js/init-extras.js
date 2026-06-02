    // ==================== 在JavaScript中添加以下函数 ====================

// 面板状态管理
let activeBottomButton = null;
let publishWizardStep = 0;

    // 切换气泡列表面板（控制右侧面板）

    // ==================== 只修复气泡列表按钮逻辑 ====================

    // 切换气泡列表面板（控制右侧面板）
    function toggleBubbleListPanel() {
        const panel = document.getElementById('controlPanel');
        const mapContainer = document.getElementById('mapContainer');
        const bubbleBtn = document.querySelector('.bottom-btn:nth-child(1)');
        const chatBtn = document.querySelector('.bottom-btn:nth-child(2)');
    
        panelCollapsed = !panelCollapsed;
    
        if (panelCollapsed) {
    // 面板收起时
    panel.classList.add('collapsed');
    mapContainer.classList.add('full-width');
    bubbleBtn.classList.remove('active'); // 面板收起时，按钮不应该高亮
    activeBottomButton = null;
        } else {
    // 面板展开时
    panel.classList.remove('collapsed');
    mapContainer.classList.remove('full-width');
    bubbleBtn.classList.add('active'); // 面板展开时，按钮应该高亮
    chatBtn.classList.remove('active'); // 确保聊天按钮不高亮
    activeBottomButton = 'bubbleList';
        }
    
        // 关闭其他面板但保持按钮状态
        // 不要在这里调用 closeChatPanel()，因为那会影响聊天按钮
        // 直接关闭聊天面板但不影响按钮
        const chatPanel = document.getElementById('chatPanel');
        if (chatPanel) {
            chatPanel.classList.remove('show');
        }
    
        // 隐藏发布面板但不影响按钮
        const publishPanel = document.getElementById('publishPanel');
        if (publishPanel) {
            publishPanel.classList.remove('show');
        }
    
        console.log("气泡列表面板:", panelCollapsed ? "收起" : "展开", "气泡按钮高亮:", !panelCollapsed);
    }


    // 切换聊天面板（控制底部聊天面板）



    // 隐藏发布气泡面板

    // 发布面板逻辑在 js/publish.js

// ⭐ 圆形类型选择（合并两个函数）
    function selectBubbleTypeCircle(type) {
        selectBubbleType(type);
    }

    // ⭐ time-chip选择（合并）
    function selectDurationChip(minutes) {
        selectDuration(minutes);
    
        document.getElementById('customMinutes').textContent = '00';
        
        console.log('⏱️ 选择时间:', minutes, '分钟');
    }

    // ⭐ ceshi风格自定义时间选择器
    function toggleCustomTimePicker() {
        const days = prompt('请输入天数 (0-7):', '0');
        const hours = prompt('请输入小时 (0-23):', '0');
        const minutes = prompt('请输入分钟 (0-59):', '0');
        
        if (days !== null && hours !== null && minutes !== null) {
            const d = parseInt(days) || 0;
            const h = parseInt(hours) || 0;
            const m = parseInt(minutes) || 0;
            
            const totalMinutes = d * 24 * 60 + h * 60 + m;
            const maxMinutes = 7 * 24 * 60;
            
            if (totalMinutes > 0 && totalMinutes <= maxMinutes) {
                selectedDuration = totalMinutes;
                
                document.getElementById('customDays').textContent = d;
                document.getElementById('customHours').textContent = String(h).padStart(2, '0');
                document.getElementById('customMinutes').textContent = String(m).padStart(2, '0');
                
                document.querySelectorAll('.time-chip').forEach(chip => {
                    chip.classList.remove('active');
                });
                
                console.log(`⏱️ 自定义时间: ${d}日 ${h}时 ${m}分 (${totalMinutes}分钟)`);
            } else {
            }
        }
    }

    
    // 从发布面板发布气泡
    function publishBubbleFromPanel() {
        const title = document.getElementById('bubbleTitlePanel').value.trim();
        const content = document.getElementById('bubbleContentPanel').value.trim();

        if (!title) {
            return;
        }

        if (!currentUser) {
            return;
        }

        // 使用当前选择的位置
        const publishPosition = myPosition;

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "publishBubble",
                bubbleType: selectedBubbleTypePanel,
                roomCode: selectedBubbleTypePanel === 'group' ? generateChatroomCode() : null,
                title: title,
                content: content,
                lat: publishPosition.lat,
                lng: publishPosition.lng,
                durationMinutes: selectedDuration,
                activityTags: [],
                images: [] // 暂时不支持图片
            }));
            
            console.log("📤 从面板发布气泡:", {title, type: selectedBubbleTypePanel, duration: selectedDuration + '分钟'});
        }

        // 清空表单并关闭面板
        document.getElementById('bubbleTitlePanel').value = '';
        document.getElementById('bubbleContentPanel').value = '';
        hidePublishPanel(); // 这行已经存在，应该保持
    }
    
    // 更新发布面板的位置显示
    function updatePublishPanelLocationDisplay() {
        const element = document.getElementById('publishLocationTextPanel');
        if (element && myPosition) {
    const modeText = locationMode === 'gps' ? 'GPS定位' : '手动选择';
    element.textContent = `📍 ${modeText} (${myPosition.lat.toFixed(4)}, ${myPosition.lng.toFixed(4)})`;
        }
    }

    // 辅助函数：收起控制面板
    function collapseControlPanel() {
        const panel = document.getElementById('controlPanel');
        const mapContainer = document.getElementById('mapContainer');

        panelCollapsed = true;
        panel.classList.add('collapsed');
        mapContainer.classList.add('full-width');
        toggleBtn.textContent = '展开面板';
    
        // 更新底部按钮状态
        const bubbleBtn = document.querySelector('.bottom-btn:nth-child(1)');
        bubbleBtn.classList.remove('active');
    }

    // 辅助函数：关闭聊天面板
    function closeChatPanel() {
        const panel = document.getElementById('chatPanel');
        const chatToggleBtn = document.getElementById('chatToggleBtn');
        const chatBtn = document.querySelector('.bottom-btn:nth-child(2)');
    
        panel.style.display = 'none';
        chatToggleBtn.style.display = 'flex';
        chatBtn.classList.remove('active');
    }

    // 辅助函数：更新其他按钮状态
    function updateOtherButtons(activeButton) {
        const buttons = document.querySelectorAll('.bottom-btn');
        buttons.forEach(btn => {
    if (btn !== activeButton) {
        btn.classList.remove('active');
    }
        });
    }

    // 更新已有的位置更新函数
    function updatePublishLocationDisplay() {
        const element = document.getElementById('publishLocationText');
        if (element && myPosition) {
    const modeText = locationMode === 'gps' ? 'GPS定位' : '手动选择';
    element.textContent = `📍 ${modeText} (${myPosition.lat.toFixed(4)}, ${myPosition.lng.toFixed(4)})`;
        }
    
        // 同时更新发布面板的位置显示
        updatePublishPanelLocationDisplay();
    }

    // 修改现有的发布气泡表单函数

// 修改现有的发布气泡表单函数
function publishBubble() {
    const title = document.getElementById('bubbleTitle').value.trim();
    const content = document.getElementById('bubbleContent').value.trim();

    if (!currentUser) {
        return;
    }

    // 如果标题为空，显示确认卡片
    if (!title) {
        showNoTitleConfirmCard();
        return;
    }

    // 标题不为空，直接发送
    sendBubbleWithTitle(title, content);
}

// 显示无标题确认卡片
function showNoTitleConfirmCard() {
    const card = document.getElementById('noTitleConfirmCard');
    card.style.display = 'flex';
}

// 取消发送
function cancelNoTitleBubble() {
    const card = document.getElementById('noTitleConfirmCard');
    card.style.display = 'none';
}

// 确认发送无标题气泡
function confirmNoTitleBubble() {
    const card = document.getElementById('noTitleConfirmCard');
    card.style.display = 'none';
    
    const content = document.getElementById('bubbleContent').value.trim();
    sendBubbleWithTitle("无标题", content);
}

// 发送气泡（共用函数）
function sendBubbleWithTitle(title, content) {
    // 使用当前选择的位置
    const publishPosition = myPosition;
    
    // 根据当前模式选择时长
    let finalDuration;
    if (isCustomTimeMode) {
        finalDuration = customTimeHours * 60 + customTimeMinutes;
        console.log('📅 使用自定义:', `${customTimeHours}时${customTimeMinutes}分 = ${finalDuration}分钟`);
    } else {
        finalDuration = selectedDuration;
        console.log('⏱️ 使用默认:', finalDuration + '分钟');
    }
    
    if (finalDuration <= 0) {
        return;
    }

    // 生成房间代码
    const roomCode = selectedBubbleType === 'group' ? generateChatroomCode() : null;

    console.log("📤 发布气泡，标题:", title, "类型:", selectedBubbleType);

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: "publishBubble",
            bubbleType: selectedBubbleType,
            roomCode: roomCode,
            title: title,
            content: content,
            lat: publishPosition.lat,
            lng: publishPosition.lng,
            durationMinutes: finalDuration,
            activityTags: []
        }));
        
        console.log("📤 发送气泡(publishBubble):", {title, type: selectedBubbleType, roomCode, duration: finalDuration + '分钟'});
        
        // 显示发布成功通知
        showPublishSuccessNotification(title, selectedBubbleType, finalDuration);
        
        // 清空输入框
        document.getElementById('bubbleTitle').value = '';
        document.getElementById('bubbleContent').value = '';
        
        // 自动关闭发布面板
        hidePublishPanel();
    }
}


// ⭐ 新增：时间选择函数
// ⭐ 新增：时间选择函数
function selectDuration(minutes) {
    console.log('选择时间:', minutes, '分钟'); // 添加调试日志
    
    selectedDuration = minutes;
    
    // 如果处于自定义模式，退出自定义模式
    if (isCustomTimeMode) {
        toggleCustomTime(); // 切换回默认模式
    }

    // 更新duration-btn状态（如果有）
    document.querySelectorAll('.duration-btn').forEach(btn => {
        if (parseInt(btn.dataset.minutes) === minutes) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // 更新time-chip状态
    document.querySelectorAll('.time-chip').forEach(chip => {
        const chipMinutes = parseInt(chip.dataset.minutes);
        if (chipMinutes === minutes) {
            chip.classList.add('active');
            console.log('高亮按钮:', minutes); // 调试日志
        } else {
            chip.classList.remove('active');
        }
    });

    // 清除自定义下拉选择
    const customSelects = document.querySelectorAll('#customDuration, #customDurationPanel');
    customSelects.forEach(select => {
        if (select) select.value = '';
    });

    // 显示选中提示

    console.log(`⏱️ 选择气泡存留时间: ${minutes}分钟`);
}    
    // ⭐ 新增：自定义时间选择函数
    function selectCustomDuration() {
        // 尝试从两个下拉框中获取值
        const customDuration = document.getElementById('customDuration');
        const customDurationPanel = document.getElementById('customDurationPanel');
    
        let minutes = 0;
        if (customDuration && customDuration.value) {
    minutes = parseInt(customDuration.value);
        } else if (customDurationPanel && customDurationPanel.value) {
    minutes = parseInt(customDurationPanel.value);
        }
    
        if (minutes > 0 && minutes <= 300) {
    selectedDuration = minutes;
        
    // 取消所有按钮的选中状态
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.remove('active');
    });
        
    // 同步两个下拉框的值
    if (customDuration) customDuration.value = minutes;
    if (customDurationPanel) customDurationPanel.value = minutes;
        
    console.log(`⏱️ 自定义气泡存留时间: ${minutes}分钟`);
        }
    }


// ⭐ 初始化时间滚轮选择器
let customTimeHours = 0;      // 保留
let customTimeMinutes = 0;    // 保留
let isCustomTimeMode = false; // ✅ 新增状态变量

function initTimeWheelPickers() {
    const dayPicker = document.getElementById('dayPicker');
    const hourPicker = document.getElementById('hourPicker');
    const minutePicker = document.getElementById('minutePicker');
    
    if (!dayPicker || !hourPicker || !minutePicker) return;
    
    // ⭐ v9.6.10: 生成日选择器 - 7个周期 (0-6循环7次)
    const dayCycles = 7;
    for (let cycle = 0; cycle < dayCycles; cycle++) {
        for (let i = 0; i <= 6; i++) {
            dayPicker.innerHTML += `<div class="time-wheel-option" data-value="${i}">${i}</div>`;
        }
    }
    
    // ⭐ v9.6.10: 生成时选择器 - 5个周期 (0-23循环5次)
    const hourCycles = 5;
    for (let cycle = 0; cycle < hourCycles; cycle++) {
        for (let i = 0; i <= 23; i++) {
            hourPicker.innerHTML += `<div class="time-wheel-option" data-value="${i}">${String(i).padStart(2, '0')}</div>`;
        }
    }
    
    // ⭐ v9.6.10: 生成分选择器 - 5个周期 (0-59循环5次)
    const minuteCycles = 5;
    for (let cycle = 0; cycle < minuteCycles; cycle++) {
        for (let i = 0; i <= 59; i++) {
            minutePicker.innerHTML += `<div class="time-wheel-option" data-value="${i}">${String(i).padStart(2, '0')}</div>`;
        }
    }
    
    // 添加padding使第一个和最后一个选项能居中
    dayPicker.innerHTML = '<div style="height:33.33px"></div>' + dayPicker.innerHTML + '<div style="height:33.33px"></div>';
    hourPicker.innerHTML = '<div style="height:33.33px"></div>' + hourPicker.innerHTML + '<div style="height:33.33px"></div>';
    minutePicker.innerHTML = '<div style="height:33.33px"></div>' + minutePicker.innerHTML + '<div style="height:33.33px"></div>';
    
    // ⭐ v9.6.10: 滚动到中间周期的0位置
    const itemHeight = 33.33;
    const dayMiddleCycle = Math.floor(dayCycles / 2); // 第3个周期（索引3）
    const hourMiddleCycle = Math.floor(hourCycles / 2); // 第2个周期（索引2）
    const minuteMiddleCycle = Math.floor(minuteCycles / 2); // 第2个周期（索引2）
    
    dayPicker.scrollTop = (dayMiddleCycle * 7) * itemHeight + 33.33; // 3*7=21，定位到中间周期的0
    hourPicker.scrollTop = (hourMiddleCycle * 24) * itemHeight + 33.33; // 2*24=48
    minutePicker.scrollTop = (minuteMiddleCycle * 60) * itemHeight + 33.33; // 2*60=120
    
    // 初始更新
    updateTimeWheel('day');
    updateTimeWheel('hour');
    updateTimeWheel('minute');
}

function updateTimeWheel(type) {
    let picker;
    
    if (type === 'day') {
        picker = document.getElementById('dayPicker');
    } else if (type === 'hour') {
        picker = document.getElementById('hourPicker');
    } else if (type === 'minute') {
        picker = document.getElementById('minutePicker');
    }
    
    if (!picker) return;
    
    const scrollTop = picker.scrollTop;
    const itemHeight = 33.33;
    const centerIndex = Math.round(scrollTop / itemHeight);
    
    // 更新所有选项的样式
    const options = picker.querySelectorAll('.time-wheel-option');
    options.forEach((option, index) => {
        if (index === centerIndex) {
            option.classList.add('active');
            const value = parseInt(option.dataset.value);
            if (!isNaN(value)) {
                if (type === 'day') customTimeDays = value;
                else if (type === 'hour') customTimeHours = value;
                else if (type === 'minute') customTimeMinutes = value;
            }
        } else {
            option.classList.remove('active');
        }
    });
    
    // ⭐ 检查是否超过7日限制
    const totalMinutes = customTimeDays * 24 * 60 + customTimeHours * 60 + customTimeMinutes;
    const maxMinutes = 7 * 24 * 60; // 7日
    
    if (totalMinutes > maxMinutes) {
        // 超过限制，重置为7日0时0分
        if (type === 'day' && customTimeDays > 7) {
            picker.scrollTop = 7 * itemHeight + 33.33;
            customTimeDays = 7;
        }
        if (customTimeDays === 7 && (customTimeHours > 0 || customTimeMinutes > 0)) {
            // 如果已经是7日，小时和分钟必须为0
            if (type === 'hour') {
                document.getElementById('hourPicker').scrollTop = 33.33;
                customTimeHours = 0;
            }
            if (type === 'minute') {
                document.getElementById('minutePicker').scrollTop = 33.33;
                customTimeMinutes = 0;
            }
        }
    }
    
    // 更新选择的时间（取消快速选择按钮的激活状态）
    if (totalMinutes > 0) {
        selectedDuration = totalMinutes;
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        console.log(`⏱️ 自定义时间: ${customTimeDays}日 ${customTimeHours}时 ${customTimeMinutes}分 (${totalMinutes}分钟)`);
    }
}


// 气泡筛选功能在 js/filter.js

    // ── 头像图标缓存 ──────────────────────────────────────────────
    const avatarIconCache = {};

    /**
     * 将用户头像渲染为圆形 PNG DataURL（用于地图标记）。
     * 支持 emoji 文字头像与 Base64 图片头像。
     * @param {string} avatar   - 头像字符串（emoji 或 data:image/… base64）
     * @param {number} size     - 画布尺寸（px）
     * @param {string} border   - 外圈颜色（CSS 颜色）
     * @param {boolean} dot     - 是否显示右上角绿色在线小圆点
     * @returns {Promise<string>} PNG DataURL
     */
    function generateAvatarIconUrl(avatar, size, border, dot) {
        const key = `${avatar}_${size}_${border}_${dot}`;
        if (avatarIconCache[key]) return Promise.resolve(avatarIconCache[key]);

        return new Promise(resolve => {
            const canvas = document.createElement('canvas');
            canvas.width  = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const c = size / 2, r = c - 3;

            function finish() {
                // 在线小圆点
                if (dot) {
                    ctx.beginPath();
                    ctx.arc(size - 7, 7, 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#00E676';
                    ctx.fill();
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
                const url = canvas.toDataURL('image/png');
                avatarIconCache[key] = url;
                resolve(url);
            }

            // 外圈
            ctx.beginPath();
            ctx.arc(c, c, r + 2, 0, Math.PI * 2);
            ctx.fillStyle = border || '#FFAA00';
            ctx.fill();

            const isImg = avatar && avatar.startsWith('data:image');
            if (isImg) {
                const img = new Image();
                img.onload = () => {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(c, c, r, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, c - r, c - r, r * 2, r * 2);
                    ctx.restore();
                    finish();
                };
                img.onerror = () => {
                    // 加载失败降级为 emoji
                    ctx.beginPath();
                    ctx.arc(c, c, r, 0, Math.PI * 2);
                    ctx.fillStyle = 'white';
                    ctx.fill();
                    ctx.font = `${r * 1.2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('👤', c, c + 1);
                    finish();
                };
                img.src = avatar;
            } else {
                ctx.beginPath();
                ctx.arc(c, c, r, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.font = `${r * 1.2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(avatar || '👤', c, c + 1);
                finish();
            }
        });
    }

    // ==================== 页面加载时初始化 ====================

