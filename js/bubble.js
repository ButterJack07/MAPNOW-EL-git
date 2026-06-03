// ==================== 气泡互动功能 ====================

function updateBubbleCardButtons(bubbleId, liked, favorited) {
    const likeBtn = document.getElementById('likeBtn-' + bubbleId);
    if (likeBtn) {
        likeBtn.textContent = (liked ? '❤️' : '🤍') + ' 点赞';
        likeBtn.style.color = liked ? '#FF6B6B' : '#666';
    }
    const favBtn = document.getElementById('favBtn-' + bubbleId);
    if (favBtn) {
        favBtn.textContent = (favorited ? '⭐' : '☆') + ' 收藏';
        favBtn.style.color = favorited ? '#FFD700' : '#666';
    }
}

function likeBubble(bubbleId) {
    if (!bubbleInteractions[bubbleId]) {
        bubbleInteractions[bubbleId] = {};
    }

    const wasLiked = bubbleInteractions[bubbleId].liked;
    bubbleInteractions[bubbleId].liked = !wasLiked;

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'likeBubble',
            bubbleId: bubbleId,
            liked: !wasLiked
        }));
    }

    const likeBtn = document.getElementById('likeBtn-' + bubbleId);
    if (likeBtn) {
        likeBtn.textContent = (!wasLiked ? '❤️' : '🤍') + ' 点赞';
        likeBtn.style.color = !wasLiked ? '#FF6B6B' : '#666';
    }

    updateUserStats();

    console.log((!wasLiked ? '❤️' : '💔') + ' 气泡点赞:', bubbleId);
}

function favoriteBubble(bubbleId) {
    if (!bubbleInteractions[bubbleId]) {
        bubbleInteractions[bubbleId] = {};
    }

    const wasFavorited = bubbleInteractions[bubbleId].favorited;
    bubbleInteractions[bubbleId].favorited = !wasFavorited;

    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'favoriteBubble',
            bubbleId: bubbleId,
            favorited: !wasFavorited
        }));
    }

    const favBtn = document.getElementById('favBtn-' + bubbleId);
    if (favBtn) {
        favBtn.textContent = (!wasFavorited ? '⭐' : '☆') + ' 收藏';
        favBtn.style.color = !wasFavorited ? '#FFD700' : '#666';
    }

    updateUserStats();

    console.log((!wasFavorited ? '⭐' : '☆') + ' 气泡收藏:', bubbleId);
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