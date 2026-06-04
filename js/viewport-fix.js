(function () {
  if (!window.visualViewport) return;
  if (window.innerWidth >= 768) return;

  var rafId = null;

  function adjust() {
    var layoutH = window.innerHeight;
    var visualH = window.visualViewport.height;
    var kbH = Math.max(0, layoutH - visualH);

    if (kbH > 80) {
      document.documentElement.style.setProperty('--kb-height', kbH + 'px');
      document.body.classList.add('keyboard-open');
    } else {
      document.documentElement.style.setProperty('--kb-height', '0px');
      document.body.classList.remove('keyboard-open');
    }
  }

  function onViewportChange() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(adjust);
  }

  window.visualViewport.addEventListener('resize', onViewportChange);
  window.visualViewport.addEventListener('scroll', onViewportChange);

  adjust();

  document.addEventListener('focusin', function (e) {
    var tag = e.target.tagName;
    if ((tag === 'INPUT' || tag === 'TEXTAREA') && window.innerWidth < 768) {
      setTimeout(function () {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    }
  });
})();
