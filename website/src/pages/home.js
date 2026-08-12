/**
 * pages/home.js —— 第 1 层首页逻辑：渲染游戏卡片、跳转
 */
(function () {
  'use strict';

  var GAMES = [
    {
      id: 'snake',
      name: '贪吃蛇',
      desc: '经典街机玩法：控制小蛇吃食物，越吃越长越刺激。',
      path: 'src/games/snake/index.html',
    },
  ];

  function renderCards() {
    var grid = document.getElementById('gameGrid');
    if (!grid) return;

    GAMES.forEach(function (game) {
      var card = document.createElement('a');
      card.className = 'game-card glass-card';
      card.href = game.path;
      card.setAttribute('data-game', game.id);
      card.innerHTML =
        '<span class="game-card__name">' + game.name + '</span>' +
        '<span class="game-card__desc">' + game.desc + '</span>' +
        '<span class="game-card__go">进入游戏 →</span>';
      card.addEventListener('click', function (e) {
        e.preventDefault();
        var nav = window.Navigation ? window.Navigation.createNavigator() : null;
        if (nav) nav.go(game.path);
      });
      grid.appendChild(card);
    });

    if (window.GameCard) window.GameCard.bindAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCards);
  } else {
    renderCards();
  }
})();
