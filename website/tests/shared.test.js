const { test } = require('node:test');
const assert = require('node:assert/strict');
const storageModule = require('../src/shared/storage.js');
const navigationModule = require('../src/shared/navigation.js');

test('storage：写入后可读出最高分，类型为数字', () => {
  const store = {};
  const backend = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
  };
  const storage = storageModule.createStorage(backend);
  storage.setBest('snake.best', 12);
  assert.equal(storage.getBest('snake.best'), 12);
});

test('storage：无记录或内容非法时最高分返回 0', () => {
  const empty = storageModule.createStorage({
    getItem() {
      return null;
    },
    setItem() {},
  });
  assert.equal(empty.getBest('snake.best'), 0);

  const bad = storageModule.createStorage({
    getItem() {
      return 'abc';
    },
    setItem() {},
  });
  assert.equal(bad.getBest('snake.best'), 0);
});

test('navigation：go 跳转到指定路径，goBack 返回上一页', () => {
  const target = {
    assigned: [],
    backed: 0,
    assign(path) {
      this.assigned.push(path);
    },
    back() {
      this.backed += 1;
    },
  };
  const navigation = navigationModule.createNavigator(target);
  navigation.go('src/games/snake/index.html');
  navigation.goBack();
  assert.deepEqual(target.assigned, ['src/games/snake/index.html']);
  assert.equal(target.backed, 1);
});
