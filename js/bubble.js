// ==================== 气泡互动功能 ====================

function updateBubbleCardButtons(bubbleId, liked, favorited) {
    const likeBtn = document.getElementById('likeBtn-' + bubbleId);
    if (likeBtn) {
        likeBtn.innerHTML = '<span>' + (liked ? '❤️' : '🤍') + ' 点赞</span>';
        likeBtn.style.color = liked ? '#FF6B6B' : '#666';
    }
    const favBtn = document.getElementById('favBtn-' + bubbleId);
    if (favBtn) {
        favBtn.innerHTML = '<span>' + (favorited ? '⭐' : '☆') + ' 收藏</span>';
        favBtn.style.color = favorited ? '#FFD700' : '#666';
    }
}

// ⭐ vA1.3: 根据服务器返回的交互状态刷新当前气泡信息窗口
function refreshCurrentBubbleWindow(bubbleId, liked, favorited) {
    if (!bubbleInteractions[bubbleId]) {
        bubbleInteractions[bubbleId] = {};
    }
    bubbleInteractions[bubbleId].liked = liked;
    bubbleInteractions[bubbleId].favorited = favorited;
    
    if (currentOpenBubbleId !== bubbleId) return;
    
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;
    
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }
    
    const markerInfo = bubbleMarkers.get(bubbleId);
    if (markerInfo && markerInfo.label) {
        showBubbleInfoWindow(bubble, markerInfo.label);
    }
}

function likeBubble(bubbleId) {
    if (!bubbleInteractions[bubbleId]) {
        bubbleInteractions[bubbleId] = {};
    }

    const wasLiked = bubbleInteractions[bubbleId].liked;
    const newLiked = !wasLiked;
    bubbleInteractions[bubbleId].liked = newLiked;
    
    refreshCurrentBubbleWindow(bubbleId, newLiked, bubbleInteractions[bubbleId].favorited);

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'likeBubble',
            bubbleId: bubbleId,
            liked: newLiked
        }));
    }

    updateUserStats();
    console.log((newLiked ? '❤️' : '💔') + ' 气泡点赞:', bubbleId);
}

function favoriteBubble(bubbleId) {
    if (!bubbleInteractions[bubbleId]) {
        bubbleInteractions[bubbleId] = {};
    }

    const wasFavorited = bubbleInteractions[bubbleId].favorited;
    const newFavorited = !wasFavorited;
    bubbleInteractions[bubbleId].favorited = newFavorited;
    
    refreshCurrentBubbleWindow(bubbleId, bubbleInteractions[bubbleId].liked, newFavorited);

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'favoriteBubble',
            bubbleId: bubbleId,
            favorited: newFavorited
        }));
    }

    updateUserStats();
    console.log((newFavorited ? '⭐' : '☆') + ' 气泡收藏:', bubbleId);
}

function commentBubble(bubbleId) {
    const commentText = prompt('请输入评论内容：');
    if (!commentText || commentText.trim() === '') return;

    if (!bubbleInteractions[bubbleId]) {
        bubbleInteractions[bubbleId] = { comments: [] };
    }
    if (!bubbleInteractions[bubbleId].comments) {
        bubbleInteractions[bubbleId].comments = [];
    }

    const comment = {
        id: Date.now().toString(),
        text: commentText.trim(),
        author: currentUser ? currentUser.nickname : '匿名',
        time: Date.now()
    };

    bubbleInteractions[bubbleId].comments.push(comment);

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'commentBubble',
            bubbleId: bubbleId,
            comment: comment
        }));
    }

    updateUserStats();

    console.log('💬 发表评论:', bubbleId, commentText);
}

function isUserVisible(myPos, myRange, userPos, userRange) {
    if (!myPos || !userPos || !userPos.lat || !userPos.lng) {
        console.log('⚠️ 位置数据不全，用户不可见');
        return false;
    }

    const distance = calculateDistance(
        myPos.lat, myPos.lng,
        userPos.lat, userPos.lng
    );

    if (distance === null || Number.isNaN(distance)) {
        console.log('⚠️ 距离计算失败，用户不可见');
        return false;
    }

    if (!myRange) {
        console.log('📴 用户位置显示已关闭，不显示任何用户');
        return false;
    }

    const iCanSeeThem = distance <= myRange;
    const theyCanSeeMe = distance <= (userRange || 1000);

    console.log(`📏 距离: ${Math.round(distance)}米 | 我的范围: ${myRange}米 | 对方范围: ${userRange || 1000}米`);
    console.log(`👁️ 我能看到对方: ${iCanSeeThem} | 对方能看到我: ${theyCanSeeMe}`);

    return iCanSeeThem && theyCanSeeMe;
}