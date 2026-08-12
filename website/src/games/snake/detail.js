/**
 * games/snake/detail.js —— 第 2 层详情页逻辑：难度选择 + 开始游戏
 */
(function () {
  'use strict';

  function init() {
    var startBtn = document.getElementById('startBtn');
    if (!startBtn) return;

    startBtn.addEventListener('click', function () {
      var checked = document.querySelector('input[name="difficulty"]:checked');
      var difficulty = checked ? checked.value : 'normal';
      var nav = window.Navigation ? window.Navigation.createNavigator() : null;
      if (nav) nav.go('play.html?difficulty=' + encodeURIComponent(difficulty));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
