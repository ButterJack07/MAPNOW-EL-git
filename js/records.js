// ==================== 发布记录 / 浏览记录 / 搜索 ====================

function queryUserPublished() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.log('⚠️ WebSocket未连接');
        return;
    }

    console.log('📤 查询我发布的气泡...');
    socket.send(JSON.stringify({
        type: 'queryUserPublished'
    }));
}

function displayPublishedList(bubbles) {
    const container = document.getElementById('uc-published');

    if (!bubbles || bubbles.length === 0) {
        container.innerHTML = '<div class="uc-empty">暂无发布记录</div>';
        return;
    }

    let html = '<div class="uc-records-list">';

    bubbles.forEach(bubble => {
        const bubbleIcon = BUBBLE_CONFIG[bubble.type]?.icon || '📍';
        const bubbleColor = BUBBLE_CONFIG[bubble.type]?.color || '#999';
        const timeStr = formatTimeSimple(bubble.created_at);
        const likes = bubble.like_count || 0;
        const comments = bubble.comment_count || 0;
        const views = bubble.view_count || 0;
        const statusColor = bubble.status === 'active' ? '#4CAF50' : '#999';
        const statusText = bubble.status === 'active' ? '公开' : '私密';
        const safeTitle = (bubble.title || '').replace(/'/g, "\\'");
        const safeContent = (bubble.content || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');
        const images = bubble.images ? (Array.isArray(bubble.images) ? bubble.images : JSON.parse(bubble.images || '[]')) : [];
        const showContent = bubble.content && bubble.content.trim();

        html += `
                <div class="uc-record-item" id="bubble-card-${bubble.id}">
                    <div class="uc-record-icon" style="background: ${bubbleColor};">
                        ${bubbleIcon}
                    </div>
                    <div class="uc-record-content" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <div class="uc-record-title" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(bubble.title || '无标题')}</div>
                            <button onclick="toggleBubbleCardDetail('${bubble.id}', this)"
                                class="uc-icon-action-btn uc-btn-edit" title="展开/收起详情" data-expanded="false">▾</button>
                        </div>
                        <div class="uc-record-meta" style="margin-top:4px;">
                            <span>发布于 ${timeStr}</span>
                            <span>•</span>
                            <span style="color:${statusColor};font-weight:600;">${statusText}</span>
                        </div>

                        <div id="bubble-card-detail-${bubble.id}" style="display:none;margin-top:8px;">
                            <div class="uc-record-author" style="margin-bottom:6px;">
                                <span class="uc-author-avatar">${renderAvatarPreview(currentUser && currentUser.avatar || '👤')}</span>
                                <span class="uc-author-name">${escapeHtml((currentUser && currentUser.nickname) || '我')}</span>
                                <span class="uc-author-id">ID ${(currentUser && currentUser.id) || ''}</span>
                            </div>
                            ${showContent && bubble.content
                                ? `<div class="uc-record-desc" style="margin-bottom:6px;">${escapeHtml(bubble.content).replace(/\n/g, '<br>')}</div>`
                                : ''}
                            ${images.length > 0 ? `
                                <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;">
                                    ${images.slice(0, 3).map(img => `
                                        <img src="${img}" onclick="window.open('${img}','_blank')"
                                             style="width:${images.length===1?'100%':'80px'};max-width:${images.length===1?'200px':'80px'};
                                                    height:${images.length===1?'auto':'80px'};object-fit:cover;border-radius:6px;
                                                    cursor:pointer;border:1px solid var(--border-color);">
                                    `).join('')}
                                </div>
                            ` : ''}
                            <div class="uc-record-stats">
                                <span title="点赞">👍 ${likes}</span>
                                <span title="评论">💬 ${comments}</span>
                                <span title="浏览">👁 ${views}</span>
                            </div>
                        </div>
                    </div>
                    <div class="uc-record-actions">
                        <button onclick="locateToBubble(${bubble.lat},${bubble.lng})"
                                class="uc-icon-action-btn uc-btn-locate" title="定位">📍</button>
                        <button onclick="openEditBubbleModal('${bubble.id}','${safeTitle}','${safeContent}')"
                                class="uc-icon-action-btn uc-btn-edit" title="编辑">✏️</button>
                        <button onclick="deleteRecord('published','${bubble.id}', this)"
                                class="uc-icon-action-btn uc-btn-delete" title="删除">🗑️</button>
                    </div>
                </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
    console.log(`✅ 显示 ${bubbles.length} 条发布记录`);
}

function toggleBubbleCardDetail(bubbleId, btn) {
    const detail = document.getElementById('bubble-card-detail-' + bubbleId);
    if (!detail) return;
    const expanded = btn.dataset.expanded === 'true';
    if (expanded) {
        detail.style.display = 'none';
        btn.dataset.expanded = 'false';
        btn.title = '展开详情';
        btn.style.transform = 'rotate(0deg)';
    } else {
        detail.style.display = 'block';
        btn.dataset.expanded = 'true';
        btn.title = '收起详情';
        btn.style.transform = 'rotate(180deg)';
    }
}

function openEditBubbleModal(bubbleId, title, content) {
    let modal = document.getElementById('editBubbleModal');
    if (!modal) {
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
    document.getElementById('editBubbleTitle').value = title;
    document.getElementById('editBubbleContent').value = content;
    modal.style.display = 'flex';
}

function closeEditBubbleModal() {
    const modal = document.getElementById('editBubbleModal');
    if (modal) modal.style.display = 'none';
}

function submitEditBubble() {
    const modal = document.getElementById('editBubbleModal');
    const bubbleId = modal?.dataset.bubbleId;
    const title = document.getElementById('editBubbleTitle').value.trim();
    const content = document.getElementById('editBubbleContent').value.trim();

    if (!bubbleId) return;
    if (!title) return;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

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
        console.log('⚠️ WebSocket未连接');
        return;
    }

    console.log('🔍 查询浏览记录...');
    socket.send(JSON.stringify({
        type: 'queryUserViews'
    }));
}

function displayViewsList(views) {
    const container = document.getElementById('uc-history');

    if (!views || views.length === 0) {
        container.innerHTML = '<div class="uc-empty">暂无浏览记录</div>';
        return;
    }

    let html = '<div class="uc-records-list">';
    const viewMap = new Map();
    views.forEach(v => {
        const key = v.bubble_id || v.id || v.title;
        const ex = viewMap.get(key);
        if (!ex || new Date(v.viewed_at) > new Date(ex.viewed_at)) viewMap.set(key, v);
    });
    const deduped = Array.from(viewMap.values()).sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at));

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
                        ${(function () {
                            const _aid = view.author_id || view.authorId || view.userId;
                            const _me = currentUser && currentUser.id;
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

function performSearch() {
    const section = document.getElementById('searchSection').value;
    const keyword = document.getElementById('searchKeyword').value.trim();

    if (!keyword) return;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    console.log(`🔍 搜索: ${section} - ${keyword}`);
    socket.send(JSON.stringify({
        type: 'searchRecords',
        section,
        keyword
    }));

    document.getElementById('searchResults').innerHTML = '<div class="uc-empty">搜索中...</div>';
}

function displaySearchResults(results, section) {
    const container = document.getElementById('searchResults');

    if (results.length === 0) {
        container.innerHTML = '<div class="uc-empty">未找到匹配的记录</div>';
        return;
    }

    let html = '<div class="uc-records-list">';
    results.forEach(item => {
        const bubbleIcon = BUBBLE_CONFIG[item.type]?.icon || '📍';
        const bubbleColor = BUBBLE_CONFIG[item.type]?.color || '#999';
        let timeStr = '';
        let actionText = '';

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
                        ${(function () {
                            const _aid = item.author_id || item.authorId || item.userId;
                            const _me = currentUser && currentUser.id;
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

function recordBubbleView(bubbleId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (!bubbleId) return;

    socket.send(JSON.stringify({
        type: 'recordBubbleView',
        bubbleId: bubbleId
    }));

    console.log(`👁️ 记录浏览: ${bubbleId}`);

    const _card = document.getElementById('bubble-card-' + bubbleId);
    if (_card) {
        _card.querySelectorAll('.uc-record-stats span').forEach(sp => {
            if (sp.title === '浏览') {
                const n = parseInt(sp.textContent.replace(/[^0-9]/g, '')) || 0;
                sp.textContent = '👁 ' + (n + 1);
            }
        });
    }
}
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
        
    // 气泡筛选相关在 js/filter.js

    // 查询浏览记录
    // ── 气泡编辑功能 ──────────────────────────────────────────────

    /**
     * 打开编辑气泡弹窗，预填当前标题与内容。
     * @param {string} bubbleId  - 气泡 ID
     * @param {string} title     - 当前标题
     * @param {string} content   - 当前内容
     */