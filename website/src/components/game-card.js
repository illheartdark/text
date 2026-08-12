/**
 * components/game-card.js —— 首页游戏卡片（鼠标跟随倾斜动效）
 */
(function () {
  'use strict';

  function bindTilt(card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        'rotateY(' + (px * 10).toFixed(2) + 'deg) rotateX(' + (-py * 10).toFixed(2) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    });
  }

  function bindAll() {
    document.querySelectorAll('.game-card').forEach(bindTilt);
  }

  window.GameCard = {
    bind: bindTilt,
    bindAll: bindAll,
  };
})();
