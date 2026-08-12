const { test } = require('node:test');
const assert = require('node:assert/strict');
const SnakeCore = require('../src/games/snake/core.js');

const { createGame } = SnakeCore;

test('初始状态：蛇长3、方向右、分数0、状态ready、食物不在蛇身上', () => {
  const game = createGame({ cols: 15, rows: 15 });
  const s = game.getState();
  assert.equal(s.snake.length, 3);
  assert.equal(s.direction, 'right');
  assert.equal(s.score, 0);
  assert.equal(s.status, 'ready');
  assert.ok(s.food, '应生成食物');
  assert.ok(
    !s.snake.some((seg) => seg.x === s.food.x && seg.y === s.food.y),
    '食物不能出现在蛇身上'
  );
});

test('step 后蛇头前进一格，状态变为 running', () => {
  const game = createGame({ cols: 15, rows: 15 });
  const before = game.getState().snake[0];
  const result = game.step();
  const after = game.getState();
  assert.equal(result.over, false);
  assert.equal(after.status, 'running');
  assert.equal(after.snake[0].x, before.x + 1);
  assert.equal(after.snake[0].y, before.y);
});

test('setDirection up 后蛇头向上移动', () => {
  const game = createGame({ cols: 15, rows: 15 });
  game.setDirection('up');
  const before = game.getState().snake[0];
  game.step();
  const after = game.getState();
  assert.equal(after.snake[0].x, before.x);
  assert.equal(after.snake[0].y, before.y - 1);
});

test('禁止直接反向：向右时不能向左', () => {
  const game = createGame({ cols: 15, rows: 15 });
  game.setDirection('left');
  assert.equal(game.getState().direction, 'right');
  game.step();
  const s = game.getState();
  assert.equal(s.snake[0].x, 8);
  assert.equal(s.snake[0].y, 7);
});

test('吃到食物：分数+1、蛇长+1、生成新食物', () => {
  const game = createGame({ cols: 15, rows: 15, food: { x: 8, y: 7 } });
  const result = game.step();
  const s = game.getState();
  assert.equal(result.ate, true);
  assert.equal(s.score, 1);
  assert.equal(s.snake.length, 4);
  assert.ok(s.food, '吃后应生成新食物');
});

test('撞墙结束：蛇头撞到右边界后游戏结束', () => {
  const game = createGame({ cols: 10, rows: 10, food: { x: 1, y: 8 } });
  let result = { over: false };
  for (let i = 0; i < 5; i++) result = game.step();
  assert.equal(result.over, true);
  assert.equal(game.getState().status, 'over');
});

test('撞到自己结束：蛇头撞向颈部', () => {
  const snake = [
    { x: 2, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
  ];
  const game = createGame({
    cols: 10,
    rows: 10,
    snake,
    direction: 'down',
    food: { x: 9, y: 9 },
  });
  game.setDirection('left');
  const result = game.step();
  assert.equal(result.over, true);
  assert.equal(game.getState().status, 'over');
});

test('难度对应速度：easy 220 / normal 150 / hard 100', () => {
  assert.equal(createGame({ difficulty: 'easy' }).getState().speed, 220);
  assert.equal(createGame({ difficulty: 'normal' }).getState().speed, 150);
  assert.equal(createGame({ difficulty: 'hard' }).getState().speed, 100);
});

test('reset 恢复到初始状态', () => {
  const game = createGame({ cols: 10, rows: 10 });
  game.step();
  game.setDirection('up');
  game.step();
  game.reset();
  const s = game.getState();
  assert.equal(s.snake.length, 3);
  assert.equal(s.score, 0);
  assert.equal(s.status, 'ready');
  assert.equal(s.direction, 'right');
});
