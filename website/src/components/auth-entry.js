/**
 * components/auth-entry.js —— 登录入口（v0.1.0 仅样式占位）
 */
(function () {
  'use strict';

  function init() {
    var btn = document.getElementById('authEntry');
    if (!btn) return;
    btn.addEventListener('click', function () {
      window.alert('登录功能将在 v0.2.0 版本提供，敬请期待。');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AuthEntry = { init: init };
})();
