// ==================== ⭐ 设置页面函数 ====================
        
    // 打开设置页面
    /**
     * 打开设置页
     */
    function openSettings() {
        document.getElementById('settingsOverlay').style.display = 'block';
        loadUserSettings();
        // 更新聚合模式显示
        const mode = localStorage.getItem('clusterInteractionMode') || 'A';
        const modeEl = document.getElementById('settingsClusterMode');
        if (modeEl) modeEl.textContent = mode === 'B' ? '花朵展开' : '列表模式';
        // 强制所有设置项挤入一屏
        requestAnimationFrame(compactSettingsLayout);
        console.log('⚙️ 打开设置页面');
    }

    // 关闭设置页面
    function closeSettings() {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay) overlay.style.display = 'none';
        if (typeof setBottomNavActive === 'function') setBottomNavActive(null);
        console.log('⚙️ 关闭设置页面');
    }

    function compactSettingsLayout() {
        const overlay = document.getElementById('settingsOverlay');
        if (!overlay) return;
        const header = overlay.querySelector('.settings-header');
        const list = overlay.querySelector('.settings-list');
        if (!header || !list) return;

        const totalH = window.innerHeight;
        const headerH = header.offsetHeight || 62;
        const available = totalH - headerH - 8; // 8px breathing room

        const items = list.querySelectorAll('.settings-item');
        const dividers = list.querySelectorAll('.settings-section-divider');
        const dividerTotalH = dividers.length * 10; // each divider ~10px
        const itemCount = items.length;
        if (!itemCount) return;

        const perItem = Math.floor((available - dividerTotalH) / itemCount);
        const paddingV = Math.max(4, Math.floor((perItem - 22) / 2)); // min 4px vert padding
        const fontSize = Math.max(11, Math.min(16, Math.floor(perItem * 0.38)));

    }

    // 地区选择逻辑已移入 src/panels/region.js


    // 编辑个人简介（修复版）
    function editBio() {
        const currentBio = currentUser.bio || '';
    
        const modal = document.createElement('div');
        modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20000;
        `;
    
        modal.innerHTML = `
    <div class="bio-modal-content" style="
        background: var(--card-bg);
        border-radius: 20px;
        padding: 25px;
        width: 90%;
        max-width: 400px;
        animation: slideUp 0.3s ease;
    ">
        <h3 style="color: var(--text-primary); margin-bottom: 20px; font-size: 18px;">修改个人简介</h3>
        <textarea id="bioInput" 
                  maxlength="100"
                  placeholder="介绍一下自己吧..." 
                  style="
                      width: 100%;
                      height: 120px;
                      padding: 12px 15px;
                      border: 2px solid var(--border-color);
                      border-radius: 10px;
                      font-size: 14px;
                      margin-bottom: 10px;
                      outline: none;
                      resize: vertical;
                      font-family: inherit;
                  "
                  onfocus="this.style.borderColor='#667eea'"
                  onblur="this.style.borderColor='#e0e0e0'"
                  oninput="updateBioCount(this)">${escapeHtml(currentBio)}</textarea>
        <div style="text-align: right; color: var(--text-tertiary); font-size: 12px; margin-bottom: 20px;">
            <span id="bioCount">${currentBio.length}</span>/100
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="this.closest('.bio-modal-content').parentElement.remove()" 
                    style="
                        flex: 1;
                        padding: 12px;
                        background: var(--bg-secondary);
                        border: none;
                        border-radius: 10px;
                        color: var(--text-secondary);
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.background='#e0e0e0'"
                    onmouseout="this.style.background='#f0f0f0'">取消</button>
            <button onclick="saveBio(this)" 
                    style="
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                    "
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(102,126,234,0.4)';"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">保存</button>
        </div>
    </div>
        `;
    
        document.body.appendChild(modal);
    
        // 自动聚焦
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

    // 保存个人简介
    function saveBio(btn) {
        const modal = btn.closest('.bio-modal-content').parentElement;
        const textarea = document.getElementById('bioInput');
        const newBio = textarea.value.trim();
    
        if (newBio === currentUser.bio) {
    modal.remove();
    return;
        }
    
        updateUserInfo('bio', newBio);
        modal.remove();
    }
        

    // 编辑背景图
    function editBackground() {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#4facfe', 
            '#43e97b', '#fa709a', '#fee140', '#30cfd0',
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f38181'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        updateUserInfo('background', randomColor);
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
        if (confirm('确定要退出登录吗？所有未保存的数据将丢失。')) {
            // ⭐ 只取消自动登录，保留记住密码
            localStorage.setItem('autoLogin', '0');
                
            // 关闭WebSocket连接
            if (socket) {
                socket.close();
            }
            // 清除用户数据
            currentUser = null;
            // 重新加载页面
            location.reload();
        }
    }
    
        
    // 主题选择系统已移入 src/panels/theme.js
        
    // 切换用户中心标签
    function switchUCTab(tabName) {
        // 更新标签状态
        document.querySelectorAll('.uc-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.uc-tab[data-tab="${tabName}"]`).classList.add('active');
            
        // 显示对应内容
        document.querySelectorAll('.uc-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        const contentElement = document.getElementById('uc-' + tabName);
        contentElement.style.display = 'block';
            
        console.log('📑 切换到标签:', tabName);
            
        // ⭐ 根据标签类型查询数据（先显示加载提示）
        if (tabName === 'published') {
            if (!contentElement.innerHTML.trim()) {
                contentElement.innerHTML = '<div class="uc-empty">暂无发布记录</div>';
            }
            queryUserPublished();
        } else if (tabName === 'likes') {
            if (!contentElement.innerHTML.trim()) {
                contentElement.innerHTML = '<div class="uc-empty">暂无点赞记录</div>';
            }
            queryUserLikes();
        } else if (tabName === 'favorites') {
            if (!contentElement.innerHTML.trim()) {
                contentElement.innerHTML = '<div class="uc-empty">暂无收藏记录</div>';
            }
            queryUserFavorites();
        } else if (tabName === 'comments') {
            if (!contentElement.innerHTML.trim()) {
                contentElement.innerHTML = '<div class="uc-empty">暂无评论记录</div>';
            }
            queryUserComments();
        } else if (tabName === 'history') {
            if (!contentElement.innerHTML.trim()) {
                contentElement.innerHTML = '<div class="uc-empty">暂无历史记录</div>';
            }
            queryUserViews();
        }
        // search标签不自动查询，等待用户输入关键字
    }
        
    // ⭐ 新增：查询用户点赞记录
    function queryUserLikes() {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("⚠️ WebSocket未连接");
            return;
        }
            
        console.log("🔍 查询点赞记录...");
        socket.send(JSON.stringify({
            type: "queryUserLikes"
        }));
    }
        
    // ⭐ 新增：查询用户收藏记录
    function queryUserFavorites() {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("⚠️ WebSocket未连接");
            return;
        }
            
        console.log("🔍 查询收藏记录...");
        socket.send(JSON.stringify({
            type: "queryUserFavorites"
        }));
    }
        
    // ⭐ 新增：查询用户评论记录
    function queryUserComments() {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("⚠️ WebSocket未连接");
            return;
        }
            
        console.log("🔍 查询评论记录...");
        socket.send(JSON.stringify({
            type: "queryUserComments"
        }));
    }
        
    // ⭐ 新增：显示点赞记录列表
    function displayLikesList(likes) {
        const container = document.getElementById('uc-likes');
            
        if (likes.length === 0) {
            container.innerHTML = '<div class="uc-empty">暂无点赞记录</div>';
            return;
        }
            
        let html = '<div class="uc-records-list">';
        likes.forEach(like => {
            const bubbleIcon = BUBBLE_CONFIG[like.type]?.icon || '📍';
            const bubbleColor = BUBBLE_CONFIG[like.type]?.color || '#999';
            const timeStr = formatTimeSimple(like.liked_at);
                
            html += `
                <div class="uc-record-item">
                    <div class="uc-record-icon" style="background: ${bubbleColor};">
                        ${bubbleIcon}
                    </div>
                    <div class="uc-record-content">
                        <div class="uc-record-title">${escapeHtml(like.title)}</div>
                        ${like.content ? `<div class="uc-record-desc">${escapeHtml(like.content).replace(/\n/g, '<br>')}</div>` : ''}
                        <div class="uc-record-meta">
                            <span>${renderAvatarPreview(like.author_avatar || '👤')} ${escapeHtml(like.author)}</span>
                            <span>•</span>
                            <span>点赞于 ${timeStr}</span>
                        </div>
                    </div>
                    <div class="uc-record-actions">
                        ${(function(){
                            const _aid = like.author_id || like.authorId || like.userId;
                            const _me  = currentUser && currentUser.id;
                            if (!_aid || _aid === _me) return '';
                            return `<button onclick="startChatFromBubble('${_aid}')"
                                    class="uc-icon-action-btn uc-btn-chat" title="和气泡发布者私聊">💬</button>`;
                        })()}
                        <button onclick="locateToBubble(${like.lat}, ${like.lng})" 
                                class="uc-icon-action-btn uc-btn-locate" title="定位">📍</button>
                        <button onclick="deleteRecord('likes', '${like.bubble_id}', this)" 
                                class="uc-icon-action-btn uc-btn-delete" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
            
        container.innerHTML = html;
        console.log(`✅ 显示 ${likes.length} 条点赞记录`);
    }
        
    // ⭐ 新增：显示收藏记录列表
    function displayFavoritesList(favorites) {
        const container = document.getElementById('uc-favorites');
            
        if (favorites.length === 0) {
            container.innerHTML = '<div class="uc-empty">暂无收藏记录</div>';
            return;
        }
            
        let html = '<div class="uc-records-list">';
        favorites.forEach(fav => {
            const bubbleIcon = BUBBLE_CONFIG[fav.type]?.icon || '📍';
            const bubbleColor = BUBBLE_CONFIG[fav.type]?.color || '#999';
            const timeStr = formatTimeSimple(fav.favorited_at);
                
            html += `
                <div class="uc-record-item">
                    <div class="uc-record-icon" style="background: ${bubbleColor};">
                        ${bubbleIcon}
                    </div>
                    <div class="uc-record-content">
                        <div class="uc-record-title">${escapeHtml(fav.title)}</div>
                        ${fav.content ? `<div class="uc-record-desc">${escapeHtml(fav.content).replace(/\n/g, '<br>')}</div>` : ''}
                        <div class="uc-record-meta">
                            <span>${renderAvatarPreview(fav.author_avatar || '👤')} ${escapeHtml(fav.author)}</span>
                            <span>•</span>
                            <span>收藏于 ${timeStr}</span>
                        </div>
                    </div>
                    <div class="uc-record-actions">
                        ${(function(){
                            const _aid = fav.author_id || fav.authorId || fav.userId;
                            const _me  = currentUser && currentUser.id;
                            if (!_aid || _aid === _me) return '';
                            return `<button onclick="startChatFromBubble('${_aid}')"
                                    class="uc-icon-action-btn uc-btn-chat" title="和气泡发布者私聊">💬</button>`;
                        })()}
                        <button onclick="locateToBubble(${fav.lat}, ${fav.lng})" 
                                class="uc-icon-action-btn uc-btn-locate" title="定位">📍</button>
                        <button onclick="deleteRecord('favorites', '${fav.bubble_id}', this)" 
                                class="uc-icon-action-btn uc-btn-delete" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
            
        container.innerHTML = html;
        console.log(`✅ 显示 ${favorites.length} 条收藏记录`);
    }
        
    // ⭐ 新增：显示评论记录列表
    function displayCommentsList(comments) {
        const container = document.getElementById('uc-comments');
            
        if (comments.length === 0) {
            container.innerHTML = '<div class="uc-empty">暂无评论记录</div>';
            return;
        }
            
        let html = '<div class="uc-records-list">';
        comments.forEach(comment => {
            const bubbleIcon = BUBBLE_CONFIG[comment.type]?.icon || '📍';
            const bubbleColor = BUBBLE_CONFIG[comment.type]?.color || '#999';
            const timeStr = formatTimeSimple(comment.commented_at);
                
            html += `
                <div class="uc-record-item">
                    <div class="uc-record-icon" style="background: ${bubbleColor};">
                        ${bubbleIcon}
                    </div>
                    <div class="uc-record-content">
                        <div class="uc-record-title">${escapeHtml(comment.title)}</div>
                        <div class="uc-comment-text">
                            ${escapeHtml(comment.comment_text).replace(/\n/g, '<br>')}
                        </div>
                        <div class="uc-record-meta">
                            <span>评论于 ${timeStr}</span>
                            <span>•</span>
                            <span>${renderAvatarPreview(comment.author_avatar || '👤')} ${escapeHtml(comment.author)}</span>
                        </div>
                    </div>
                    <div class="uc-record-actions">
                        ${(function(){
                            const _aid = comment.author_id || comment.authorId || comment.userId;
                            const _me  = currentUser && currentUser.id;
                            if (!_aid || _aid === _me) return '';
                            return `<button onclick="startChatFromBubble('${_aid}')"
                                    class="uc-icon-action-btn uc-btn-chat" title="和气泡发布者私聊">💬</button>`;
                        })()}
                        <button onclick="locateToBubble(${comment.lat}, ${comment.lng})" 
                                class="uc-icon-action-btn uc-btn-locate" title="定位">📍</button>
                        <button onclick="deleteRecord('comments', '${comment.id}', this)" 
                                class="uc-icon-action-btn uc-btn-delete" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
            
        container.innerHTML = html;
        console.log(`✅ 显示 ${comments.length} 条评论记录`);
    }
        
    // ⭐ 新增：定位到气泡
    function locateToBubble(lat, lng) {
        if (!map) return;
            
        // 关闭用户中心
        closeUserCenter();
            
        // 移动地图到气泡位置
        map.panTo(new qq.maps.LatLng(lat, lng));
        map.setZoom(15);
            
        console.log(`📍 定位到气泡: ${lat}, ${lng}`);
    }
        
    // ⭐ 新增：删除记录
    function deleteRecord(section, recordId, btn) {
        if (!confirm('确定要删除这条记录吗？')) return;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }

        // ✅ 乐观 UI：立即淡出移除卡片，不等服务器
        const card = btn
            ? btn.closest('.uc-record-item')
            : (section === 'published' ? document.getElementById('bubble-card-' + recordId) : null);
        if (card) {
            card.style.transition = 'opacity .2s, transform .2s';
            card.style.opacity = '0';
            card.style.transform = 'translateX(20px)';
            setTimeout(() => card.remove(), 220);
        }

        // 发送删除请求给服务器（recordId 强制字符串，匹配 TEXT 主键）
        socket.send(JSON.stringify({
            type: 'deleteRecords',
            section: section,
            recordIds: [String(recordId)]
        }));

        console.log('🗑️ 删除', section, recordId);
    }
        
    // 时间格式工具：已移入 src/utils.js
        
    // 更新用户统计数据
    function updateUserStats() {
        // ⭐ 从服务器查询真实统计数据
        if (socket && socket.readyState === WebSocket.OPEN) {
            console.log('🔍 查询用户统计数据...');
            socket.send(JSON.stringify({
                type: "queryUserStats"
            }));
        }
    }
        
    // 气泡筛选相关已移入 src/panels/filter.js

    // 查询浏览记录
    // ── 气泡编辑功能 ──────────────────────────────────────────────

    /**
     * 打开编辑气泡弹窗，预填当前标题与内容。
     * @param {string} bubbleId  - 气泡 ID
     * @param {string} title     - 当前标题
     * @param {string} content   - 当前内容
     */
    function openEditBubbleModal(bubbleId, title, content) {
        let modal = document.getElementById('editBubbleModal');
        if (!modal) {
            // 首次调用时动态创建弹窗
            modal = document.createElement('div');
            modal.id = 'editBubbleModal';
            modal.style.cssText = `
                position:fixed;inset:0;background:rgba(0,0,0,.55);
                display:flex;align-items:center;justify-content:center;z-index:11000;`;
            modal.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:24px;width:90%;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,.2);">
                    <h3 style="margin:0 0 16px;font-size:17px;">✏️ 编辑气泡</h3>
                    <label style="font-size:13px;color:#555;">标题</label>
                    <input id="editBubbleTitle" type="text" maxlength="50"
                        style="width:100%;box-sizing:border-box;border:1px solid #ddd;
                               border-radius:8px;padding:8px 10px;margin:6px 0 12px;font-size:14px;">
                    <label style="font-size:13px;color:#555;">内容</label>
                    <textarea id="editBubbleContent" rows="4" maxlength="200"
                        style="width:100%;box-sizing:border-box;border:1px solid #ddd;
                               border-radius:8px;padding:8px 10px;font-size:14px;resize:vertical;"></textarea>
                    <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">
                        <button onclick="closeEditBubbleModal()"
                            style="padding:8px 18px;border:1px solid #ddd;border-radius:8px;
                                   background:#f5f5f5;cursor:pointer;font-size:14px;">取消</button>
                        <button onclick="submitEditBubble()"
                            style="padding:8px 18px;border:none;border-radius:8px;
                                   background:linear-gradient(135deg,#667eea,#764ba2);
                                   color:#fff;cursor:pointer;font-size:14px;font-weight:600;">保存</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
        }
        modal.dataset.bubbleId = bubbleId;
        document.getElementById('editBubbleTitle').value   = title;
        document.getElementById('editBubbleContent').value = content;
        modal.style.display = 'flex';
    }

    /** 关闭气泡编辑弹窗 */
    function closeEditBubbleModal() {
        const modal = document.getElementById('editBubbleModal');
        if (modal) modal.style.display = 'none';
    }

    /**
     * 提交气泡编辑。通过 WebSocket 发送 updateBubble 消息，
     * 服务端更新后返回 bubbleUpdated 响应，前端刷新卡片内容。
     */
    function submitEditBubble() {
        const modal    = document.getElementById('editBubbleModal');
        const bubbleId = modal?.dataset.bubbleId;
        const title    = document.getElementById('editBubbleTitle').value.trim();
        const content  = document.getElementById('editBubbleContent').value.trim();

        if (!bubbleId) return;
        if (!title) {
            return;
        }
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }

        socket.send(JSON.stringify({
            type: 'updateBubble',
            bubbleId,
            title,
            content
        }));

        closeEditBubbleModal();
        console.log(`✏️ 提交气泡编辑: ${bubbleId}`);
    }

    function queryUserViews() {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("⚠️ WebSocket未连接");
            return;
        }
            
        console.log("🔍 查询浏览记录...");
        socket.send(JSON.stringify({
            type: "queryUserViews"
        }));
    }
        
    // 显示浏览记录列表
    function displayViewsList(views) {
        const container = document.getElementById('uc-history');
            
        if (!views || views.length === 0) {
            container.innerHTML = '<div class="uc-empty">暂无浏览记录</div>';
            return;
        }
            
        let html = '<div class="uc-records-list">';

        // 去重：同一气泡只保留最新浏览记录
        const viewMap = new Map();
        views.forEach(v => {
            const key = v.bubble_id || v.id || v.title;
            const ex = viewMap.get(key);
            if (!ex || new Date(v.viewed_at) > new Date(ex.viewed_at)) viewMap.set(key, v);
        });
        const deduped = Array.from(viewMap.values()).sort((a,b) => new Date(b.viewed_at)-new Date(a.viewed_at));

        deduped.forEach(view => {
            const bubbleIcon = BUBBLE_CONFIG[view.type]?.icon || '📍';
            const bubbleColor = BUBBLE_CONFIG[view.type]?.color || '#999';
            const timeStr = formatTimeSimple(view.viewed_at);
                
            html += `
                <div class="uc-record-item">
                    <div class="uc-record-icon" style="background: ${bubbleColor};">
                        ${bubbleIcon}
                    </div>
                    <div class="uc-record-content" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <div class="uc-record-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(view.title)}</div>
                            <button onclick="this.closest('.uc-record-item').querySelector('.uc-card-detail').style.display=this.dataset.expanded==='true'?((this.dataset.expanded='false')||'none'):(this.dataset.expanded='true')&&'block';this.style.transform=this.dataset.expanded==='true'?'rotate(180deg)':'rotate(0deg)'"
                                style="flex-shrink:0;background:none;border:none;color:#9a8e85;font-size:14px;cursor:pointer;padding:2px 4px;border-radius:6px;line-height:1;transition:transform .2s;" data-expanded="false">▾</button>
                        </div>
                        <div class="uc-record-meta" style="margin-top:4px;">
                            <span>浏览于 ${timeStr}</span>
                        </div>
                        <div class="uc-card-detail" style="display:none;margin-top:8px;">
                            ${view.content ? `<div class="uc-record-desc" style="margin-bottom:6px;">${escapeHtml(view.content).replace(/\n/g, '<br>')}</div>` : ''}
                            <div class="uc-record-meta">
                                <span>${renderAvatarPreview(view.avatar || '👤')} ${escapeHtml(view.author)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="uc-record-actions">
                        ${(function(){
                            const _aid = view.author_id || view.authorId || view.userId;
                            const _me  = currentUser && currentUser.id;
                            if (!_aid || _aid === _me) return '';
                            return `<button onclick="startChatFromBubble('${_aid}')"
                                    class="uc-icon-action-btn uc-btn-chat" title="和气泡发布者私聊">💬</button>`;
                        })()}
                        <button onclick="locateToBubble(${view.lat}, ${view.lng})" 
                                class="uc-icon-action-btn uc-btn-locate" title="定位">📍</button>
                        <button onclick="deleteRecord('history', '${view.bubble_id}', this)" 
                                class="uc-icon-action-btn uc-btn-delete" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
            
        container.innerHTML = html;
        console.log(`✅ 显示 ${views.length} 条浏览记录`);
    }
        
    // 执行搜索
    function performSearch() {
        const section = document.getElementById('searchSection').value;
        const keyword = document.getElementById('searchKeyword').value.trim();
            
        if (!keyword) {
            return;
        }
            
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }
            
        console.log(`🔍 搜索: ${section} - ${keyword}`);
        socket.send(JSON.stringify({
            type: "searchRecords",
            section: section,
            keyword: keyword
        }));
            
        // 显示加载提示
        document.getElementById('searchResults').innerHTML = '<div class="uc-empty">搜索中...</div>';
    }
        
    // 显示搜索结果
    function displaySearchResults(results, section) {
        const container = document.getElementById('searchResults');
            
        if (results.length === 0) {
            container.innerHTML = '<div class="uc-empty">未找到匹配的记录</div>';
            return;
        }
            
        // 根据不同板块显示不同格式
        let html = '<div class="uc-records-list">';
        results.forEach(item => {
            const bubbleIcon = BUBBLE_CONFIG[item.type]?.icon || '📍';
            const bubbleColor = BUBBLE_CONFIG[item.type]?.color || '#999';
            let timeStr = '';
            let actionText = '';
                
            // 根据板块类型设置时间和操作文字
            if (section === 'likes') {
                timeStr = formatTimeSimple(item.liked_at);
                actionText = '点赞于';
            } else if (section === 'favorites') {
                timeStr = formatTimeSimple(item.favorited_at);
                actionText = '收藏于';
            } else if (section === 'comments') {
                timeStr = formatTimeSimple(item.commented_at);
                actionText = '评论于';
            } else if (section === 'published') {
                timeStr = formatTimeSimple(item.created_at);
                actionText = '发布于';
            } else if (section === 'views') {
                timeStr = formatTimeSimple(item.viewed_at);
                actionText = '浏览于';
            }
                
            html += `
                <div class="uc-record-item">
                    <div class="uc-record-icon" style="background: ${bubbleColor};">
                        ${bubbleIcon}
                    </div>
                    <div class="uc-record-content" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <div class="uc-record-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(item.title)}</div>
                            <button onclick="this.closest('.uc-record-item').querySelector('.uc-card-detail').style.display=this.dataset.expanded==='true'?((this.dataset.expanded='false')||'none'):(this.dataset.expanded='true')&&'block';this.style.transform=this.dataset.expanded==='true'?'rotate(180deg)':'rotate(0deg)'"
                                style="flex-shrink:0;background:none;border:none;color:#9a8e85;font-size:14px;cursor:pointer;padding:2px 4px;border-radius:6px;line-height:1;transition:transform .2s;" data-expanded="false">▾</button>
                        </div>
                        <div class="uc-record-meta" style="margin-top:4px;">
                            <span>${actionText} ${timeStr}</span>
                        </div>
                        <div class="uc-card-detail" style="display:none;margin-top:8px;">
                            ${item.content ? `<div class="uc-record-desc" style="margin-bottom:6px;">${escapeHtml(item.content).replace(/\n/g, '<br>')}</div>` : ''}
                            ${item.comment_text ? `<div class="uc-comment-text" style="margin-bottom:6px;">💬 ${escapeHtml(item.comment_text).replace(/\n/g, '<br>')}</div>` : ''}
                        </div>
                    </div>
                    <div class="uc-record-actions">
                        ${(function(){
                            const _aid = item.author_id || item.authorId || item.userId;
                            const _me  = currentUser && currentUser.id;
                            if (!_aid || _aid === _me) return '';
                            return `<button onclick="startChatFromBubble('${_aid}')"
                                    class="uc-icon-action-btn uc-btn-chat" title="和气泡发布者私聊">💬</button>`;
                        })()}
                        <button onclick="locateToBubble(${item.lat}, ${item.lng})" 
                                class="uc-icon-action-btn uc-btn-locate" title="定位">📍</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
            
        container.innerHTML = html;
        console.log(`✅ 显示 ${results.length} 条搜索结果`);
    }
        
    // 通知与收件箱逻辑已移入 src/panels/inbox.js
        
    // 记录气泡浏览
    function recordBubbleView(bubbleId) {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        if (!bubbleId) return;
            
        socket.send(JSON.stringify({
            type: "recordBubbleView",
            bubbleId: bubbleId
        }));
            
        console.log(`👁️ 记录浏览: ${bubbleId}`);

        // 实时更新「我发布的」卡片浏览数
        const _card = document.getElementById('bubble-card-' + bubbleId);
        if (_card) {
            _card.querySelectorAll('.uc-record-stats span').forEach(sp => {
                if (sp.title === '浏览') {
                    const n = parseInt(sp.textContent.replace(/[^0-9]/g,'')) || 0;
                    sp.textContent = '👁 ' + (n + 1);
                }
            });
        }
    }
        
    // 气泡互动逻辑已移入 src/panels/bubble.js
        
    // ==================== 初始化 ====================
        

    window.onload = function() {
        console.log("🚀 此刻地图 v9.2.1 - 用户认证系统 已加载");
        
        // ⭐ v9.7.6: 应用保存的主题
        const savedTheme = localStorage.getItem('userTheme') || 'light';
        applyTheme(savedTheme);
            
        // 检查是否 HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && !location.hostname.includes('127.0.0.1')) {
            console.warn('⚠️ 当前不是HTTPS连接，地理位置功能可能受限');
        }
            
        console.log("🚀 此刻地图 v9.2.1 - 用户认证系统 已加载");
            
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


    // ==================== 响应式布局处理 ====================
    function handleResize() {
        if (window.innerWidth <= 768) {
            // 手机端：自动调整布局
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
    }

    // ==================== 面板收起/展开功能 ====================
    function togglePanel() {
        const panel = document.getElementById('controlPanel');
        const mapContainer = document.getElementById('mapContainer');

        panelCollapsed = !panelCollapsed;
            
        if (panelCollapsed) {
            panel.classList.add('collapsed');
            mapContainer.classList.add('full-width');
            toggleBtn.textContent = '展开面板';
        } else {
            panel.classList.remove('collapsed');
            mapContainer.classList.remove('full-width');
            toggleBtn.textContent = '收起面板';
        }
    }

    // ==================== 地图初始化 ====================
    // ==================== 地图初始化 ====================
    /**
     * 初始化腾讯地图
     * 创建地图实例、绑定点击事件、定位当前用户
     */
    function initMap() {
        // 默认位置（上海中心）
        const defaultPosition = { lat: 31.2800, lng: 121.5000 };
    
        // ⭐ v9.7.8: 根据当前主题设置地图样式
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        // 创建地图实例
        const mapOptions = {
            center: new qq.maps.LatLng(defaultPosition.lat, defaultPosition.lng),
            zoom: 15,
            disableDefaultUI: true
        };
        
        map = new qq.maps.Map(document.getElementById('map'), mapOptions);

        let zoomRefreshTimer = null;
        let _suppressRefresh = false; // 聚合交互时临时禁止刷新
        qq.maps.event.addListener(map, 'zoom_changed', function() {
            if (_suppressRefresh) return;
            if (zoomRefreshTimer) clearTimeout(zoomRefreshTimer);
            zoomRefreshTimer = setTimeout(() => {
                refreshBubbleMarkersForCurrentZoom();
            }, 120);
        });

        // 平移时重新聚合（bounds 变化 → 像素坐标变化）
        let panRefreshTimer = null;
        qq.maps.event.addListener(map, 'bounds_changed', function() {
            if (_suppressRefresh) return;
            if (panRefreshTimer) clearTimeout(panRefreshTimer);
            panRefreshTimer = setTimeout(() => {
                refreshBubbleMarkersForCurrentZoom();
            }, 200);
        });
    
        console.log(`✅ 地图初始化完成，主题: ${currentTheme || 'light'}`);
    
        // ⭐ 检查腾讯地图 API 是否可用
        if (typeof qq !== 'undefined' && qq.maps) {
    console.log("✅ 腾讯地图 API 可用");
        
    // 检查搜索服务
    if (qq.maps.SearchService) {
        console.log("✅ 腾讯地图搜索服务可用");
    } else {
        console.warn("⚠️ 腾讯地图搜索服务不可用，检查 API 版本");
    }
        } else {
    console.error("❌ 腾讯地图 API 不可用");
        }
    
        // 地图初始化完成后请求附近气泡
        setTimeout(() => {
    requestNearbyBubbles();
        }, 1000);

        qq.maps.event.addListener(map, 'click', function() {
            clearSpiderfy();
        });

        // ⭐ v9.7.5: 完全禁用地图点击选点功能
        // 用户只能通过搜索来选择地点
        qq.maps.event.addListener(map, 'click', function(event) {
            console.log('🚫 地图点击已禁用，请使用搜索功能选择地点');
        });
    }

    function getGPSLocation() {
        return new Promise((resolve, reject) => {
    // 检查浏览器是否支持
    if (!navigator.geolocation) {
        console.log('⚠️ 浏览器不支持Geolocation');
        myPosition = { lat: 39.9042, lng: 116.4074 };
        resolve(myPosition);
        return;
    }

    // 检查是否是安全上下文（HTTPS）
    if (!window.isSecureContext) {
        console.warn('⚠️ 非安全上下文，定位可能被浏览器阻止');
        // 继续尝试，但用户可能看不到权限弹窗
    }

    // 先检查权限状态
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
            console.log('📍 定位权限状态:', permissionStatus.state);
                
            if (permissionStatus.state === 'denied') {
                myPosition = { lat: 39.9042, lng: 116.4074 };
                resolve(myPosition);
                return;
            }
        }).catch(err => {
            console.log('无法查询权限状态:', err);
        });
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 30000,  // 增加超时时间到30秒
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            gpsPosition = { lat: lat, lng: lng };
                
            // 如果当前是GPS模式，更新位置
            if (locationMode === 'gps') {
                updateMyPosition(gpsPosition);
            }
                
            console.log('✅ 获取到GPS定位:', gpsPosition);
            resolve(gpsPosition);
                
            // 开始持续监控GPS位置
            startGPSWatching();
        },
        (error) => {
            console.log('⚠️ 定位失败:', error.message, '错误码:', error.code);
                
            let errorMessage = '定位失败，使用默认位置（北京天安门）';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '请在浏览器设置中允许位置权限，然后刷新页面';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '无法获取位置信息，使用默认位置';
                    break;
                case error.TIMEOUT:
                    errorMessage = '定位超时，使用默认位置';
                    break;
            }
                
            myPosition = { lat: 39.9042, lng: 116.4074 };
            updateMyMarker();
            requestNearbyBubbles();
            resolve(myPosition);
        },
        options
    );
        });
    }


    function startGPSWatching() {
        if (!navigator.geolocation || gpsWatchId) return;
            
        gpsWatchId = navigator.geolocation.watchPosition(
            (position) => {
                gpsPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                    
                // 如果当前是GPS模式，更新位置
                if (locationMode === 'gps') {
                    updateMyPosition(gpsPosition);
                }
                    
                updateLocationStatus("📍 实时定位中");
            },
            (error) => {
                console.error("GPS监控错误:", error);
                updateLocationStatus("❌ 定位失败");
            },
            {
                enableHighAccuracy: true,
                maximumAge: 30000
            }
        );
            
        isLocationEnabled = true;
    }

    function stopGPSWatching() {
        if (gpsWatchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(gpsWatchId);
            gpsWatchId = null;
        }
        isLocationEnabled = false;
    }

    // ==================== 位置模式设置 ====================

    function setLocationMode(mode) {
        locationMode = mode;
    
        // 获取所有相关按钮
        const gpsCircleBtn = document.getElementById('gpsModeBtn');
        const manualCircleBtn = document.getElementById('manualModeBtn');
    
        // 移除所有激活状态
        [gpsCircleBtn, manualCircleBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
        });
    
        if (mode === 'gps') {
    // 激活GPS模式按钮
    if (gpsCircleBtn) gpsCircleBtn.classList.add('active');
        
    // 启用GPS定位
    if (gpsPosition) {
        updateMyPosition(gpsPosition);
    } else {
        getGPSLocation();
    }
        
        } else {
    // 激活手动模式按钮
    if (manualCircleBtn) manualCircleBtn.classList.add('active');
        
    // 停止GPS监控
    stopGPSWatching();
        
    // ⭐ 打开位置选择弹窗
    openLocationModal();
        }
    
        updateLocationDisplay();
    }


    // ==================== 手动位置选择 ====================
    function handleMapClick(event) {
        if (locationMode === 'manual') {
    manualPosition = {
        lat: event.latLng.getLat(),
        lng: event.latLng.getLng()
    };
        
    updateMyPosition(manualPosition);
        
    // ⭐ 如果位置选择弹窗是打开的，更新里面的信息并尝试获取地点名称
    if (document.getElementById('locationModal').style.display === 'flex') {
        updateLocationModalInfo();
            
        // 尝试反向地理编码，获取地点名称
        reverseGeocode(manualPosition);
    }
        
        }
    }

    // 反向地理编码（坐标转地址）- 通过后端
    function reverseGeocode(position) {
        if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
        type: "reverseGeocode",
        lat: position.lat,
        lng: position.lng
    }));
        }
    }

    // ==================== 更新我的位置（核心函数） ====================
    function updateMyPosition(position) {
        myPosition = position;
        console.log("📍 更新我的位置:", position);

        // 更新标记（内部会按模式决定是画圆圈还是 marker）
        updateMyMarker();

        // 更新地图中心（平滑移动）
        if (map) {
            map.panTo(new qq.maps.LatLng(position.lat, position.lng));
        }

        // 更新发布位置显示
        updatePublishLocationDisplay();

        // 刷新所有用户标记（包括自己）
        refreshAllMarkers();

        // 发送位置到服务器
        sendPositionToServer();

        // 查询附近的气泡
        requestNearbyBubbles();
    }
        


    // ==================== 更新我的标记 ====================
    /**
     * 更新地图上自己的位置标记。
     * - 若状态为「暂时勿扰」(statusId=6) 则隐藏标记，不暴露位置。
     * - 头像为圆形裁剪，支持 emoji 与 Base64 图片。
     */
    async function updateMyMarker() {
        if (!map || !myPosition) return;

        // 移除旧标记
        if (myMarker) {
            myMarker.setMap(null);
            myMarker = null;
        }

        // 暂时勿扰：隐藏位置标记和范围圆圈
        if (userStats && userStats.status === 6) {
            console.log('🔕 暂时勿扰模式：位置标记已隐藏');
            if (myRangeCircle) { myRangeCircle.setMap(null); myRangeCircle = null; }
            return;
        }

        // 局域 GPS 模式：圆圈代表位置，不显示人物 marker
        // 搜索（manual）模式 或 全局模式：显示 marker，不显示圆圈
        const isLocalGps = !isGlobalMode && locationMode !== 'manual';
        if (isLocalGps) {
            // 确保圆圈存在，不画 marker
            updateMyRange();
            return;
        }

        // 搜索/全局模式：隐藏圆圈，改画 marker
        if (myRangeCircle) { myRangeCircle.setMap(null); myRangeCircle = null; }

        const avatar  = currentUser?.avatar || '👤';
        const iconUrl = await generateAvatarIconUrl(avatar, 48, '#FFAA00', true);

        // 若在异步等待期间地图/位置已失效，则放弃
        if (!map || !myPosition) return;

        const icon = new qq.maps.MarkerImage(
            iconUrl,
            new qq.maps.Size(48, 48),
            new qq.maps.Point(0, 0),
            new qq.maps.Point(24, 24)
        );

        myMarker = new qq.maps.Marker({
            map: map,
            position: new qq.maps.LatLng(myPosition.lat, myPosition.lng),
            title: currentUser ? currentUser.nickname : '我的位置',
            icon: icon
        });
    }

    // ==================== 更新我的可见范围圆圈 ====================
    function updateMyRange() {
        if (!map || !myPosition) return;
        
        // ⭐ 全局模式下不显示圆圈
        if (isGlobalMode) {
            if (myRangeCircle) {
                myRangeCircle.setMap(null);
                myRangeCircle = null;
            }
            return;
        }
            
        // 移除旧的圆圈
        if (myRangeCircle) {
            myRangeCircle.setMap(null);
        }
            
        // 创建新的可见范围圆圈
        myRangeCircle = new qq.maps.Circle({
            map: map,
            center: new qq.maps.LatLng(myPosition.lat, myPosition.lng),
            radius: visibleRange,
            fillColor: new qq.maps.Color(182, 182, 182, 0.24),
            strokeColor: new qq.maps.Color(150, 150, 150, 0.58),
            strokeWeight: 2
        });
    }
        
    // ==================== ⭐ 局域范围调节功能 ====================
        
        

    

    // 应用范围变化（松开滑块或点击快捷按钮时）
    function applyRangeChange(value) {
        const newRange = parseInt(value);
        setRange(newRange);
    }
        
    // 设置范围（核心函数）
    function setRange(newRange) {
        if (newRange < 100) newRange = 100;
        if (newRange > 10000) newRange = 10000;
            
        const oldRange = visibleRange;
        visibleRange = newRange;
            
        console.log(`🔵 局域范围变更: ${oldRange}米 → ${visibleRange}米`);
            
        // 更新显示
        updateRangePreview(visibleRange);
            
        // 更新范围圆圈
        if (myRangeCircle && myPosition) {
            myRangeCircle.setRadius(visibleRange);
            console.log(`✅ 范围圆圈已更新: ${visibleRange}米`);
        } else {
            updateMyRange();
        }
            
        // ⭐ 重要：范围变化后需要做的事情
            
        // 1. 发送新的位置信息（包含新范围）到服务器
        sendPositionToServer();
            
        // 2. 重新查询附近气泡（使用新范围）
        requestNearbyBubbles();
            
        // 3. 刷新所有用户标记（重新计算可见性）
        refreshAllMarkers();
            
        // 4. 显示提示
            
        console.log(`✅ 范围调整完成，已触发气泡刷新和用户可见性更新`);
    }
        
    // 格式化范围显示
    function formatRangeDisplay(meters) {
        if (meters >= 1000) {
            return (meters / 1000).toFixed(1) + '公里';
        } else {
            return meters + '米';
        }
    }
        
    // ==================== 刷新所有用户标记（新版） ====================
    // ==================== 刷新所有用户标记（新版） ====================
    function refreshAllMarkers() {
        console.log("\n" + "=".repeat(60));
        console.log("🔄 开始刷新所有用户标记");
        console.log("=".repeat(60));
            
        if (!myPosition || !map) {
            console.log("⚠️ 无法刷新：地图或我的位置不存在");
            return;
        }
        
        const myLatLng = new qq.maps.LatLng(myPosition.lat, myPosition.lng);
        
        // 1. 更新我的标记或圆圈位置
        if (myMarker) {
            myMarker.setPosition(myLatLng);
        }
        if (myRangeCircle) {
            myRangeCircle.setCenter(myLatLng);
        }
        
        // ⭐ 关键修复：先检查开关，如果关闭则隐藏所有其他用户
        if (!showOtherUsers) {
            console.log('📴 用户位置显示已关闭，隐藏所有其他用户');
            
            // 隐藏所有其他用户的标记和圆圈
            Object.keys(userMarkers).forEach(userId => {
                if (currentUser && userId !== currentUser.id) {
                    if (userMarkers[userId]) {
                        userMarkers[userId].setMap(null);
                    }
                    if (userRangeCircles[userId]) {
                        userRangeCircles[userId].setMap(null);
                    }
                }
            });
            
            console.log("✅ 已隐藏所有其他用户标记");
            return; // 直接返回，不处理后面的可见性判断
        }
        
        // 3. 获取在线用户列表（开关打开时才继续处理）
        const onlineUserIds = Object.keys(onlineUsers);
        console.log(`👥 在线用户总数: ${onlineUserIds.length}`);
        
        // 统计变量
        let visibleCount = 0;
        let hiddenCount = 0;
        let noPositionCount = 0;
        
        // 4. 处理每个在线用户
        onlineUserIds.forEach(userId => {
            const user = onlineUsers[userId];
            
            // 跳过自己
            if (currentUser && userId === currentUser.id) {
                console.log(`⏭️ 跳过自己: ${userId} (${user.nickname})`);
                return;
            }
            
            // 跳过设置了「暂时勿扰」的用户（他们主动隐藏了位置）
            if (user && user.invisible) {
                if (userMarkers[userId]) {
                    userMarkers[userId].setMap(null);
                }
                if (userRangeCircles[userId]) {
                    userRangeCircles[userId].setMap(null);
                }
                return;
            }

            // 检查用户是否有位置
            if (!user || !user.lat || !user.lng) {
                console.log(`⚠️ 用户 ${userId} (${user?.nickname || '未知'}) 无位置信息`);
                noPositionCount++;
                    
                // 隐藏可能存在的标记和圆圈
                if (userMarkers[userId]) {
                    userMarkers[userId].setMap(null);
                    console.log(`   🗑️ 隐藏用户标记: ${user.nickname} (无位置)`);
                }
                if (userRangeCircles[userId]) {
                    userRangeCircles[userId].setMap(null);
                    console.log(`   🗑️ 隐藏用户范围圆圈: ${user.nickname} (无位置)`);
                }
                return;
            }
                
            // 计算距离
            const distance = calculateDistance(
                myPosition.lat, myPosition.lng,
                user.lat, user.lng
            );
                
            // 获取双方范围
            const myRange = visibleRange;
            const userRange = user.range || 1000;
                
            // 判断可见性
            const iCanSeeThem = distance <= myRange;
            const theyCanSeeMe = distance <= userRange;
            const isVisible = iCanSeeThem && theyCanSeeMe;
                
            console.log(`\n👤 用户: ${user.nickname} (${userId})`);
            console.log(`   位置: (${user.lat.toFixed(6)}, ${user.lng.toFixed(6)})`);
            console.log(`   距离: ${Math.round(distance)}米`);
            console.log(`   我的范围: ${myRange}米 | 对方范围: ${userRange}米`);
            console.log(`   我能看到他: ${iCanSeeThem ? '✅' : '❌'} | 他能看到我: ${theyCanSeeMe ? '✅' : '❌'}`);
            console.log(`   最终可见性: ${isVisible ? '✅ 可见' : '❌ 不可见'}`);
                
            // 根据可见性处理
            if (isVisible) {
                visibleCount++;
                    
                // 可见：显示或更新标记和圆圈
                const theirLatLng = new qq.maps.LatLng(user.lat, user.lng);
                    
                // 创建或更新用户标记
                if (!userMarkers[userId]) {
                    console.log(`   🆕 创建新用户标记: ${user.nickname}`);
                        
                    const icon = new qq.maps.MarkerImage(
                        'data:image/svg+xml;utf8,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                <circle cx="20" cy="20" r="18" fill="#FFAA00" stroke="white" stroke-width="2"/>
                                <text x="20" y="28" text-anchor="middle" fill="white" font-size="18" font-family="Arial">👤</text>
                            </svg>
                        `),
                        new qq.maps.Size(40, 40),
                        new qq.maps.Point(0, 0),
                        new qq.maps.Point(20, 20)
                    );
                        
                    const marker = new qq.maps.Marker({
                        map: map,
                        position: theirLatLng,
                        title: `${user.nickname} (${userId})`,
                        icon: icon
                    });
                        
                    userMarkers[userId] = marker;
                        
                    // ⭐ v9.6.5: 单击事件 - 直接显示用户信息
                    qq.maps.event.addListener(marker, 'click', function() {
                        showUserInfoWindow(user, theirLatLng);
                    });
                        
                } else {
                    // 更新现有标记位置并确保显示
                    userMarkers[userId].setPosition(theirLatLng);
                    userMarkers[userId].setMap(map);
                    console.log(`   🔄 更新用户标记位置: ${user.nickname}`);
                }
                    
                // 创建或更新用户范围圆圈
                if (!userRangeCircles[userId]) {
                    console.log(`   🆕 创建用户范围圆圈: ${user.nickname} (${userRange}米)`);
                        
                    userRangeCircles[userId] = new qq.maps.Circle({
                        map: map,
                        center: theirLatLng,
                        radius: userRange,
                        fillColor: new qq.maps.Color(255, 170, 0, 0.2),
                        strokeColor: new qq.maps.Color(255, 170, 0, 0.5),
                        strokeWeight: 1
                    });
                } else {
                    userRangeCircles[userId].setCenter(theirLatLng);
                    userRangeCircles[userId].setRadius(userRange);
                    userRangeCircles[userId].setMap(map);
                    console.log(`   🔄 更新用户范围圆圈: ${user.nickname} (${userRange}米)`);
                }
                    
            } else {
                hiddenCount++;
                    
                // 不可见：隐藏标记和圆圈
                if (userMarkers[userId]) {
                    userMarkers[userId].setMap(null);
                    console.log(`   🗑️ 隐藏用户标记: ${user.nickname} (距离${Math.round(distance)}米 > 互相可见范围)`);
                }
                if (userRangeCircles[userId]) {
                    userRangeCircles[userId].setMap(null);
                    console.log(`   🗑️ 隐藏用户范围圆圈: ${user.nickname}`);
                }
            }
        });
        
        console.log("\n" + "=".repeat(60));
        console.log("📊 刷新统计:");
        console.log(`   可见用户: ${visibleCount} 人`);
        console.log(`   隐藏用户: ${hiddenCount} 人`);
        console.log(`   无位置用户: ${noPositionCount} 人`);
        console.log("=".repeat(60));
    }

    // ==================== 用户标记悬停功能 ====================
    let currentUserInfoWindow = null;

    function showUserInfoWindow(user, position) {
        // 移除现有的信息窗口
        if (currentUserInfoWindow) {
            currentUserInfoWindow.close();
        }

            
        // 创建药丸形态的信息窗口内容（无背景框）
        const content = `
            <div style="
                background: transparent;
                padding: 8px 12px 8px 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                pointer-events: auto;
            ">
                <!-- 左侧：用户头像圆 -->
                <div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #5483B3 0%, #052659 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    flex-shrink: 0;
                    border: 2px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    ${user.avatar || '👤'}
                </div>
                    
                <!-- 中间：用户信息（药丸背景） -->
                <div style="
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                    background: linear-gradient(135deg, rgba(248, 249, 250, 0.95) 0%, rgba(233, 236, 239, 0.95) 100%);
                    backdrop-filter: blur(10px);
                    border-radius: 50px;
                    padding: 6px 15px 6px 12px;
                    border: 2px solid rgba(84, 131, 179, 0.8);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
                ">
                    <div style="
                        font-weight: 600;
                        color: var(--text-primary);
                        font-size: 11px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        margin-bottom: 1px;
                    ">
                        ${user.nickname}
                    </div>
                    <div style="
                        font-size: 9px;
                        color: #6c757d;
                        font-family: 'Courier New', monospace;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    ">
                        ${user.userId ? 'ID: ' + user.userId.substring(0, 8) + '...' : 'ID: 未知'}
                    </div>
                </div>
            </div>
        `;
            
        // 创建信息窗口（下移更多）
        currentUserInfoWindow = new qq.maps.InfoWindow({
            map: map,
            position: position,
            content: content,
            offset: new qq.maps.Size(0, -80) // 下移更多，在标记下方显示
        });
            
        currentUserInfoWindow.open();
            
        console.log(`👤 显示用户信息: ${user.nickname}`);
            


        currentUserInfoWindow.open();
    
        console.log(`👤 显示用户信息: ${user.nickname}`);
            

            
        // 添加点击地图关闭功能
        qq.maps.event.addListenerOnce(map, 'click', function() {
            hideUserInfoWindow();
        });
            
        // 添加地图拖动关闭功能
        qq.maps.event.addListenerOnce(map, 'dragstart', function() {
            hideUserInfoWindow();
        });

    }

    function hideUserInfoWindow() {
        if (currentUserInfoWindow) {
            currentUserInfoWindow.close();
            currentUserInfoWindow = null;
        }
    }


    // ==================== 定期刷新函数 ====================
    function startAutoRefresh() {
        console.log("🔄 启动自动刷新定时器（每3秒刷新一次）");
            
        // 如果已有定时器，先清除
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
            
        // 创建新的定时器，每3秒刷新一次
        refreshTimer = setInterval(() => {
            console.log("⏰ 定时刷新触发 - " + new Date().toLocaleTimeString());
                
            // 如果清除模式中，不请求气泡
            if (clearBubblesFlag) {
                console.log("⏸️ 清除模式中，跳过气泡请求");
                return;
            }

            // 如果已登录且有地图，就刷新标记
            if (currentUser && map && myPosition) {
                // 1. 先请求在线用户列表
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: "requestOnlineUsers"
                    }));
                }
                    
                // 2. 刷新标记（即使位置不变也刷新）
                refreshAllMarkers();
                    
                // 3. 请求附近气泡 - 关键！
                requestNearbyBubbles();
                    
                // 4. 清理过期气泡
                cleanupExpiredBubbles();
            } else {
                console.log("⏸️ 定时刷新暂停：用户未登录或地图未初始化");
            }
        }, 3000); // 改为3000毫秒 = 3秒
            
        console.log("✅ 自动刷新定时器已启动，间隔3秒");
    }

    // ⭐ 新增：清理过期气泡函数
    function cleanupExpiredBubbles() {
        const now = Date.now();
        let expiredCount = 0;
            
        // 从bubbles数组中移除过期气泡
        bubbles = bubbles.filter(bubble => {
            if (bubble.expiresAt && bubble.expiresAt < now) {
                expiredCount++;
                return false;
            }
            return true;
        });
            
        // 从地图上移除过期气泡标记
        bubbleMarkers.forEach((info, id) => {
            if (info.bubble.expiresAt && info.bubble.expiresAt < now) {
                if (info.label) {
                    info.label.setMap(null);
                }
                bubbleMarkers.delete(id);
                expiredCount++;
            }
        });
            
        if (expiredCount > 0) {
            console.log(`🧹 清理了 ${expiredCount} 个过期气泡`);
            refreshBubbleMarkersForCurrentZoom();
        }
    }
    function stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(refreshTimer);
            refreshTimer = null;
            console.log("🛑 自动刷新定时器已停止");
        }
    }


    // ==================== 显示私聊提示（借鉴提供的代码） ====================
    function showPrivateChatHint(userId, nickname, position) {
        // 简化为直接使用新的悬停功能
        // 这个函数现在由 showUserInfoWindow 替代
        console.log(`📢 提示: 点击用户标记可查看 ${nickname} 的详细信息`);
    }


    // ==================== 位置弹窗功能 ====================


    // ==================== 升级版：位置选择弹窗（支持手动定位+搜索） ====================
    function openLocationModal() {
        const modal = document.getElementById('locationModal');
        modal.style.display = 'flex';
    
        // 清空搜索框和结果
        const searchInput = document.getElementById('locationSearchInput');
        searchInput.value = '';
        document.getElementById('locationSuggestions').innerHTML = '';
    
        // 更新当前位置显示
        updateLocationModalInfo();
    
        // 自动聚焦到搜索框
        setTimeout(() => {
    searchInput.focus();
        }, 300);
    
        // 如果当前是手动模式且有手动位置，将地图中心移动到该位置
        if (locationMode === 'manual' && manualPosition) {
    map.panTo(new qq.maps.LatLng(manualPosition.lat, manualPosition.lng));
        }
    }

    function closeLocationModal() {
        document.getElementById('locationModal').style.display = 'none';
        document.getElementById('locationSearchInput').value = '';
        document.getElementById('locationSuggestions').innerHTML = '';
    }

    function searchLocation() {
        // ⭐ 新增：如果已经有正在执行的搜索，先清除之前的计时器（双重保险）
        if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
        }
    
        const input = document.getElementById('locationSearchInput').value.trim();
        const suggestionsDiv = document.getElementById('locationSuggestions');
    
        console.log('🔍 执行搜索:', input);
    
        if (!input) {
    suggestionsDiv.innerHTML = '';
    return;
        }
    
        // 如果距离上次搜索时间太短，这里可能还有重复调用，可以再加一层保护
        const now = Date.now();
        if (window.lastSearchTime && window.lastSearchKeyword === input && now - window.lastSearchTime < 1000) {
    console.log('⏱️ 搜索太频繁，忽略');
    return;
        }
    
        // 记录本次搜索
        window.lastSearchTime = now;
        window.lastSearchKeyword = input;
    
        // 显示加载中
        suggestionsDiv.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-tertiary);">搜索中...</div>';
    
        // 通过 WebSocket 发送搜索请求到后端
        if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
        type: "searchPlaces",
        keyword: input
    }));
        } else {
    suggestionsDiv.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-tertiary);">网络连接失败</div>';
        }
    }


    // 从搜索结果中选择位置
    function selectLocationFromSearch(place) {
        manualPosition = {
    lat: place.lat,
    lng: place.lng
        };
    
        // ⭐ v9.7.5: 标记为从搜索进入，禁用手动点击
        isFromSearchLocation = true;
    
        // 切换到手动模式（如果还没切换）
        if (locationMode !== 'manual') {
    setLocationMode('manual');
        }
    
        // 更新位置
        updateMyPosition(manualPosition);
    
        // 更新弹窗信息
        updateLocationModalInfo();
    
        // 将地图中心移动到选择的位置
        if (map) {
    map.panTo(new qq.maps.LatLng(place.lat, place.lng));
        }
    
        // 在搜索框中显示选中的地点名称
        document.getElementById('locationSearchInput').value = place.name;
        document.getElementById('locationSuggestions').innerHTML = '';
    
    }


    // 更新位置弹窗中的信息
    function updateLocationModalInfo() {
        const infoDiv = document.getElementById('selectedLocationInfo');
        const pos = locationMode === 'manual' && manualPosition ? manualPosition : myPosition;
    
        if (!pos) return;
    
        infoDiv.innerHTML = `
    <div style="margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 5px;">
            <span style="color: var(--primary-color);">📍</span>
            <strong>当前位置:</strong>
        </div>
        <div style="font-family: monospace; font-size: 14px; padding: 5px; background: var(--bg-secondary); border-radius: 4px;">
            ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}
        </div>
    </div>
        
    <div style="margin: 15px 0; border-top: 1px solid #e0e0e0; padding-top: 15px;">
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 10px;">🔍 搜索地点</div>
            
        <!-- ⭐ v9.7.5: 移除手动定位，只保留搜索功能 -->
        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; font-size: 13px; color: var(--text-secondary);">
            <span style="display: block; margin-bottom: 5px;">💡 在上方搜索框输入地点名称</span>
            <span style="display: block; font-size: 12px; color: var(--text-tertiary);">支持模糊搜索，点击结果即可定位</span>
        </div>
    </div>
        
    <div style="margin-top: 15px; font-size: 12px; color: var(--text-tertiary); border-top: 1px solid #eee; padding-top: 10px;">
        ${locationMode === 'manual' ? '🔍 当前模式: 搜索定位' : '📍 当前模式: GPS定位'}
    </div>
        `;
    }

    // 切换选项卡
    // ⭐ v9.7.5: 已移除手动定位功能，此函数保留以防其他地方调用
    function switchLocationTab(tab) {
        // 不再需要切换标签，因为只保留搜索功能
        console.log('switchLocationTab已弃用，只支持搜索定位');
    }

    // 确认位置选择
    function confirmLocation() {
        if (locationMode === 'manual' && manualPosition) {
    // 已经选择好了，直接关闭
    closeLocationModal();
        } else if (myPosition) {
    // 如果没有手动选择，但已有GPS位置，也允许确认
    closeLocationModal();
        } else {
        }
    }


    function closeLocationModal() {
        document.getElementById('locationModal').style.display = 'none';
        document.getElementById('locationSearchInput').value = '';
        document.getElementById('locationSuggestions').innerHTML = '';
    }


    // ==================== 位置状态更新 ====================
    function updateLocationStatus(text) {
        const element = document.getElementById('locationText');
        if (element) element.textContent = text;
    }

function updatePublishLocationDisplay() {
    const element = document.getElementById('publishLocationText');
    const submitLabel = document.getElementById('publishSubmitLabel');
    
    if (!myPosition) {
        if (element) element.textContent = '定位中...';
        if (submitLabel) submitLabel.textContent = '定位中发布';
        return;
    }
    
    const useSearchPosition = locationMode === 'manual' && !!manualPosition;
    const modeText = useSearchPosition ? '手动选择' : 'GPS定位';
    if (element) element.textContent = modeText;
    if (submitLabel) {
        submitLabel.textContent = useSearchPosition ? '在搜索位置发布' : '发布';
    }
}
    function updateLocationDisplay() {
        updateLocationStatus(locationMode === 'gps' ? ' GPS定位中' : ' 手动选择');
        updatePublishLocationDisplay();
        updateModeTopBanner();
    }

function updateModeTopBanner() {
    const banner = document.getElementById('modeTopBanner');
    const bannerText = document.getElementById('modeTopBannerText');
    if (!banner || !bannerText) return;

    const shortName = (name) => {
        if (!name) return '搜索地点';
        return name.length > 10 ? (name.slice(0, 10) + '...') : name;
    };

    if (isGlobalMode) {
        banner.style.display = 'flex';
        bannerText.textContent = '当前为全局模式';
        return;
    }

    if (locationMode === 'manual' && manualPosition) {
        banner.style.display = 'flex';
        bannerText.textContent = `当前为搜索定位：${shortName(lastManualLocationName)}`;
        return;
    }

        banner.style.display = 'none';
    }

    function backToCurrentLocation() {
        if (isGlobalMode) {
            deactivateGlobalMode();
        }

        lastManualLocationName = '';

    setLocationMode('gps');

        if (gpsPosition) {
            updateMyPosition(gpsPosition);
            if (map) {
                map.panTo(new qq.maps.LatLng(gpsPosition.lat, gpsPosition.lng));
            }
        } else {
            getGPSLocation();
        }

        updateModeTopBanner();
    }

    // ==================== WebSocket 连接 ====================
    /**
     * 建立与服务端的 WebSocket 长连接
     * 连接断开时自动重连；处理身份验证、消息分发
     */
// ==================== WebSocket 连接 ====================
// ==================== WebSocket 连接 ====================
function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("✅ WebSocket 已连接");
        return;
    }

    // 动态构建 WebSocket URL
    // ⭐ 重要：强制使用 ws:// 协议，因为后端不支持 wss://
    const protocol = 'ws:';  // 强制使用 ws://，不使用 wss://
    const hostname = window.location.hostname;
    const SERVER_IP = '121.199.161.5';  // 服务器外网IP
    
    // 修复：在服务器上访问时，使用服务器外网IP
    let host;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
        // 本地开发环境 - 使用服务器外网IP
        host = SERVER_IP;
        console.log("📍 本地环境，连接到外网服务器:", host);
    } else if (hostname === SERVER_IP) {
        // 通过外网IP访问 - 直接使用这个IP
        host = SERVER_IP;
        console.log("📍 通过外网IP访问，使用相同IP连接");
    } else {
        // 其他情况（如域名）- 使用当前hostname
        host = hostname;
        console.log("📍 使用当前hostname连接:", host);
    }
    
    const WS_URL = `${protocol}//${host}:3000`;
    
    console.log("🔌 连接服务器:", WS_URL);
    
    try {
        socket = new WebSocket(WS_URL);
        
        socket.onopen = () => {
            console.log("✅ WebSocket 连接成功");
            updateConnectionStatus("✅ 已连接");
            
            // 只在已登录的情况下发送位置信息
            if (currentUser && currentUser.id) {
                sendLogin();
                sendPositionToServer();
                // 登录成功后请求附近气泡
                setTimeout(() => {
                    requestNearbyBubbles();
                }, 500);
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (error) {
                console.error("❌ 消息解析失败:", error);
            }
        };

        socket.onclose = () => {
            console.log("📡 连接已关闭");
            updateConnectionStatus("❌ 连接断开");
            
            // 3秒后重连
            setTimeout(() => {
                if (currentUser) {
                    console.log("🔄 尝试重新连接...");
                    connectWebSocket();
                }
            }, 3000);
        };

        socket.onerror = (error) => {
            console.error("❌ WebSocket错误:", error);
            updateConnectionStatus("❌ 连接错误");
        };
        
    } catch (error) {
        console.error("❌ 创建WebSocket失败:", error);
    }
}

    function updateConnectionStatus(status) {
        const element = document.getElementById('connectionStatus');
        if (element) element.textContent = status;
    }


    function sendLogin() {
        if (!socket || socket.readyState !== WebSocket.OPEN || !currentUser) return;

        // 确保有位置信息
        if (!myPosition) {
            myPosition = { lat: 31.28, lng: 121.50 }; // 默认上海位置
        }
            
        // 确保有范围信息
        if (!visibleRange) {
            visibleRange = 1000; // 默认1000米
        }
            
        socket.send(JSON.stringify({
            type: 'login',
            userId: currentUser.id,
            nickname: currentUser.nickname,
            avatar: currentUser.avatar || '👤',
            lat: myPosition.lat,
            lng: myPosition.lng,
            range: visibleRange,
            invisible: (userStats.status === 6)
        }));
            
        console.log("📤 发送登录信息:", currentUser.nickname, "范围:", visibleRange + "米");
    }
        
    function sendPositionToServer() {
        if (!socket || socket.readyState !== WebSocket.OPEN || !currentUser) return;
            
        // 确保有位置信息
        if (!myPosition) {
            console.log("⚠️ 无位置信息，使用默认位置");
            myPosition = { lat: 31.28, lng: 121.50 };
        }
            
        // 暂时勿扰时不上报位置（避免服务端广播我的坐标）
        if (userStats.status === 6) {
            console.log('🔕 暂时勿扰：跳过位置上报');
            return;
        }

        socket.send(JSON.stringify({
            type: 'position',
            lat: myPosition.lat,
            lng: myPosition.lng,
            userId: currentUser.id,
            nickname: currentUser.nickname,
            avatar: currentUser.avatar || '👤',
            range: visibleRange
        }));
            
        console.log("📍 发送位置信息:", myPosition, "范围:", visibleRange + "米");
    }

    function requestNearbyBubbles() {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error("❌ WebSocket 未连接，无法请求气泡");
            return;
        }
            
        if (!myPosition) {
            console.error("❌ 无位置信息，无法请求气泡");
            return;
        }
            
        // ✅ 使用 queryBubbles 并发送位置和半径
        const requestData = {
            type: "queryBubbles",
            lat: myPosition.lat,
            lng: myPosition.lng,
            radius: visibleRange || 1000  // 使用可见范围
        };
            
        socket.send(JSON.stringify(requestData));
            
        console.log(`📡 [${new Date().toLocaleTimeString()}] 请求附近气泡`, {
            纬度: myPosition.lat.toFixed(6),
            经度: myPosition.lng.toFixed(6),
            半径: visibleRange || 1000,
            当前气泡数: bubbles.length,
            地图标记数: bubbleMarkers.size
        });
    }


    // ==================== 消息处理 ====================
    function handleServerMessage(data) {
        console.log("📨 收到服务器消息:", data.type, data);

        switch (data.type) {
            case "registerResponse":
                // 处理注册响应
                if (data.success) {
                    showAuthMessage(data.message || '注册成功！', 'success');
                    setTimeout(() => {
                        switchAuthMode('login');
                        // 自动填充登录信息
                        document.getElementById('loginId').value = data.user.id;
                    }, 1500);
                } else {
                    showAuthMessage(data.message || '注册失败', 'error');
                }
                break;
        // 在 handleServerMessage 函数的 switch 语句中添加

    case "userFullInfo":
        console.log("📦 收到完整用户信息:", data.user);

        // 更新 currentUser 对象
        if (currentUser) {
            currentUser = {
                ...currentUser,
                id: data.user.id,
                phone: data.user.phone,
                username: data.user.username,
                nickname: data.user.username,
                avatar: data.user.avatar || '👤',
                gender: data.user.gender || '保密',
                birthday: data.user.birthday || '',
                region: data.user.region || '未设置',
                bio: data.user.bio || '',
                background: data.user.background || '#667eea',
                theme: data.user.theme || 'light',
                isVip: data.user.is_vip ? true : false
            };
            
            // ✅ 更新头像显示
            updateAvatarDisplay(currentUser.avatar);
            
            // ⭐ v9.6.6: 更新性别、年龄、地区、简介显示
            updateUserDetails();
            
            // ⭐ 关键：收到完整用户信息后，查询发布记录
            if (document.getElementById('userCenterOverlay').style.display === 'block') {
                console.log("📤 用户中心已打开，查询发布记录...");
                queryUserPublished();
            }
        }

        // 重新加载设置页面显示
        loadUserSettings();
        break;



            // ⭐ 新增：登录界面用户信息查询结果

            case "loginSuccess":
                // 认证登录成功
                if (data.message) {
                    showAuthMessage(data.message, 'success');
                }
                // 设置当前用户
                currentUser = {
                    id: data.user.id,
                    nickname: data.user.nickname,
                    phone: data.user.phone,
                    avatar: data.user.avatar
                };
                    
                // ⭐ v9.4.3: 保存登录信息（如果勾选了记住密码或自动登录）
                const loginId = document.getElementById('loginId').value.trim();
                const password = document.getElementById('loginPassword').value;
                saveLoginInfo(loginId, password);
                    
                // 隐藏登录界面
                setTimeout(() => {
                    hideAuthOverlay();
                    handleLoginSuccess(data.user);
                }, 1000);
                break;
                    
            case "loginFailed":
                // 登录失败
                showAuthMessage(data.message || '登录失败', 'error');
                break;
                    
            case "onlineCount":
                updateOnlineCount(data.count);
                break;
                    
            case "newBubble": {
                const _b = data.bubble;
                if (!_b) break;
                if (myPosition && _b.lat && _b.lng) {
                    const _d = calculateDistance(myPosition.lat, myPosition.lng, _b.lat, _b.lng);
                    const _r = visibleRange || 1000;
                    if (_d > _r) {
                        console.log(`📡 [newBubble] 超出局域范围 ${_d.toFixed(0)}m > ${_r}m，不显示: ${_b.title}`);
                        break; // 不在范围内，忽略广播
                    }
                }
                console.log('🎈 收到新气泡（在局域范围内）:', _b.title);
                addBubble(_b, true); // 已检查过距离，跳过 addBubble 内部重复检查
                break;
            }
                    
            case "queryResult":
                // ⭐ 新增：处理气泡查询结果并应用筛选
                console.log("🔍 收到气泡查询结果:", data.bubbles.length, "个气泡");
                if (data.bubbles && data.bubbles.length > 0) {
                    // ⭐ 应用筛选
                    const filteredBubbles = filterBubbles(data.bubbles);
                    console.log("📊 筛选后气泡数:", filteredBubbles.length);
                    filteredBubbles.forEach(bubble => addBubble(bubble, true, true));
                    refreshBubbleMarkersForCurrentZoom();
                } else {
                    console.log("📭 附近没有气泡");
                }
                break;
                    
            case "nearbyBubbles":
                console.log(`📦 收到附近气泡: ${data.bubbles.length} 个`);
                // ⭐ 应用筛选
                const filteredNearbyBubbles = filterBubbles(data.bubbles);
                console.log("📊 筛选后气泡数:", filteredNearbyBubbles.length);
                // 服务端已按 radius 过滤，skipRangeCheck=true 避免重复计算
                filteredNearbyBubbles.forEach(bubble => addBubble(bubble, true, true));
                refreshBubbleMarkersForCurrentZoom();
                break;
                    
            case "publicChat":
                console.log("💬 收到服务器广播的聊天消息:", data.from, data.msg);
                    
                // 检查是否是自己的消息
                const isMyMessage = currentUser && 
                    (data.fromId === currentUser.id || data.from === currentUser.nickname);
                    
                // 如果是自己的消息，并且我们已经本地显示过了，就跳过
                if (isMyMessage && data.messageId && sentMessageIds.has(data.messageId)) {
                    console.log("⏭️ 跳过自己消息的回声:", data.messageId);
                    return;
                }
                    
                // 添加消息到列表
                addChatMessage({
                    from: data.from,
                    avatar: data.avatar,
                    text: data.msg,
                    time: data.time,
                    isMyMessage: isMyMessage,  // 如果是自己的消息，标记为true
                    id: data.messageId
                });
                break;
                    
            case "userPosition":
                console.log(`📍 收到用户位置广播: ${data.nickname}, 范围: ${data.range || 1000}米`);
                updateOtherUserPosition(data);
                break;
                    
            case "onlineUsers":
                // 更新在线用户列表
                updateOnlineUsersList(data.users);
                break;
                    
            case "clearBubblesResponse":
                console.log("✅ 服务器已确认清除气泡:", data.message);
                // 这里可以做一些额外的清理工作
                break;
                    
            case "bubblesCleared":
                // 服务器通知气泡已被清除
                console.log("🎯 服务器已清除气泡");
                // 不需要再做什么，因为本地已经清除了
                break;


            case "userRangeUpdate":
                console.log(`🎯 收到用户范围更新: ${data.nickname} -> ${data.range}米`);
                // 更新在线用户的范围
                if (onlineUsers[data.userId]) {
                    const oldRange = onlineUsers[data.userId].range;
                    onlineUsers[data.userId].range = data.range;
                    console.log(`   范围变化: ${oldRange || 1000}米 -> ${data.range}米`);
                    // 刷新标记以应用新范围
                    refreshAllMarkers();
                }
                break;
                
            // ⭐ 新增：处理点赞记录查询结果
            case "userLikesResult":
                console.log("📊 收到点赞记录:", data.likes.length, "条");
                displayLikesList(data.likes);
                break;
                
            // ⭐ 新增：处理收藏记录查询结果
            case "userFavoritesResult":
                console.log("📊 收到收藏记录:", data.favorites.length, "条");
                displayFavoritesList(data.favorites);
                break;
                
            // ⭐ 新增：处理评论记录查询结果
            case "userCommentsResult":
                console.log("📊 收到评论记录:", data.comments.length, "条");
                displayCommentsList(data.comments);
                break;
                
            // ⭐ 新增：处理统计数据查询结果
            case "userStatsResult":
                console.log("📊 收到统计数据:", data.stats);
                userStats = data.stats;
                    
                // ✅ 添加安全检查
                const publishedEl = document.getElementById('publishedCount');
                if (publishedEl) publishedEl.textContent = userStats.publishedCount;
                    
                const likesEl = document.getElementById('likesCount');
                if (likesEl) likesEl.textContent = userStats.likesCount;
                    
                const favoritesEl = document.getElementById('favoritesCount');
                if (favoritesEl) favoritesEl.textContent = userStats.favoritesCount;
                    
                const commentsEl = document.getElementById('commentsCount');
                if (commentsEl) commentsEl.textContent = userStats.commentsCount;
                break;
                
            // ⭐ 新增：处理我发布的查询结果
            case "userPublishedResult":
                console.log("📊 发布记录:", data.bubbles.length, "条");
                displayPublishedList(data.bubbles);
                break;
                
            // ⭐ 新增：处理浏览记录查询结果
            case "userViewsResult":
                console.log("📊 浏览记录:", data.views.length, "条");
                displayViewsList(data.views);
                break;
                
            // ⭐ 新增：处理搜索结果
            case "searchResult":
                console.log(`🔍 搜索结果: ${data.results.length} 条`);
                displaySearchResults(data.results, data.section);
                break;
                
            // ⭐ 新增：处理未读通知查询结果
            case "unreadNotificationsResult":
                console.log(`🔔 未读通知: ${data.count} 条`);
                updateNotificationBadge(data.count);
                break;
                
            // ⭐ 新增：会员激活成功
            // ⭐ 新增：会员激活成功
            case "vipActivated":
                console.log("💎 会员激活成功");
                if (currentUser) {
                    currentUser.isVip = true;
                    currentUser.vipExpireTime = data.expireTime;
                }
                updateVipDisplay(data);
                updateCustomTimeButtonState(); // ⭐ 更新按钮状态
                closeVipModal();
                break;
                            
            // ⭐ 新增：会员状态查询结果
            // ⭐ 新增：会员状态查询结果
            case "vipStatusResult":
                console.log("💎 会员状态:", data);
                if (currentUser) {
                    currentUser.isVip = data.isVip;
                    currentUser.vipExpireTime = data.expireTime || 0;
                    
                    // 检查是否过期
                    const now = Date.now();
                    const isVipValid = data.isVip && data.expireTime > now;
                    
                    console.log('📅 VIP过期时间:', new Date(data.expireTime).toLocaleString());
                    console.log('✅ VIP有效:', isVipValid);
                    
                    updateVipDisplay(data);
                    updateCustomTimeButtonState(); // ⭐ 更新按钮状态
                }
                break;
                
    case "userInfoUpdated":
        console.log(`⚙️ ${data.field}更新成功:`, data.value);
        if (currentUser) {
            currentUser[data.field] = data.value;
            // 同步更新用户中心显示
            if (data.field === 'username') {
                document.getElementById('ucUsername').textContent = data.value;
            }
            // ✅ 如果是头像更新，刷新所有头像显示
            if (data.field === 'avatar') {
                updateAvatarDisplay(data.value);
            }
            // ⭐ 应用界面风格
            if (data.field === 'theme') {
                applyTheme(data.value);
            }
            // ⭐ 如果是VIP状态更新，刷新按钮状态
            if (data.field === 'isVip') {
                updateCustomTimeButtonState();
            }
            // 重新加载设置页面显示
            loadUserSettings();
        }
        break;
                


            // ⭐ 新增：收件箱未读数查询结果
    // ⭐ 新增：收件箱未读数查询结果
    case "inboxUnreadResult":
        console.log(`📨 收件箱未读:`, data.counts);
        // 更新总未读数小红点
        updateInboxBadge(data.total);
            
        // ✅ v9.6.5: 更新标签上的小红点，0时隐藏
        const likeBadge = document.getElementById('tabLikeBadge');
        if (likeBadge) {
            const likeCount = data.counts.like || 0;
            likeBadge.textContent = likeCount;
            likeBadge.style.display = likeCount > 0 ? 'inline-block' : 'none';
        }
            
        const favoriteBadge = document.getElementById('tabFavoriteBadge');
        if (favoriteBadge) {
            const favoriteCount = data.counts.favorite || 0;
            favoriteBadge.textContent = favoriteCount;
            favoriteBadge.style.display = favoriteCount > 0 ? 'inline-block' : 'none';
        }
            
        const commentBadge = document.getElementById('tabCommentBadge');
        if (commentBadge) {
            const commentCount = data.counts.comment || 0;
            commentBadge.textContent = commentCount;
            commentBadge.style.display = commentCount > 0 ? 'inline-block' : 'none';
        }
        break;
                
            // ⭐ 新增：某类型通知列表查询结果
            case "notificationsByTypeResult":
                console.log(`📨 ${data.notificationType}通知:`, data.notifications.length, '条');
                displayNotificationsList(data.notifications, data.notificationType);
                // 刷新收件箱未读数
                queryInboxUnread();

                break;
                
            // ⭐ 新增：记录删除成功
            case "recordsDeleted":
                console.log(`🗑️ 删除成功: ${data.count}条记录`);
                // 刷新对应标签
                if (data.section === 'published') queryUserPublished();
                else if (data.section === 'likes') queryUserLikes();
                else if (data.section === 'favorites') queryUserFavorites();
                else if (data.section === 'comments') queryUserComments();
                else if (data.section === 'history') queryUserViews();
                break;

            // ⭐ 新增：气泡内容编辑成功
            case "bubbleUpdated": {
                console.log(`✏️ 气泡更新成功: ${data.bubbleId}`);
                
                // 更新本地气泡数据
                const bubbleIndex = bubbles.findIndex(b => b.id === data.bubbleId);
                if (bubbleIndex !== -1) {
                    bubbles[bubbleIndex].title = data.title;
                    bubbles[bubbleIndex].content = data.content;
                    
                    // 更新地图上的标记
                    const marker = bubbleMarkers.get(data.bubbleId);
                    if (marker) {
                        // 如果当前打开的信息窗口是这个气泡，关闭它
                        if (currentInfoWindow && currentInfoWindow.bubble && 
                            currentInfoWindow.bubble.id === data.bubbleId) {
                            currentInfoWindow.close();
                            currentInfoWindow = null;
                        }
                    }
                }
                
                // 更新用户中心卡片
                const card = document.getElementById(`bubble-card-${data.bubbleId}`);
                if (card) {
                    const titleEl = card.querySelector('.uc-record-title');
                    if (titleEl) titleEl.textContent = data.title || '';
                    const contentEl = card.querySelector('.uc-record-desc');
                    if (contentEl && data.content) {
                        contentEl.textContent = data.content;
                    } else if (contentEl && !data.content) {
                        contentEl.remove();
                    }
                    // 同步发布者头像/昵称（服务端返回最新信息时）
                    if (data.author_avatar !== undefined) {
                        const avEl = card.querySelector('.uc-author-avatar');
                        if (avEl) avEl.innerHTML = renderAvatarPreview(data.author_avatar);
                    }
                    if (data.author_name !== undefined) {
                        const nmEl = card.querySelector('.uc-author-name');
                        if (nmEl) nmEl.textContent = data.author_name;
                    }
                } else {
                    // 如果找不到卡片，重新查询
                    queryUserPublished();
                }
                
                // 刷新控制面板的气泡列表
                if (!panelCollapsed) {
                    displayBubbles(bubbles);
                }
                break;
            }
    
    case "bubbleUpdateError":
        console.log('⚠️ 气泡更新失败:', data.message);
        break;
    
    // 在 WebSocket onmessage 的 switch 中添加：

    // ⭐ v9.4.0: 私聊相关消息处理
    case "privateChatsResult":
        displayPrivateChats(data.chats);
        break;

    case "privateMessagesResult":
        displayPrivateMessages(data.messages);
        break;

    case "privateMessageSent":
        // 消息发送成功，刷新聊天窗口
        if (currentChatUserId === data.toUserId) {
    queryPrivateMessages(data.toUserId);
        }
        // 刷新私聊列表（如果打开）
        if (document.getElementById('chatListOverlay').style.display === 'flex') {
    queryPrivateChats();
        }
        break;

    case "privateMessageReceived":
        // 接收到新消息
        console.log(`📨 收到新消息: ${data.fromUserName}`);
    
        if (currentChatUserId === data.fromUserId) {
    // 如果正在聊天窗口，刷新消息
    queryPrivateMessages(data.fromUserId);
        } else {
    // 否则更新未读数
    queryPrivateUnreadCount();
        }
        break;

    case "privateUnreadCountResult":
        updateChatBadge(data.count);
        break;

    // 处理用户信息查询（用于从气泡发起私聊和名片卡）
    case "userInfoResult":
        console.log('📦 收到用户信息:', data.user);
    
        if (window.pendingChatUserId) {
    // 从气泡发起私聊的场景
    openChatWithUser(window.pendingChatUserId, data.user.username, data.user.avatar);
    window.pendingChatUserId = null;
        } else if (currentChatUserId === data.user.id || currentChatUserId === data.user.userId) {
    // 当前正在私聊窗口中，更新名片卡
    console.log('🔄 更新当前聊天窗口的名片卡');
    updateUserCard(data.user);
        } else {
    // 登录界面显示头像的场景
    showLoginAvatar(data.user);
        }
        break;

    // ⭐ v9.4.0: 评论相关消息处理
    case "bubbleCommentsResult":
        // 如果服务器返回了uniqueId，就使用它
        displayBubbleComments(data.bubbleId, data.comments, data.uniqueId);
        break;


    case "provincesResult":
        handleProvincesResult(data.provinces);
        break;

    case "citiesResult":
        handleCitiesResult(data.provinceId, data.cities);
        break;

    case "searchCitiesResult":
        handleSearchResults(data.results);
        break;

    case "searchPlacesResult":
        console.log('📦 收到搜索结果:', data.places.length, '个');
        // 不管 fromRange 是什么，都调用 displaySearchSuggestions
        // 因为 displaySearchSuggestions 会自动判断显示位置
        displaySearchSuggestions(data.places);
        break;


    // 处理逆地理编码结果
    case "reverseGeocodeResult":
        console.log('📍 收到逆地理编码结果:', data.address);
        if (data.address) {
    document.getElementById('locationSearchInput').value = data.address;
        }
        break;


            default:
                console.log("⚠️ 未处理的消息类型:", data.type);
        }
    }

function handleLoginSuccess(user) {
    console.log("✅ 登录成功:", user);  
    queryPrivateUnreadCount();
    // 更新用户信息
    if (!currentUser) {
        currentUser = {
            userId: user.userId || user.id,
            id: user.id,
            nickname: user.nickname || user.username,
            avatar: user.avatar || '👤',
            username: user.username,
            gender: user.gender || '保密',
            birthday: user.birthday || '',
            region: user.region || '未设置',
            bio: user.bio || '',
            background: user.background || '#667eea',
            theme: user.theme || 'light',
            isVip: user.isVip || false,
            vipExpireTime: user.vipExpireTime || 0  // ⭐ 新增：VIP过期时间
        };
    } else {
        currentUser.userId = user.userId || user.id;
        currentUser.id = user.id;
        currentUser.theme = user.theme || 'light';
        currentUser.isVip = user.isVip || false;
        currentUser.vipExpireTime = user.vipExpireTime || 0;  // ⭐ 新增：VIP过期时间
        if (user.avatar) {
            currentUser.avatar = user.avatar;
        }
    }
    
    updateAvatarDisplay(currentUser.avatar);
    applyTheme(currentUser.theme);
    
    document.getElementById('userNickname').textContent = currentUser.nickname;
    document.getElementById('userId').textContent = `ID: ${user.id}`;
    
    if (!myPosition) {
        myPosition = user.lat && user.lng ? 
            { lat: user.lat, lng: user.lng } : 
            { lat: 39.9042, lng: 116.4074 };
    }
    
    updateMyMarker();   // 内部按模式决定是画圆圈还是 marker
    refreshAllMarkers();
    
    setTimeout(() => {
        requestNearbyBubbles();
    }, 500);

    // 登录后预加载用户中心发布记录，避免首次打开时出现加载占位
    setTimeout(() => {
        queryUserPublished();
    }, 300);
    window.userPublishedPrefetched = true;
    
    if (typeof window.showWelcomeMessage === 'function') {
        window.showWelcomeMessage();
    }
    
    // ⭐ 更新自定义时长按钮状态
    setTimeout(updateCustomTimeButtonState, 500);
}

// 检查当前用户是否为VIP
// 检查当前用户是否为有效VIP（未过期）
function isCurrentUserVip() {
    if (!currentUser) return false;
    
    // 检查是否有VIP标志和过期时间
    if (!currentUser.isVip || !currentUser.vipExpireTime) return false;
    
    // 检查是否过期
    const now = Date.now();
    const isVipValid = currentUser.vipExpireTime > now;
    
    console.log('🔍 VIP状态检查:', {
        isVip: currentUser.isVip,
        expireTime: new Date(currentUser.vipExpireTime).toLocaleString(),
        now: new Date(now).toLocaleString(),
        isValid: isVipValid
    });
    
    return isVipValid;
}

// 更新自定义时长按钮状态的函数
function updateCustomTimeButtonState() {
    const customTimeBtn = document.querySelector('.toggle-custom-btn');
    if (!customTimeBtn) return;
    
    if (isCurrentUserVip()) {
        // VIP用户：按钮可点击，文字恢复正常
        customTimeBtn.disabled = false;
        customTimeBtn.innerHTML = '⚙️ 自定义时长';
        customTimeBtn.style.opacity = '1';
        customTimeBtn.style.cursor = 'pointer';
        customTimeBtn.style.background = 'white';
        customTimeBtn.style.color = '#667eea';
        customTimeBtn.style.border = '2px solid #667eea';
    } else {
        // 非VIP用户：按钮不可点击，文字改为VIP专属，灰色样式
        customTimeBtn.disabled = true;
        customTimeBtn.innerHTML = '⚙️ 自定义时长（VIP专属）';
        customTimeBtn.style.opacity = '0.5';
        customTimeBtn.style.cursor = 'not-allowed';
        customTimeBtn.style.background = '#f5f5f5';
        customTimeBtn.style.color = '#999';
        customTimeBtn.style.border = '2px solid #ddd';
    }
}

    function updateOnlineCount(count) {
        console.log("👥 在线人数:", count);
        // 可以在这里更新在线人数显示
    }

    function updateOnlineUsersList(users) {
        const container = document.getElementById('onlineUsersList');
        if (!container) return;
            
        // 清空在线用户列表
        onlineUsers = {};
            
        if (users && users.length > 0) {
            // 更新在线用户信息
            users.forEach(user => {
                onlineUsers[user.userId] = {
                    lat: user.lat,
                    lng: user.lng,
                    nickname: user.nickname,
                    avatar: user.avatar || '👤',
                    range: user.range || 1000,
                    invisible: !!user.invisible  // 暂时勿扰：不显示在他人地图上
                };
            });
                
            // 刷新标记
            refreshAllMarkers();  // ✅ 重要：更新后立即刷新标记
                
            // 更新UI列表
            container.innerHTML = users.map(user => `
                <div class="user-item">
                    <span style="color: #5483B3">👤</span>
                    <span>${user.nickname}</span>
                    <span style="font-size: 12px; color: #666">
                        ${user.lat ? `(${user.lat.toFixed(4)}, ${user.lng.toFixed(4)})` : '(位置未知)'}
                        <br>范围: ${user.range || 1000}米
                    </span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="user-item"><span style="color: #5483B3">👤</span><span>暂无其他在线用户</span></div>';
        }
    }


    function updateOtherUserPosition(data) {
        if (!data.userId) return;
            
        // 如果是自己，跳过
        if (currentUser && data.userId === currentUser.id) {
            return;
        }
            
        // ⭐ 重要：存储对方的范围信息
        const oldRange = onlineUsers[data.userId]?.range;
        const newRange = data.range || 1000;
            
        onlineUsers[data.userId] = {
            lat: data.lat,
            lng: data.lng,
            nickname: data.nickname,
            avatar: data.avatar || onlineUsers[data.userId]?.avatar || '👤',
            range: newRange,
            invisible: !!data.invisible
        };
            
        console.log(`📍 更新用户位置: ${data.nickname} (${data.userId})`);
        console.log(`   位置: (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`);
        console.log(`   范围: ${oldRange || 1000}米 -> ${newRange}米`);
            
        // 刷新标记
        refreshAllMarkers();
    }


        
    // ==================== 气泡功能 ====================
    function selectBubbleType(type) {
        selectedBubbleType = type;
            
        // 更新UI - 药丸按钮
        document.querySelectorAll('.bubble-type-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        const pillBtn = document.querySelector(`.bubble-type-btn[data-type="${type}"]`);
        if (pillBtn) pillBtn.classList.add('selected');
        
        // 更新UI - 圆形选择器
        document.querySelectorAll('.type-circle').forEach(circle => {
            if (circle.dataset.type === type) {
                circle.classList.add('active');
            } else {
                circle.classList.remove('active');
            }
        });
        
        // ⭐ 建群类型禁用content输入框
        const contentInput = document.getElementById('bubbleContent');
        const contentPanelInput = document.getElementById('bubbleContentPanel');
        
        if (type === 'group') {
            // 禁用并清空content输入框
            if (contentInput) {
                contentInput.disabled = true;
                contentInput.value = '';
                contentInput.placeholder = '建群类型无需填写内容';
                contentInput.style.background = '#f5f5f5';
            }
            if (contentPanelInput) {
                contentPanelInput.disabled = true;
                contentPanelInput.value = '';
                contentPanelInput.placeholder = '建群类型无需填写内容';
                contentPanelInput.style.background = '#f5f5f5';
            }
        } else {
            // 启用content输入框
            if (contentInput) {
                contentInput.disabled = false;
                contentInput.placeholder = '输入气泡内容';
                contentInput.style.background = 'white';
            }
            if (contentPanelInput) {
                contentPanelInput.disabled = false;
                contentPanelInput.placeholder = '输入气泡内容';
                contentPanelInput.style.background = 'white';
            }
        }
            
        console.log("✅ 选择气泡类型:", type);
    }

    // ⭐ 新增：处理图片上传（发布面板）
    function handleImageUploadPanel(event) {
        const files = Array.from(event.target.files);
        
        // 限制最多3张
        const remainingSlots = 3 - bubbleImages.length;
        const filesToAdd = files.slice(0, remainingSlots);
        
        if (files.length > remainingSlots) {
        }
        
        filesToAdd.forEach(file => {
            // 检查文件大小（最大5MB）
            if (file.size > 5 * 1024 * 1024) {
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                bubbleImages.push(e.target.result);
                updateImagePreviewPanel();
            };
            reader.readAsDataURL(file);
        });
        
        // 清空input以便再次选择
        event.target.value = '';
    }

    // ⭐ 新增：更新图片预览（发布面板）
    function updateImagePreviewPanel() {
        const container = document.getElementById('imagePreviewPanel');
        if (!container) return;
        
        if (bubbleImages.length === 0) {
            container.innerHTML = '<div style="color: var(--text-tertiary); font-size: 13px; text-align: center; width: 100%; padding: 10px;">暂无图片</div>';
            return;
        }
        
        container.innerHTML = bubbleImages.map((img, index) => `
            <div style="position: relative; width: 80px; height: 80px; border-radius: 6px; overflow: hidden; border: 2px solid #dee2e6;">
                <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
                <button onclick="removeImagePanel(${index})" 
                        style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px;
                               background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%;
                               cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;"
                        title="删除">×</button>
            </div>
        `).join('');
    }

    // ⭐ 新增：删除图片（发布面板）
    function removeImagePanel(index) {
        bubbleImages.splice(index, 1);
        updateImagePreviewPanel();
    }

    function addBubble(bubble, skipRangeCheck = false, deferRender = false) {
        // 检查清除标记
        if (window.clearBubblesFlag) {
            console.log('🚫 清除模式中，忽略新气泡:', bubble.id);
            return;
        }

        // ✅ 局域范围过滤：只接受在当前可见范围内的气泡
        if (!skipRangeCheck && myPosition && bubble.lat && bubble.lng) {
            const dist = calculateDistance(
                myPosition.lat, myPosition.lng,
                bubble.lat, bubble.lng
            );
            const range = visibleRange || 1000;
            if (dist > range) {
                console.log(`🚫 气泡超出局域范围 (${dist.toFixed(0)}m > ${range}m)，已过滤: ${bubble.title}`);
                return null;
            }
        }

        // 检查是否已存在
        const existingBubble = bubbles.find(b => b.id === bubble.id);
        if (existingBubble) {
            console.log('⚠️ 气泡已存在，跳过:', bubble.id);
            return;
        }

        // ⭐ 关键：建群气泡的roomCode应该由服务器提供
        if (bubble.type === 'group') {
            if (!bubble.roomCode) {
                console.error("❌ 建群气泡缺少roomCode！");
                console.error("   气泡ID:", bubble.id);
                console.error("   这个气泡无法正常使用，请检查服务器端代码");
                console.error("   服务器需要保存客户端发送的roomCode");
                // 不再自动生成，避免每个客户端生成不同的代码
            } else {
                console.log("✅ 建群气泡roomCode:", bubble.roomCode);
            }
        }
            
        // 确保气泡有必要的字段
        if (!bubble.createdAt) {
            bubble.createdAt = Date.now();
        }
        if (!bubble.time) {
            bubble.time = bubble.createdAt;
        }
            
        // 添加到列表
        bubbles.push(bubble);

        // 按当前缩放级别重绘（包含重叠聚合）
        if (!deferRender) {
            refreshBubbleMarkersForCurrentZoom();
        }
            
        return bubble;
    }

    // 显示长按提示
    let currentHint = null;

    function showLongPressHint(bubbleTitle, position) {
        // 移除现有的提示
        hideLongPressHint();
            
        // 创建提示元素
        currentHint = document.createElement('div');
        currentHint.className = 'long-press-hint';
        currentHint.textContent = `长按显示 ${bubbleTitle} 详情`;
            
        // 计算位置
        const pixelPosition = map.getProjection().fromLatLngToContainerPixel(position);
        currentHint.style.left = (pixelPosition.x + 10) + 'px';
        currentHint.style.top = (pixelPosition.y + 60) + 'px';
            
        document.body.appendChild(currentHint);
    }

    // 隐藏长按提示
    function hideLongPressHint() {
        if (currentHint) {
            currentHint.remove();
            currentHint = null;
        }
    }


    function getBubbleTypeName(type) {
        const names = {
            recommend: '推荐',
            help: '求助',
            team: '组队',
            warning: '避雷',
            news: '见闻'
        };
        return names[type] || type;
    }


            
    // ⭐ 聚合距离阈值（占屏幕宽度的百分比），可通过调试按钮实时调整
    let bubbleClusterThresholdPct = 5.0; // 默认 5%

    function getBubbleClusterThresholdPx() {
        // 将屏幕宽度百分比转换为像素距离
        return window.innerWidth * (bubbleClusterThresholdPct / 100);
    }

    function groupBubblesByDistance(sourceBubbles) {
        if (!map || !sourceBubbles.length) return sourceBubbles.map(b => [b]);

        const thresholdPx = getBubbleClusterThresholdPx();

        let bounds;
        try { bounds = map.getBounds(); } catch(e) { bounds = null; }
        if (!bounds) return sourceBubbles.map(b => [b]);

        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const mapW = window.innerWidth;
        const mapH = window.innerHeight;

        const lngSpan = ne.getLng() - sw.getLng();
        const latSpan = ne.getLat() - sw.getLat();
        if (lngSpan <= 0 || latSpan <= 0) return sourceBubbles.map(b => [b]);

        // 只聚合当前视口内的气泡，视口外的不参与
        const inBounds = sourceBubbles.filter(b =>
            b.lat >= sw.getLat() && b.lat <= ne.getLat() &&
            b.lng >= sw.getLng() && b.lng <= ne.getLng()
        );
        if (!inBounds.length) return [];

        const pts = inBounds.map(b => ({
            bubble: b,
            x: ((b.lng - sw.getLng()) / lngSpan) * mapW,
            y: ((ne.getLat() - b.lat) / latSpan) * mapH
        }));

        // 单链接聚合（single-linkage）：
        // 新成员加入后，以该新成员为起点继续扩展，
        // 确保链式分布也能被完整合并。
        const used = new Set();
        const groups = [];

        for (let i = 0; i < pts.length; i++) {
            if (used.has(i)) continue;
            used.add(i);

            const groupIdxs = [i];
            const queue = [i];

            while (queue.length) {
                const cur = queue.shift();
                const ax = pts[cur].x, ay = pts[cur].y;

                for (let j = 0; j < pts.length; j++) {
                    if (used.has(j)) continue;
                    const dx = ax - pts[j].x;
                    const dy = ay - pts[j].y;
                    if (Math.sqrt(dx * dx + dy * dy) <= thresholdPx) {
                        used.add(j);
                        groupIdxs.push(j);
                        queue.push(j);
                    }
                }
            }

            groups.push(groupIdxs.map(idx => pts[idx].bubble));
        }

        // 第二遍：将视觉上与某聚合重心重叠的单气泡并入该聚合
        // （处理"聚合重心滑到单气泡旁边"的边界情况）
        const singles = groups.filter(g => g.length === 1);
        const clusters = groups.filter(g => g.length > 1);

        if (singles.length && clusters.length) {
            // 计算各聚合重心像素坐标
            const clusterCentroids = clusters.map(cl => {
                const xs = cl.map(b => ((b.lng - sw.getLng()) / lngSpan) * mapW);
                const ys = cl.map(b => ((ne.getLat() - b.lat) / latSpan) * mapH);
                return {
                    cx: xs.reduce((a, v) => a + v, 0) / xs.length,
                    cy: ys.reduce((a, v) => a + v, 0) / ys.length
                };
            });

            const absorbed = new Set();
            singles.forEach((sg, si) => {
                const b = sg[0];
                const bx = ((b.lng - sw.getLng()) / lngSpan) * mapW;
                const by = ((ne.getLat() - b.lat) / latSpan) * mapH;
                for (let ci = 0; ci < clusters.length; ci++) {
                    const { cx, cy } = clusterCentroids[ci];
                    const dx = bx - cx, dy = by - cy;
                    if (Math.sqrt(dx * dx + dy * dy) <= thresholdPx) {
                        clusters[ci].push(b);
                        absorbed.add(si);
                        break;
                    }
                }
            });

            // 重建最终分组：未被吸收的单气泡 + 所有聚合
            return [
                ...singles.filter((_, si) => !absorbed.has(si)),
                ...clusters
            ];
        }

        return groups;
    }

    function clearBubbleLabelsOnly() {
        const removed = new Set();
        bubbleMarkers.forEach((markerInfo) => {
            if (markerInfo && markerInfo.label && !removed.has(markerInfo.label)) {
                markerInfo.label.setMap(null);
                removed.add(markerInfo.label);
            }
        });
        bubbleMarkers.clear();
        clusterLookup.clear();
    }

    function addBubbleToMap(bubble) {
        if (!map || !bubble) return null;

        const icons = {
            recommend: '👍',
            help: '🆘',
            team: '👥',
            warning: '⚠️',
            news: '📰',
            group: '💬'
        };

        const icon = icons[bubble.type] || '📍';
        const label = new qq.maps.Label({
            position: new qq.maps.LatLng(bubble.lat, bubble.lng),
            map: map,
            content: `<div class="bubble bubble-${bubble.type}" data-bubble-id="${bubble.id}" style="cursor:pointer;pointer-events:none;" title="点击查看详情">${icon}</div>`,
            style: { border: 'none', background: 'transparent' }
        });

        qq.maps.event.addListener(label, 'click', function() {
            if (currentOpenBubbleId === bubble.id && currentInfoWindow) {
                currentInfoWindow.close();
                currentInfoWindow = null;
                currentOpenBubbleId = null;
            } else {
                showBubbleInfoWindow(bubble, label);
            }
        });

        return label;
    }

    function clearSpiderfy() {
        _suppressRefresh = false;
        spiderfyState.labels.forEach(l => l && l.setMap && l.setMap(null));
        spiderfyState.lines.forEach(p => p && p.setMap && p.setMap(null));
        spiderfyState.clusterId = null;
        spiderfyState.labels = [];
        spiderfyState.lines = [];
        hideSpiderfyOverlay();
        restorePreClusterView();
    }

    function restorePreClusterView() {
        if (preClusterZoomSnap && map) {
            map.setZoom(preClusterZoomSnap.zoom);
            map.setCenter(preClusterZoomSnap.center);
            preClusterZoomSnap = null;
        }
    }
    window.restorePreClusterView = restorePreClusterView;

    function showSpiderfyOverlay() {
        let ov = document.getElementById('spiderfyOverlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'spiderfyOverlay';
            // z-index 低于 QQ Maps 标记层（~8000），高于普通 UI
            ov.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,0.35);backdrop-filter:blur(1px);-webkit-backdrop-filter:blur(1px);';
            ov.addEventListener('click', () => clearSpiderfy());
            document.body.appendChild(ov);
        }
        ov.style.display = 'block';
    }

    function hideSpiderfyOverlay() {
        const ov = document.getElementById('spiderfyOverlay');
        if (ov) ov.style.display = 'none';
    }

    function spiderfyCluster(clusterId, centerLat, centerLng) {
        const clusterBubbles = clusterLookup.get(clusterId) || [];
        if (!clusterBubbles.length) return;

        clearSpiderfy();
        spiderfyState.clusterId = clusterId;

        const count = clusterBubbles.length;
        const radiusMeters = count > 8 ? 45 : 32;

        const icons = {
            recommend: '👍',
            help: '🆘',
            team: '👥',
            warning: '⚠️',
            news: '📰',
            group: '💬'
        };

        for (let i = 0; i < count; i++) {
            const bubble = clusterBubbles[i];
            const angle = (Math.PI * 2 * i) / count;

            const dx = radiusMeters * Math.cos(angle);
            const dy = radiusMeters * Math.sin(angle);

            const dLat = (dy / 111111);
            const dLng = (dx / (111111 * Math.cos((centerLat * Math.PI) / 180)));

            const targetLat = centerLat + dLat;
            const targetLng = centerLng + dLng;

            const line = new qq.maps.Polyline({
                map,
                path: [
                    new qq.maps.LatLng(centerLat, centerLng),
                    new qq.maps.LatLng(targetLat, targetLng)
                ],
                strokeColor: '#9a938b',
                strokeWeight: 1,
                strokeOpacity: 0.8
            });
            spiderfyState.lines.push(line);

            const icon = icons[bubble.type] || '📍';
            const spiderLabel = new qq.maps.Label({
                position: new qq.maps.LatLng(targetLat, targetLng),
                map,
                content: `<div class="bubble-spider" style="pointer-events:none;" title="${escapeHtml(bubble.title || '无标题')}">${icon}</div>`,
                style: { border: 'none', background: 'transparent' }
            });

            qq.maps.event.addListener(spiderLabel, 'click', function() {
                clearSpiderfy();
                showBubbleInfoWindow(bubble, spiderLabel);
            });

            spiderfyState.labels.push(spiderLabel);
        }
    }

    function showOverlapBubbleList(clusterId, lat, lng) {
        const clusterBubbles = clusterLookup.get(clusterId) || [];
        if (!clusterBubbles.length) return;

        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }

        const typeMap = {
            recommend: '推荐',
            help: '求助',
            team: '组队',
            warning: '避雷',
            news: '见闻',
            group: '建群'
        };

        const listHtml = clusterBubbles
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .map((b, idx) => {
                const t = typeMap[b.type] || '气泡';
                const timeStr = formatTime(b.createdAt || Date.now());
                return `<button onclick="openOverlapBubble('${clusterId}', ${idx})" style="display:block;width:100%;text-align:left;padding:8px 10px;border:1px solid var(--border-light);background:#f8f7f4;border-radius:8px;margin-bottom:6px;cursor:pointer;color:var(--text-primary);font-size:13px;"><div style='font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'>${escapeHtml(b.title || '无标题')}</div><div style='display:flex;justify-content:space-between;color:var(--text-secondary);font-size:11px;margin-top:2px;'><span>${t} · ${escapeHtml(b.author || '匿名')}</span><span>${timeStr}</span></div></button>`;
            })
            .join('');

        const summary = clusterBubbles.reduce((acc, b) => {
            const k = b.type || 'other';
            acc[k] = (acc[k] || 0) + 1;
            return acc;
        }, {});

        const summaryText = Object.entries(summary)
            .map(([k, n]) => `${typeMap[k] || '其他'} ${n}`)
            .join(' · ');

        const content = `<div style="width:280px;max-height:300px;overflow-y:auto;padding:10px;background:var(--card-bg);border-radius:12px;"><div style="font-weight:700;margin-bottom:4px;color:var(--text-primary);">重叠气泡 ${clusterBubbles.length} 条</div><div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">${summaryText}</div>${listHtml}</div>`;

        const infoWindow = new qq.maps.InfoWindow({
            map,
            position: new qq.maps.LatLng(lat, lng),
            content
        });

        qq.maps.event.addListener(infoWindow, 'closeclick', function() {
            restorePreClusterView();
        });

        infoWindow.open();
        currentInfoWindow = infoWindow;
        currentOpenBubbleId = null;
    }

    window.openOverlapBubble = function(clusterId, index) {
        const clusterBubbles = clusterLookup.get(clusterId) || [];
        const bubble = clusterBubbles[index];
        if (!bubble) return;

        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }

        const markerInfo = bubbleMarkers.get(bubble.id);
        const label = markerInfo && markerInfo.label;
        if (label) {
            showBubbleInfoWindow(bubble, label);
        }
    };

    function refreshBubbleMarkersForCurrentZoom() {
        if (!map) return;

        clearSpiderfy();
        clearBubbleLabelsOnly();

        const groups = groupBubblesByDistance(
            typeof getFilteredBubbles === 'function' ? getFilteredBubbles() : bubbles
        );
        groups.forEach((group, idx) => {
            if (!group.length) return;

            if (group.length === 1) {
                const bubble = group[0];
                const label = addBubbleToMap(bubble);
                if (label) bubbleMarkers.set(bubble.id, { bubble, label });
                return;
            }

            const centerLat = group.reduce((s, b) => s + b.lat, 0) / group.length;
            const centerLng = group.reduce((s, b) => s + b.lng, 0) / group.length;
            const clusterId = `cluster_${idx}_${group.length}`;
            clusterLookup.set(clusterId, group);

            // 类型摘要：去重后取中文名，·分隔
            const typeNameMap = { recommend:'推荐', help:'求助', team:'组队', warning:'避雷', news:'见闻', group:'建群' };
            const typeSet = [...new Set(group.map(b => b.type || 'other'))];
            const typeLabel = typeSet.map(t => typeNameMap[t] || t).join('·');

            // 模式读取
            const isModeB = (localStorage.getItem('clusterInteractionMode') || 'A') === 'B';

            const clusterLabel = new qq.maps.Label({
                position: new qq.maps.LatLng(centerLat, centerLng),
                map,
                content: `<div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;gap:3px;pointer-events:none;">
                    <span class="bubble-cluster-glow" style="pointer-events:none;"></span>
                    <div class="bubble-cluster" style="pointer-events:none;" title="${isModeB ? '点击展开' : '点击查看列表'}">${group.length}</div>
                    <div style="pointer-events:none;font-size:10px;color:var(--text-primary);background:rgba(248,247,244,.94);border:1px solid var(--border-light);border-radius:8px;padding:2px 7px;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${typeLabel}</div>
                </div>`,
                style: { border: 'none', background: 'transparent' }
            });

            qq.maps.event.addListener(clusterLabel, 'click', function() {
                const mode = localStorage.getItem('clusterInteractionMode') || 'A';

                // 保存视图快照
                preClusterZoomSnap = {
                    zoom: map.getZoom(),
                    center: map.getCenter()
                };

                // 聚焦地图（禁止触发重新聚合）
                _suppressRefresh = true;
                const TARGET_ZOOM = 16;
                map.setCenter(new qq.maps.LatLng(centerLat, centerLng));
                if (map.getZoom() < TARGET_ZOOM) map.setZoom(TARGET_ZOOM);

                if (mode === 'B') {
                    if (spiderfyState.clusterId === clusterId) {
                        _suppressRefresh = false;
                        clearSpiderfy();
                    } else {
                        spiderfyCluster(clusterId, centerLat, centerLng);
                        // 等地图稳定后再显示遮罩，避免 bounds_changed 闪退
                        setTimeout(() => {
                            _suppressRefresh = false;
                            showSpiderfyOverlay();
                        }, 320);
                    }
                } else {
                    // 方式 A：显示气泡列表
                    setTimeout(() => { _suppressRefresh = false; }, 320);
                    if (currentInfoWindow) {
                        currentInfoWindow.close();
                        currentInfoWindow = null;
                    }
                    showOverlapBubbleList(clusterId, centerLat, centerLng);
                }
            });

            group.forEach((bubble) => {
                bubbleMarkers.set(bubble.id, { bubble, label: clusterLabel, clusterId });
            });
        });
    }

    // 暴露给外部筛选函数调用
    window.refreshBubbleMarkersForCurrentZoom = refreshBubbleMarkersForCurrentZoom;
    function showBubbleInfoWindow(bubble, label) {
        console.log(`🪟 显示气泡信息窗口: ${bubble.title}`);
    
        // ⭐ 记录浏览
        recordBubbleView(bubble.id);
    
        // 关闭现有的信息窗口
        if (currentInfoWindow) {
    currentInfoWindow.close();
    currentInfoWindow = null;
        }
    
        const typeNames = {
    recommend: '推荐',
    help: '求助',
    team: '组队',
    warning: '避雷',
    news: '见闻',
    group: '💬 建群'
        };
    
        const typeName = typeNames[bubble.type] || bubble.type;
    
        // 添加房间代码显示
        const roomCodeDisplay = bubble.type === 'group' && bubble.roomCode ? 
    `<div style="margin: 10px 0; padding: 10px; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid #FFD700;">
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 5px;">💬 群聊代码</div>
        <div style="font-family: 'Courier New', monospace; font-size: 20px; color: var(--text-primary); letter-spacing: 2px; text-align: center; padding: 8px;">
            ${bubble.roomCode}
        </div>
        <button onclick="setChatroomCode('${bubble.roomCode}')" 
                style="width: 100%; padding: 8px; margin-top: 8px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); border: none; border-radius: 6px; color: var(--text-primary); font-weight: 600; cursor: pointer;"
                onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(255, 215, 0, 0.4)';"
                onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
            加入此群聊
        </button>
    </div>` : '';
    
        // ⭐ 气泡互动状态
        const bubbleInteraction = bubbleInteractions[bubble.id] || {};
        const isLiked = bubbleInteraction.liked || false;
        const isFavorited = bubbleInteraction.favorited || false;
    
    // 创建信息窗口内容
    const content = `
        <div style="
    background: var(--card-bg);
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    width: 320px;  /* 固定宽度 */
    min-height: 280px;  /* 最小高度 */
    max-height: 500px;  /* 最大高度 */
    overflow-y: auto;  /* 内容过多时滚动 */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    position: relative;
        ">
    <!-- 标题和类型 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0;">
        <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(bubble.title)}</div>
        <span style="padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; color: white; background: ${getBubbleColor(bubble.type)}; flex-shrink: 0;">${typeName}</span>
    </div>
        
    <!-- 群聊代码（如果有） -->
    ${roomCodeDisplay}
        
    <!-- 气泡内容（建群类型不显示内容）-->
    ${bubble.type !== 'group' && bubble.content ? `<div style="color: #495057; font-size: 14px; line-height: 1.6; margin: 10px 0; padding: 8px; background: var(--bg-secondary); border-radius: 8px; max-height: 150px; overflow-y: auto;">${escapeHtml(bubble.content).replace(/\n/g, '<br>')}</div>` : ''}
    
    <!-- ⭐ 气泡图片 -->
    ${bubble.images && bubble.images.length > 0 ? `
        <div style="display: flex; gap: 6px; margin: 10px 0; flex-wrap: wrap;">
            ${bubble.images.slice(0, 3).map((img, idx) => `
                <img src="${img}" 
                     onclick="window.open('${img}', '_blank')"
                     style="width: ${bubble.images.length === 1 ? '100%' : 'calc(50% - 3px)'}; 
                            max-width: ${bubble.images.length === 1 ? '300px' : '150px'};
                            height: ${bubble.images.length === 1 ? 'auto' : '100px'}; 
                            object-fit: cover; 
                            border-radius: 8px; 
                            cursor: pointer;
                            border: 1px solid var(--border-color);
                            transition: all 0.2s;"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'">
            `).join('')}
        </div>
    ` : ''}

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6c757d;">
        <div style="display: flex; align-items: center; gap: 5px;">
    <span style="font-size: 16px; display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;">
        ${renderAvatarPreview(bubble.avatar)}
    </span>
    <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(bubble.author || '匿名')}</span>
        </div>
        <button onclick="startChatFromBubble('${bubble.author_id || bubble.authorId}')" 
        style="padding: 4px 10px; border-radius: 8px; background: #4CAF50; border: none; cursor: pointer; font-size: 11px; color: white; font-weight: 500; transition: all 0.2s; flex-shrink: 0;"
        onmouseover="this.style.background='#45a049';"
        onmouseout="this.style.background='#4CAF50';">
    💬 私聊
        </button>
        <div style="flex-shrink: 0;">${formatTime(bubble.createdAt || Date.now())}</div>
    </div>
        
    <!-- 互动按钮区域 -->
    <div style="display: flex; justify-content: space-around; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
        <button id="likeBtn-${bubble.id}" onclick="likeBubble('${bubble.id}')" 
                style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); cursor: pointer; transition: all 0.3s; font-size: 13px; color: ${isLiked ? '#FF6B6B' : '#666'}; font-weight: 500;">
            ${isLiked ? '❤️' : '🤍'} 点赞
        </button>
        <button id="favBtn-${bubble.id}" onclick="favoriteBubble('${bubble.id}')" 
                style="flex: 1; padding: 8px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); cursor: pointer; transition: all 0.3s; font-size: 13px; color: ${isFavorited ? '#FFD700' : '#666'}; font-weight: 500;">
            ${isFavorited ? '⭐' : '☆'} 收藏
        </button>
        <!-- ⭐ 评论区按钮 -->
        <button onclick="showBubbleComments('${bubble.id}', '${bubble.title}', '${bubble.type}', '${bubble.author}', '${bubble.avatar}')" 
                style="
                    flex: 1;
                    padding: 8px;
                    border: none;
                    border-radius: 8px;
                    background: linear-gradient(135deg, var(--primary-gradient-start) 0%, var(--primary-gradient-end) 100%);
                    cursor: pointer;
                    font-size: 13px;
                    color: white;
                    font-weight: 500;
                ">
            💬 评论区
        </button>
    </div>
        </div>
    `;


        try {
    console.log(`📍 气泡位置: ${bubble.lat}, ${bubble.lng}`);
        
    // 获取标签的位置
    const labelPosition = label.getPosition();
    console.log(`📍 标签位置: ${labelPosition.getLat()}, ${labelPosition.getLng()}`);
        
    // 创建信息窗口
    const infoWindow = new qq.maps.InfoWindow({
        map: map,
        position: labelPosition,
        content: content
    });
        
    // 打开信息窗口
    infoWindow.open();
    currentInfoWindow = infoWindow;
    currentOpenBubbleId = bubble.id; // ⭐ v9.7.6: 记录当前打开的气泡ID
    
    // ⭐ v9.7.6: 监听信息窗口关闭事件（点击×按钮时）
    qq.maps.event.addListener(infoWindow, 'closeclick', function() {
        console.log("🔽 信息窗口被×按钮关闭");
        currentOpenBubbleId = null;
        currentInfoWindow = null;
        // 移除气泡高亮
        const bubbleEl = document.querySelector(`[data-bubble-id="${bubble.id}"]`);
        if (bubbleEl) {
            bubbleEl.classList.remove('active');
        }
    });
        
    console.log("✅ 气泡信息窗口已打开");
        
    // 高亮选中的气泡
    document.querySelectorAll('.bubble').forEach(el => el.classList.remove('active'));
    const bubbleEl = document.querySelector(`[data-bubble-id="${bubble.id}"]`);
    if (bubbleEl) {
        bubbleEl.classList.add('active');
        console.log("✨ 气泡高亮");
    }
        
    return infoWindow;
        
        } catch (error) {
    console.error("❌ 创建信息窗口失败:", error);
    return null;
        }
    }


    function closeBubbleInfoWindow() {
        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }
        // 移除所有气泡的高亮状态
        document.querySelectorAll('.bubble').forEach(el => el.classList.remove('active'));
    }


    function getBubbleIcon(type) {
        const emojis = {
            recommend: '👍',
            help: '🆘',
            team: '👥',
            warning: '⚠️',
            news: '📰'
        };
            
        const emoji = emojis[type] || '🎈';
        const color = getBubbleColor(type);
            
        // 创建SVG图标
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="${color}" stroke="white" stroke-width="3"/>
                <text x="24" y="32" text-anchor="middle" fill="white" font-size="24" font-family="Arial">${emoji}</text>
            </svg>
        `;
            
        return new qq.maps.MarkerImage(
            'data:image/svg+xml;utf8,' + encodeURIComponent(svg),
            new qq.maps.Size(48, 48),
            new qq.maps.Point(0, 0),
            new qq.maps.Point(24, 24)
        );
    }

    function getBubbleColor(type) {
        const colors = {
            recommend: '#FF4444',
            help: '#FFD700',
            team: '#4169E1',
            warning: '#9932CC',
            news: '#FF69B4'
        };
        return colors[type] || '#5483B3';
    }


    function showBubbleInfo(bubble) {
        let roomCodeInfo = '';
        if (bubble.type === 'group' && bubble.roomCode) {
            roomCodeInfo = `\n💬 群聊代码: ${bubble.roomCode}\n点击"加入此群聊"即可进入`;
        }
            
        const info = `
    🎈 气泡详情：
    标题：${bubble.title}
    类型：${getBubbleTypeName(bubble.type)}
    作者：${bubble.author}
    内容：${bubble.content || "无内容"}
    时间：${formatTime(bubble.time)}
    位置：${bubble.lat.toFixed(4)}, ${bubble.lng.toFixed(4)}
    ${roomCodeInfo}
        `;
            
    }

    function clearAllBubbles() {
        console.log("🗑️ 开始清除所有气泡");
            
        // 设置清除标记，防止新气泡被添加
        clearBubblesFlag = true;
            
        // 10秒后自动解除清除模式
        if (clearTimeoutId) clearTimeout(clearTimeoutId);
        clearTimeoutId = setTimeout(() => {
            clearBubblesFlag = false;
            console.log("🔄 自动解除清除模式");
        }, 10000);
            
        // 1. 先发送请求到服务器清除气泡
        if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
            socket.send(JSON.stringify({
                type: "clearBubbles",
                userId: currentUser.id,
                clearAll: true
            }));
            console.log("📤 已发送清除气泡请求到服务器");
        }
            
        // 2. 从地图上移除所有气泡标记
        bubbleMarkers.forEach((markerInfo, bubbleId) => {
            if (markerInfo.label) {
                markerInfo.label.setMap(null);
            }
        });
            
        // 3. 清空存储
        bubbleMarkers.clear();
        bubbles.length = 0;
        clearSpiderfy();
            
        // 4. 更新UI
        updateBubblesList();
            
        // 5. 关闭信息窗口
        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }
            
        console.log("✅ 气泡清除完成（锁定10秒）");
    }

    // 添加解除清除模式的函数
    function enableBubbleReceiving() {
        clearBubblesFlag = false;
        if (clearTimeoutId) {
            clearTimeout(clearTimeoutId);
            clearTimeoutId = null;
        }
        console.log("🔄 已启用气泡接收");
    }   
  


            // ==================== 公屏聊天功能 ====================
    function toggleChatPanel() {
        chatPanelVisible = !chatPanelVisible;
        const panel = document.getElementById('chatPanel');
        const chatBtn = document.getElementById('chatButton');
        const publishPanel = document.getElementById('publishPanel');
        const publishBtn = document.getElementById('publishButton');
            
        if (chatPanelVisible) {
            panel.classList.add('show');
            if (chatBtn) chatBtn.classList.add('active');
            setBottomNavActive('chatButton');
            unreadCount = 0;
            updateChatBadge();
            
            // ⭐ 关闭发布面板（互斥）
            if (publishPanel && publishPanel.classList.contains('show')) {
                publishPanel.classList.remove('show');
                if (publishBtn) publishBtn.classList.remove('active');
            }
            
            // 聚焦到当前激活选项卡的输入框
            const input = document.getElementById('input' + activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
            if (input) input.focus();
        } else {
            panel.classList.remove('show');
            if (chatBtn) chatBtn.classList.remove('active');
            setBottomNavActive(null);
        }
    }


    function handleChatKey(event, tabId) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage(tabId);
        }
    }


    function sendMessage(tabId) {
        const inputId = 'input' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
        const input = document.getElementById(inputId);
        let text = input.value.trim();
    
        // ⭐ 不允许发送空消息
        if (!text) return;
    
        if (!currentUser) {
            return;
        }
    
        // ⭐ 根据选项卡决定房间代码
        const roomCode = (tabId === 'public') ? '000000' : tabId;
        
        // ⭐ 构造消息（自动添加前缀，用户不可见）
        const fullText = '[' + roomCode + '] ' + text;
    
        // 生成消息ID
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sentMessageIds.add(messageId);
    
        // 立即显示自己的消息
        const localMsg = {
            id: messageId,
            from: currentUser.nickname,
            avatar: currentUser.avatar,
            text: fullText,
            time: Date.now(),
            isMyMessage: true
        };
    
        addChatMessage(localMsg);
    
        // 发送到服务器
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "publicChat",
                msg: fullText,
                messageId: messageId
            }));
            console.log("📤 发送消息:", fullText);
        }
    
        input.value = '';
        input.focus();
    }

    function addChatMessage(message) {
        // 检查重复
        if (message.id && sentMessageIds.has(message.id)) {
            console.log("⚠️ 消息已存在，跳过");
            return;
        }
    
        // ⭐ 系统消息添加到公屏
        if (message.isSystem) {
            tabs.public.messages.push(message);
            if (tabs.public.messages.length > 100) {
                tabs.public.messages = tabs.public.messages.slice(-100);
            }
            renderMessages('public');
            scrollToBottom('public');
            return;
        }
    
        // 解析房间代码
        const text = message.text || '';
        const match = text.match(/^\[(\d{6})\]\s+/);
        
        if (!match) {
            console.log('⚠️ 无前缀消息，忽略');
            return;
        }
        
        const roomCode = match[1];
        const content = text.substring(match[0].length).trim();
        
        // 检查内容不为空
        if (!content) {
            console.log('⚠️ 消息无内容，跳过');
            return;
        }
        
        // ⭐ 分配到对应选项卡
        if (roomCode === '000000') {
            // 公屏消息
            tabs.public.messages.push(message);
            if (tabs.public.messages.length > 100) {
                tabs.public.messages = tabs.public.messages.slice(-100);
            }
            renderMessages('public');
            scrollToBottom('public');
            
            // 未读提示
            if (!chatPanelVisible || activeTab !== 'public') {
                if (!message.isMyMessage) {
                    unreadCount++;
                    updateChatBadge();
                }
            }
        } else {
            // 聊天室消息
            // ⭐ v9.6.5: 只有当用户已加入该聊天室（选项卡已存在）时才接收消息
            if (!tabs[roomCode]) {
                // 不自动创建选项卡，只在用户主动加入时创建
                console.log(`📭 收到聊天室 ${roomCode} 的消息，但用户未加入该聊天室，忽略`);
                return;
            }
            
            tabs[roomCode].messages.push(message);
            if (tabs[roomCode].messages.length > 100) {
                tabs[roomCode].messages = tabs[roomCode].messages.slice(-100);
            }
            renderMessages(roomCode);
            scrollToBottom(roomCode);
            
            // 未读提示
            if (!chatPanelVisible || activeTab !== roomCode) {
                if (!message.isMyMessage) {
                    unreadCount++;
                    updateChatBadge();
                }
            }
        }
    
        console.log("💬 消息已添加到", roomCode === '000000' ? '公屏' : '聊天室 ' + roomCode);
    }
    
    function renderMessages(tabId) {
        const containerId = 'messages' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const messages = tabs[tabId] ? tabs[tabId].messages : [];
        
        container.innerHTML = messages.map(msg => {
            const rowClass = msg.isMyMessage ? 'message-row self' : 'message-row other';
            const name = msg.isMyMessage ? '我' : msg.from;
            
            // ⭐ 处理头像
            let avatarHtml = '👤';
            if (msg.avatar) {
                const isBase64 = msg.avatar && msg.avatar.startsWith('data:image');
                if (isBase64) {
                    avatarHtml = `<img src="${msg.avatar}">`;
                } else {
                    avatarHtml = msg.avatar;
                }
            }
            
            // 提取消息内容（移除前缀）
            const text = msg.text || '';
            const match = text.match(/^\[\d{6}\]\s+/);
            const content = match ? text.substring(match[0].length) : text;
            
            return `
                <div class="${rowClass}">
                    <div class="message-package">
                        <div class="message-pill">
                            <div class="pill-top">
                                <div class="user-badge">
                                    <div class="avatar-circle">${avatarHtml}</div>
                                    <span class="badge-id">${escapeHtml(name)}</span>
                                </div>
                            </div>
                            <div class="pill-content">
                                <div class="bubble-text">${escapeHtml(content)}</div>
                            </div>
                        </div>
                        <div class="time-stamp">${formatTime(msg.time, true)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    

    function scrollToBottom(tabId) {
        setTimeout(() => {
            const containerId = 'messages' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
            const container = document.getElementById(containerId);
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    }
    
    function switchTab(tabId) {
        activeTab = tabId;
        
        // 更新按钮状态
        document.querySelectorAll('.chat-tab').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 更新内容显示
        document.querySelectorAll('.chat-tab-content').forEach(content => {
            if (content.id === 'tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1)) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // 聚焦输入框
        const inputId = 'input' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
        const input = document.getElementById(inputId);
        if (input) input.focus();
    }
    
    function createRoomTab(roomCode, roomName) {
        if (tabs[roomCode]) return;
        
        // 创建数据
        tabs[roomCode] = {
            name: roomName,
            messages: []
        };
        
        // 创建选项卡按钮
        const tabsContainer = document.getElementById('chatTabs');
        const btn = document.createElement('button');
        btn.className = 'chat-tab';
        btn.dataset.tab = roomCode;
        btn.onclick = () => switchTab(roomCode);
        btn.innerHTML = `
            💬 ${roomName}
            <span class="chat-tab-close" onclick="event.stopPropagation(); closeRoomTab('${roomCode}')">×</span>
        `;
        tabsContainer.appendChild(btn);
        
        // 创建选项卡内容
        const tabId = 'tab' + roomCode.charAt(0).toUpperCase() + roomCode.slice(1);
        const messagesId = 'messages' + roomCode.charAt(0).toUpperCase() + roomCode.slice(1);
        const inputId = 'input' + roomCode.charAt(0).toUpperCase() + roomCode.slice(1);
        
        const content = document.createElement('div');
        content.className = 'chat-tab-content';
        content.id = tabId;
        content.innerHTML = `
            <div class="chat-messages" id="${messagesId}"></div>
            <div class="chat-input-area">
                <input type="text" id="${inputId}" placeholder="输入消息…" onkeydown="handleChatKey(event, '${roomCode}')" autocomplete="off">
                <button onclick="sendMessage('${roomCode}')">发送</button>
            </div>
        `;
        document.getElementById('tabPublic').parentNode.appendChild(content);
        
        // 切换到新选项卡
        switchTab(roomCode);
        
        console.log('✅ 创建聊天室选项卡:', roomCode, roomName);
    }
    
    function closeRoomTab(roomCode) {
        // 删除数据
        delete tabs[roomCode];
        
        // 删除按钮
        const btn = document.querySelector(`[data-tab="${roomCode}"]`);
        if (btn) btn.remove();
        
        // 删除内容
        const tabId = 'tab' + roomCode.charAt(0).toUpperCase() + roomCode.slice(1);
        const content = document.getElementById(tabId);
        if (content) content.remove();
        
        // 如果关闭当前选项卡，切换到公屏
        if (activeTab === roomCode) {
            switchTab('public');
        }
        
        console.log('✅ 关闭聊天室选项卡:', roomCode);
    }



    // ⭐ 旧函数已废弃，使用renderMessages代替
    /*
    function updateChatMessages() {
        const container = document.getElementById('chatMessages');
        if (!container) return;
            
        container.innerHTML = chatMessages.map(msg => {
            const messageClass = msg.isMyMessage ? 'chat-message my-message' : 'chat-message';
            const senderName = msg.isMyMessage ? '我' : msg.from;
            const avatar = msg.isMyMessage ? '👤' : (msg.avatar || '👤');
                
            // ⭐ 解析消息前缀
            const text = msg.text || '';
            const prefixMatch = text.match(/^\[(\d{6})\]\s+/);
            let roomCode = null;
            let actualMessage = text;
            let roomBadge = '';
            let messageStyle = 'color: var(--text-primary); font-size: 13px;';
                
            if (prefixMatch) {
                roomCode = prefixMatch[1];
                actualMessage = text.substring(prefixMatch[0].length);
                    
                if (roomCode === '000000') {
                    // 公屏消息 - 蓝色
                    roomBadge = '<span style="background: #5483B3; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 4px;">📢 公屏</span>';
                } else {
                    // 聊天室消息 - 金色
                    roomBadge = '<span style="background: #FFD700; color: var(--text-primary); padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 4px;">💬 [' + roomCode + ']</span>';
                }
            }
                
            return `
                <div class="${messageClass}">
                    <div class="sender">${roomBadge}${avatar} ${senderName}</div>
                    <div style="${messageStyle}">${escapeHtml(actualMessage)}</div>
                    <div class="time">${formatTime(msg.time, true)}</div>
                </div>
            `;
        }).join('');
            
        // 滚动到底部
        container.scrollTop = container.scrollHeight;
    }
    */

    // updateChatBadge (см. определение выше с параметром count)

    // ==================== 辅助函数 ====================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ⭐ 新增：处理HTML转义并保留换行
    function escapeHtmlWithBreaks(text) {
        if (!text) return '';
        return escapeHtml(text).replace(/\n/g, '<br>');
    }

    function formatTime(timestamp, showSeconds = false) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
            
        // 如果是今天
        if (diff < 24 * 60 * 60 * 1000) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = showSeconds ? ':' + date.getSeconds().toString().padStart(2, '0') : '';
            return `${hours}:${minutes}${seconds}`;
        }
            
        // 如果是今年
        if (date.getFullYear() === now.getFullYear()) {
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${month}-${day}`;
        }
            
        return date.toLocaleDateString();
    }

    // ⭐ v9.7.7: 已删除 showNetworkStatus 函数
    
    // ⭐ v9.6.10: 优美的发布成功通知（类似QQ消息）
    function showPublishSuccessNotification(title, type, duration) {
        // 创建或获取通知容器
        let notification = document.getElementById('publishNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'publishNotification';
            notification.className = 'publish-notification';
            document.body.appendChild(notification);
        }
        
        // 气泡类型配置
        const typeConfig = {
            'recommend': { icon: '👍', name: '推荐', color: '#4facfe' },
            'help': { icon: '🆘', name: '求助', color: '#8B0000' },
            'team': { icon: '👥', name: '组队', color: '#f093fb' },
            'group': { icon: '💬', name: '建群', color: '#a8edea' },
            'warning': { icon: '⚠️', name: '避雷', color: '#feca57' },
            'news': { icon: '📰', name: '见闻', color: '#48dbfb' }
        };
        
        const config = typeConfig[type] || typeConfig['recommend'];
        
        // 格式化时长
        const days = Math.floor(duration / (24 * 60));
        const hours = Math.floor((duration % (24 * 60)) / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (days > 0) durationText += `${days}天`;
        if (hours > 0) durationText += `${hours}小时`;
        if (minutes > 0) durationText += `${minutes}分钟`;
        if (!durationText) durationText = '0分钟';
        
        // 设置通知内容
        notification.innerHTML = `
            <div class="notification-icon" style="background: transparent; font-size: 24px;">
                ${config.icon}
            </div>
            <div class="notification-content">
                <div class="notification-title">气泡发布成功</div>
                <div class="notification-desc">${config.name} · ${title}</div>
            </div>
            <div class="notification-close" onclick="hidePublishNotification()">×</div>
            <div class="notification-time" style="position: absolute; bottom: 8px; right: 16px; font-size: 11px; color: var(--text-tertiary);">
                ${durationText}
            </div>
        `;
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 3秒后自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    function hidePublishNotification() {
        const notification = document.getElementById('publishNotification');
        if (notification) {
            notification.classList.remove('show');
        }
    }

    // ==================== 测试函数 ====================
    function loginTestUser() {
        // 使用测试账号快速登录
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'authLogin',
                loginId: 'testuser',
                password: '123456'
            }));
                
            console.log("👤 尝试使用测试账号登录...");
        } else {
        }
    }
    
    // ==================== 聊天室功能模块 ====================

    /**
     * 当前聊天室代码
     * 默认为 "000000" 表示不在任何聊天室（公屏模式）
     */

    /**
     * 生成6位随机聊天室代码（非全0）
     * @returns {string} 6位数字聊天室代码
     */
    function generateChatroomCode() {
        let code;
        do {
    code = String(Math.floor(100000 + Math.random() * 900000));
        } while (code === "000000");
        return code;
    }

    /**
     * 更新聊天室代码
     * 当用户手动修改聊天室代码输入框时调用
     */

    function updateChatroomCode() {
        const input = document.getElementById('chatroomCodeInput');
        if (!input) return;

        let code = input.value.trim();
        if (code.length === 0) code = '000000';

        if (!/^[0-9]{6}$/.test(code)) {
            input.value = currentChatroomCode;
            return;
        }

        currentChatroomCode = code;
        input.value = code;

        // 同步聊天面板状态栏
        updateChatroomStatusBar();
        updateChatInputPlaceholder();
        refilterAllMessages();

        const msg = code === '000000' ? '已回到公屏模式' : ('已进入聊天室 [' + code + ']');
    }

    function updateChatroomStatusBar() {
        const bar   = document.getElementById('chatroomStatusBar');
        const badge = document.getElementById('chatroomStatusCode');
        const title = document.getElementById('chatHeaderTitle');
        if (!bar) return;
        if (currentChatroomCode === '000000') {
            bar.style.display = 'none';
            if (title) title.textContent = '公共聊天';
        } else {
            bar.style.display = 'flex';
            // ⭐ 显示ID和聊天室名称
            const roomName = getCurrentChatroomName();
            if (badge) {
                badge.textContent = roomName ? 
                    `${currentChatroomCode} - ${roomName}` : 
                    currentChatroomCode;
            }
            if (title) {
                title.textContent = roomName ? 
                    `💬 ${roomName}` : 
                    '聊天室模式';
            }
        }
    }

    // ⭐ 新增函数：获取当前聊天室名称
    function getCurrentChatroomName() {
        const bubble = bubbles.find(b => b.type === 'group' && b.roomCode === currentChatroomCode);
        return bubble ? bubble.title : null;
    }

    // ⭐ 新增：重新过滤所有消息
    // ⭐ 新增：重新过滤所有消息
    function refilterAllMessages() {
        console.log('🔄 重新过滤所有消息，当前聊天室:', currentChatroomCode);
    
        if (chatMessages.length === 0) {
    console.log('🔍 没有消息需要重新过滤');
    updateChatMessages();
    return;
        }
    
        // 备份所有消息
        const allMessagesBackup = [...chatMessages];
    
        // 清空当前显示的消息
        chatMessages = [];
    
        // 重新添加所有消息（会自动过滤）
        let keptCount = 0;
        let filteredCount = 0;
    
        allMessagesBackup.forEach(msg => {
    // 系统消息始终添加
    if (msg.isSystem) {
        chatMessages.push(msg);
        keptCount++;
        return;
    }
        
    // 重新应用过滤逻辑
    const text = msg.text || '';
    const prefixMatch = text.match(/^\[(\d{6})\]\s+/);
        
    if (prefixMatch) {
        const messageRoomCode = prefixMatch[1];
        const actualContent = text.substring(prefixMatch[0].length).trim();
            
        // ⭐ 修复：检查消息是否有实际内容
        if (!actualContent) {
            filteredCount++;
            console.log('⚠️ 过滤只有前缀无内容的消息:', text);
            return;
        }
            
        if (currentChatroomCode === '000000') {
            // 公屏模式：只显示[000000]的消息
            if (messageRoomCode === '000000') {
                chatMessages.push(msg);
                keptCount++;
            } else {
                filteredCount++;
            }
        } else {
            // 聊天室模式：显示[000000]或当前聊天室的消息
            if (messageRoomCode === '000000' || messageRoomCode === currentChatroomCode) {
                chatMessages.push(msg);
                keptCount++;
            } else {
                filteredCount++;
            }
        }
    } else {
        // 无前缀消息过滤掉
        filteredCount++;
    }
        });
    
        console.log(`🔍 重新过滤完成: 保留${keptCount}条，过滤${filteredCount}条`);
    
        // 更新UI
        updateChatMessages();
    }
    /**
     * 重置聊天室代码到000000（公屏模式）
     */
    function resetChatroomCode() {
        const input = document.getElementById('chatroomCodeInput');
        if (input) {
    input.value = "000000";
    updateChatroomCode();
        }
    }

    /**
     * 设置聊天室代码（点击建群气泡时调用）
     * @param {string} code - 聊天室代码
     */
    function setChatroomCode(code) {
        // ⭐ 获取聊天室名称
        const bubble = bubbles.find(b => b.type === 'group' && b.roomCode === code);
        const name = bubble ? bubble.title : code;
        
        // ⭐ 创建或切换到聊天室选项卡
        if (!tabs[code]) {
            createRoomTab(code, name);
        } else {
            switchTab(code);
        }
        
        // ⭐ 打开聊天面板
        if (!chatPanelVisible) {
            toggleChatPanel();
        }
        
        console.log('✅ 已进入聊天室:', code, name);
    }

    /**
     * 更新聊天输入框的提示文字
     * 根据当前聊天室状态显示不同提示
     */
    function updateChatInputPlaceholder() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;
    
        if (currentChatroomCode === "000000") {
    chatInput.placeholder = "输入公屏消息...";
    chatInput.value = "";  // 清空输入框
        } else {
    chatInput.placeholder = "输入消息（自动添加[" + currentChatroomCode + "]前缀，可删除以发公屏）";
    // 自动添加前缀
    if (!chatInput.value.startsWith('[' + currentChatroomCode + '] ')) {
        chatInput.value = '[' + currentChatroomCode + '] ';
    }
        }
    }

    function showNotification(message) {
        console.log('📢', message);
    
        // 创建通知元素
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(52, 152, 219, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideDown 0.3s ease;
        `;
    
        document.body.appendChild(notification);
    
        // 3秒后淡出并移除
        setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => notification.remove(), 500);
        }, 3000);
    }


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

    // 发布面板逻辑已移入 src/panels/publish.js

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


// 气泡筛选功能已移入 src/panels/filter.js

    // ==================== 页面加载时初始化 ====================

