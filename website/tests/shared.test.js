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

test('navigation：identifyPage 按 URL 识别页面层级', () => {
  assert.equal(navigationModule.util.identifyPage({ pathname: '/text/' }), 'home');
  assert.equal(navigationModule.util.identifyPage({ pathname: '/text/index.html' }), 'home');
  assert.equal(navigationModule.util.identifyPage({ pathname: '/text/src/games/snake/index.html' }), 'detail');
  assert.equal(navigationModule.util.identifyPage({ pathname: '/text/src/games/snake/play.html' }), 'play');
});

test('navigation：normalizePath 追加新页并截断旧页', () => {
  assert.deepEqual(navigationModule.util.normalizePath(['home', 'detail'], 'play'), ['home', 'detail', 'play']);
  assert.deepEqual(navigationModule.util.normalizePath(['home', 'detail', 'play'], 'detail'), ['home', 'detail']);
  assert.deepEqual(navigationModule.util.normalizePath(['home', 'detail', 'play'], 'home'), ['home']);
  assert.deepEqual(navigationModule.util.normalizePath([], 'detail'), ['detail']);
});

test('navigation：normalizePath 修正乱序路径（直达后前跳）', () => {
  assert.deepEqual(navigationModule.util.normalizePath(['play'], 'detail'), ['detail']);
  assert.deepEqual(navigationModule.util.normalizePath(['detail', 'home'], 'home'), ['home']);
});

function fakeSession(initialPath) {
  const store = {};
  const session = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
  };
  if (initialPath) session.setItem('nav.path', JSON.stringify(initialPath));
  return session;
}

test('navigation：back 弹栈并调用 history.back', () => {
  const session = fakeSession(['home', 'detail', 'play']);
  const target = {
    pathname: '/text/src/games/snake/play.html',
    backed: 0,
    back() {
      this.backed += 1;
    },
  };
  navigationModule.util.back('index.html', target, session);
  assert.equal(target.backed, 1);
  assert.deepEqual(JSON.parse(session.getItem('nav.path')), ['home', 'detail']);
});

test('navigation：back 直达兜底用 replace 不新增历史', () => {
  const session = fakeSession(['detail']);
  const target = {
    pathname: '/text/src/games/snake/index.html',
    replaced: [],
    replace(url) {
      this.replaced.push(url);
    },
  };
  navigationModule.util.back('../../../index.html', target, session);
  assert.deepEqual(target.replaced, ['../../../index.html']);
  assert.deepEqual(JSON.parse(session.getItem('nav.path')), ['detail']);
});

test('navigation：home 按路径位置一次退到根', () => {
  const session = fakeSession(['home', 'detail', 'play']);
  const target = {
    pathname: '/text/src/games/snake/play.html',
    history: {
      went: null,
      go(delta) {
        this.went = delta;
      },
    },
  };
  navigationModule.util.home('../../../index.html', target, session);
  assert.equal(target.history.went, -2);
});

test('navigation：home 直达兜底 replace', () => {
  const session = fakeSession(['play']);
  const target = {
    pathname: '/text/src/games/snake/play.html',
    replaced: [],
    replace(url) {
      this.replaced.push(url);
    },
  };
  navigationModule.util.home('../../../index.html', target, session);
  assert.deepEqual(target.replaced, ['../../../index.html']);
});

test('navigation：track 同源追加、直达重置', () => {
  const session = fakeSession(['home', 'detail']);
  navigationModule.track(
    { pathname: '/text/src/games/snake/play.html', origin: 'http://x' },
    'http://x/text/src/games/snake/index.html',
    session
  );
  assert.deepEqual(JSON.parse(session.getItem('nav.path')), ['home', 'detail', 'play']);
  navigationModule.track(
    { pathname: '/text/src/games/snake/play.html', origin: 'http://x' },
    '',
    session
  );
  assert.deepEqual(JSON.parse(session.getItem('nav.path')), ['play']);
});
