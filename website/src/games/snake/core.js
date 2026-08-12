/**
 * snake/core.js —— 贪吃蛇纯逻辑（不依赖页面）
 * 浏览器中以全局 SnakeCore 使用，Node 中以 CommonJS 引入。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SnakeCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DIFFICULTY = {
    easy: { speed: 220, cols: 15, rows: 15 },
    normal: { speed: 150, cols: 17, rows: 17 },
    hard: { speed: 100, cols: 20, rows: 20 },
  };

  const DIRECTION = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  function createGame(options) {
    options = options || {};
    const preset = DIFFICULTY[options.difficulty] || DIFFICULTY.normal;
    const cols = options.cols || preset.cols;
    const rows = options.rows || preset.rows;
    const speed = preset.speed;

    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    const initialSnake = options.snake
      ? options.snake.map((s) => ({ x: s.x, y: s.y }))
      : [
          { x: startX, y: startY },
          { x: startX - 1, y: startY },
          { x: startX - 2, y: startY },
        ];
    const initialDirection = options.direction || 'right';

    let snake = initialSnake.map((s) => ({ x: s.x, y: s.y }));
    let direction = DIRECTION[initialDirection];
    let pending = direction;
    let directionName = initialDirection;
    let score = 0;
    let status = 'ready';
    let food = null;

    function onSnake(x, y) {
      return snake.some((seg) => seg.x === x && seg.y === y);
    }

    function spawnFood() {
      const cells = [];
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          if (!onSnake(x, y)) cells.push({ x, y });
        }
      }
      if (cells.length === 0) return null;
      return cells[Math.floor(Math.random() * cells.length)];
    }

    function reset() {
      snake = initialSnake.map((s) => ({ x: s.x, y: s.y }));
      direction = DIRECTION[initialDirection];
      pending = direction;
      directionName = initialDirection;
      score = 0;
      status = 'ready';
      food = spawnFood();
    }

    function getState() {
      return {
        snake: snake.map((s) => ({ x: s.x, y: s.y })),
        direction: directionName,
        food: food ? { x: food.x, y: food.y } : null,
        score,
        status,
        speed,
        cols,
        rows,
      };
    }

    function setDirection(name) {
      const d = DIRECTION[name];
      if (!d) return;
      if (d.x === -direction.x && d.y === -direction.y) return;
      pending = d;
      directionName = name;
    }

    function step() {
      if (status === 'over') return { ate: false, over: true };
      direction = pending;
      const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y,
      };

      if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        status = 'over';
        return { ate: false, over: true };
      }

      const eating = food !== null && head.x === food.x && head.y === food.y;
      const bodyToCheck = eating ? snake : snake.slice(0, -1);
      if (bodyToCheck.some((seg) => seg.x === head.x && seg.y === head.y)) {
        status = 'over';
        return { ate: false, over: true };
      }

      snake.unshift(head);
      if (eating) {
        score += 1;
        food = spawnFood();
      } else {
        snake.pop();
      }
      status = 'running';
      return { ate: eating, over: false };
    }

    food = options.food ? { x: options.food.x, y: options.food.y } : spawnFood();

    return {
      getState,
      setDirection,
      step,
      reset,
    };
  }

  return {
    createGame,
    DIFFICULTY,
  };
});
