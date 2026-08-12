/**
 * games/snake/play.js —— 第 3 层游戏页逻辑：画布渲染、键盘/触控控制、计分
 */
(function () {
  'use strict';

  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var tipEl = document.getElementById('tip');
  var startBtn = document.getElementById('startBtn');
  var pauseBtn = document.getElementById('pauseBtn');
  var restartBtn = document.getElementById('restartBtn');
  var dpadBtn = document.getElementById('dpadBtn');
  var dpad = document.getElementById('dpad');
  var actionsEl = document.getElementById('playActions');

  var storage = window.StorageUtil ? window.StorageUtil.createStorage() : null;
  var BEST_KEY = 'snake.best';

  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var difficulty = getParam('difficulty') || 'normal';
  var game = window.SnakeCore.createGame({ difficulty: difficulty });
  var cell = 24;
  var started = false;
  var paused = false;
  var best = storage ? storage.getBest(BEST_KEY) : 0;
  var touchStart = null;

  bestEl.textContent = String(best);

  function setTip(text) {
    tipEl.textContent = text;
  }

  function getParam(name) {
    var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function resizeCanvas() {
    var s = game.getState();
    canvas.width = s.cols * cell;
    canvas.height = s.rows * cell;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    var s = game.getState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (var x = 0; x <= s.cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, canvas.height);
      ctx.stroke();
    }
    for (var y = 0; y <= s.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(canvas.width, y * cell);
      ctx.stroke();
    }

    if (s.food) {
      ctx.beginPath();
      ctx.arc(s.food.x * cell + cell / 2, s.food.y * cell + cell / 2, cell * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#f472b6';
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    s.snake.forEach(function (seg, i) {
      var t = i / Math.max(1, s.snake.length - 1);
      var hue = 170 + t * 90;
      ctx.fillStyle = 'hsl(' + hue + ', 90%, 62%)';
      roundRect(seg.x * cell + 1.5, seg.y * cell + 1.5, cell - 3, cell - 3, 7);
      ctx.fill();
    });

    if (s.status === 'over') {
      ctx.fillStyle = 'rgba(8, 12, 28, 0.72)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#eaf0ff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 30px "Segoe UI", sans-serif';
      ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 12);
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(234, 240, 255, 0.8)';
      ctx.fillText(
        '得分 ' + s.score + (isTouch ? ' · 点击重新开始' : ' · 按 R 或点击重新开始'),
        canvas.width / 2,
        canvas.height / 2 + 26
      );
    } else if (!started) {
      ctx.fillStyle = 'rgba(8, 12, 28, 0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#eaf0ff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.fillText(isTouch ? '滑动开始' : '按方向键开始', canvas.width / 2, canvas.height / 2);
    }
  }

  function step() {
    if (!started || paused) return;
    var s = game.getState();
    if (s.status === 'over') return;
    var result = game.step();
    updateUi();
    if (result.over) onGameOver();
    draw();
  }

  function updateUi() {
    var s = game.getState();
    scoreEl.textContent = String(s.score);
  }

  function onGameOver() {
    var s = game.getState();
    if (s.score > best) {
      best = s.score;
      if (storage) storage.setBest(BEST_KEY, best);
    }
    bestEl.textContent = String(best);
    setTip('游戏结束 · 点重新开始');
  }

  function start() {
    if (started) return;
    if (game.getState().status === 'over') return;
    started = true;
    paused = false;
    setTip(isTouch ? '滑动屏幕控制方向 · 暂停按钮可暂停' : '方向键控制 · 空格暂停 · R 重新开始');
    draw();
  }

  function togglePause() {
    if (!started || game.getState().status === 'over') return;
    paused = !paused;
    pauseBtn.textContent = paused ? '继续' : '暂停';
    setTip(
      paused
        ? '已暂停 · 点继续'
        : isTouch
          ? '滑动屏幕控制方向 · 暂停按钮可暂停'
          : '方向键控制 · 空格暂停 · R 重新开始'
    );
    draw();
  }

  function restart() {
    game.reset();
    started = false;
    paused = false;
    pauseBtn.textContent = '暂停';
    setTip(isTouch ? '滑动屏幕控制方向 · 点“方向键”可弹出按键' : '按方向键或点击开始');
    updateUi();
    draw();
  }

  function toggleDpad() {
    var show = dpad.hidden;
    dpad.hidden = !show;
    dpadBtn.textContent = show ? '收起方向键' : '方向键';
  }

  function setDpadOpen(open) {
    dpad.classList.toggle('dpad--open', open);
    dpad.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (actionsEl) actionsEl.hidden = open;
  }

  function toggleDpad() {
    setDpadOpen(!dpad.classList.contains('dpad--open'));
  }

  function handleDirection(dir) {
    if (!started && game.getState().status !== 'over') start();
    game.setDirection(dir);
  }

  var KEYMAP = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
  };

  document.addEventListener('keydown', function (e) {
    if (KEYMAP[e.code]) {
      e.preventDefault();
      handleDirection(KEYMAP[e.code]);
    } else if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
    } else if (e.code === 'KeyR') {
      restart();
    }
  });

  /* 触控：画布滑动控制方向（优先于按键） */
  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', function (e) {
    if (!touchStart) return;
    e.preventDefault();
    var t = e.touches[0];
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
    handleDirection(
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
    );
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', function () {
    touchStart = null;
  }, { passive: true });

  /* 触控：可弹出的方向键 */
  dpadBtn.addEventListener('click', toggleDpad);
  dpad.querySelectorAll('.dpad__btn[data-dir]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      handleDirection(btn.getAttribute('data-dir'));
    });
  });

  var dpadBack = document.getElementById('dpadBack');
  if (dpadBack) {
    dpadBack.addEventListener('click', function () {
      setDpadOpen(false);
    });
  }

  startBtn.addEventListener('click', function () {
    if (game.getState().status === 'over') restart();
    start();
  });

  pauseBtn.addEventListener('click', togglePause);
  restartBtn.addEventListener('click', restart);

  if (isTouch) setTip('滑动屏幕控制方向 · 点“方向键”可弹出按键');

  resizeCanvas();
  updateUi();
  draw();
  setInterval(step, game.getState().speed);
})();
