(function () {
  var overlayIds = [
    'authOverlay', 'chatListOverlay', 'chatOverlay', 'groupChatOverlay',
    'groupInfoOverlay', 'notificationsOverlay', 'userCenterOverlay',
    'settingsOverlay', 'aboutAppOverlay', 'privacyPolicyOverlay',
    'vipModalOverlay', 'paymentOverlay', 'friendAddOverlay',
    'groupCreateOverlay', 'groupEditOverlay', 'groupInviteOverlay',
    'filterModal', 'locationModal', 'rangePanelOverlay',
    'editBubbleModal', 'noTitleConfirmCard', 'themeModalOverlay'
  ];

  var panelClasses = ['chat-panel', 'publish-panel'];

  function isVisible(el) {
    if (!el || !el.parentNode) return false;
    var style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function getTopPanel() {
    var panels = [];
    overlayIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (isVisible(el)) panels.push(el);
    });
    panelClasses.forEach(function (cls) {
      var els = document.getElementsByClassName(cls);
      for (var i = 0; i < els.length; i++) {
        if (isVisible(els[i])) panels.push(els[i]);
      }
    });
    panels.sort(function (a, b) {
      var za = parseInt(window.getComputedStyle(a).zIndex) || 0;
      var zb = parseInt(window.getComputedStyle(b).zIndex) || 0;
      return zb - za;
    });
    return panels[0] || null;
  }

  function closePanel(el) {
    if (!el) return false;
    var id = el.id || '';
    var cls = el.className || '';

    if (id === 'chatOverlay' && typeof closeChatWindow === 'function') { closeChatWindow(); return true; }
    if (id === 'groupChatOverlay' && typeof closeGroupChat === 'function') { closeGroupChat(); return true; }
    if (id === 'groupInfoOverlay' && typeof closeGroupInfo === 'function') { closeGroupInfo(); return true; }
    if (id === 'chatListOverlay' && typeof closeChatList === 'function') { closeChatList(); return true; }
    if (id === 'notificationsOverlay' && typeof backToChatList === 'function') { backToChatList(); return true; }
    if (id === 'userCenterOverlay' && typeof closeUserCenter === 'function') { closeUserCenter(); return true; }
    if (id === 'settingsOverlay' && typeof closeSettings === 'function') { closeSettings(); return true; }
    if (id === 'aboutAppOverlay' && typeof closeAboutApp === 'function') { closeAboutApp(); return true; }
    if (id === 'privacyPolicyOverlay' && typeof closePrivacyPolicy === 'function') { closePrivacyPolicy(); return true; }
    if (id === 'vipModalOverlay' && typeof closeVipModal === 'function') { closeVipModal(); return true; }
    if (id === 'paymentOverlay' && typeof closePaymentModal === 'function') { closePaymentModal(); return true; }
    if (id === 'filterModal' && typeof closeFilterModal === 'function') { closeFilterModal(); return true; }
    if (id === 'locationModal' && typeof closeLocationModal === 'function') { closeLocationModal(); return true; }
    if (id === 'rangePanelOverlay' && typeof closeRangeModal === 'function') { closeRangeModal(); return true; }
    if (id === 'editBubbleModal' && typeof closeEditBubbleModal === 'function') { closeEditBubbleModal(); return true; }
    if (id === 'themeModalOverlay' && typeof closeThemeModal === 'function') { closeThemeModal(); return true; }
    if (id === 'noTitleConfirmCard') { el.style.display = 'none'; return true; }
    if (id === 'authOverlay' && typeof hideAuthOverlay === 'function') { hideAuthOverlay(); return true; }
    if (id === 'friendAddOverlay' || id === 'groupCreateOverlay' || id === 'groupEditOverlay' || id === 'groupInviteOverlay') { el.style.display = 'none'; return true; }
    if (cls.indexOf('chat-panel') !== -1 && typeof toggleChatPanel === 'function') { toggleChatPanel(); return true; }
    if (cls.indexOf('publish-panel') !== -1 && typeof hidePublishPanel === 'function') { hidePublishPanel(); return true; }
    return false;
  }

  function pushState() {
    history.pushState({ back: true, t: Date.now() }, '');
  }

  var observer = new MutationObserver(function () {
    if (getTopPanel()) {
      pushState();
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class'],
    subtree: true
  });

  window.handleBackPress = function () {
    var top = getTopPanel();
    if (top && closePanel(top)) {
      return 'true';
    }
    return 'false';
  };

  window.addEventListener('popstate', function () {
    if (window.handleBackPress() === 'true') {
      pushState();
    }
  });

  pushState();
})();
