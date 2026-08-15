/**
 * tests/settings.test.js —— 设置核心纯函数测试（UMD 导出 util）
 * 运行：node --test "website/tests/*.test.js"
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const SettingsApp = require('../settings/settings.js');

const util = SettingsApp.util;

test('normalizeCrop 将 scale 限制在 1-4', () => {
  assert.deepStrictEqual(util.normalizeCrop({ x: 0, y: 0, scale: 0.5 }), { x: 0, y: 0, scale: 1 });
  assert.deepStrictEqual(util.normalizeCrop({ x: 0, y: 0, scale: 9 }), { x: 0, y: 0, scale: 4 });
});

test('normalizeCrop 将平移限制在 ±(scale-1)/2', () => {
  const c = util.normalizeCrop({ x: 5, y: -5, scale: 2 });
  assert.strictEqual(c.x, 0.5);
  assert.strictEqual(c.y, -0.5);
  assert.strictEqual(c.scale, 2);
});

test('normalizeCrop 容忍缺失或非法字段', () => {
  assert.deepStrictEqual(util.normalizeCrop(null), { x: 0, y: 0, scale: 1 });
  assert.deepStrictEqual(util.normalizeCrop({}), { x: 0, y: 0, scale: 1 });
  assert.deepStrictEqual(util.normalizeCrop({ x: 'a', y: NaN, scale: '2' }), { x: 0, y: 0, scale: 1 });
});

test('cropKey 按主题 × 设备拼接持久化键', () => {
  assert.strictEqual(util.cropKey('aurora', 'phone'), 'settings.crop.aurora.phone');
  assert.strictEqual(util.cropKey('glass', 'desktop'), 'settings.crop.glass.desktop');
});

test('parseStoredTheme 只接受含合法 id 的对象', () => {
  assert.deepStrictEqual(util.parseStoredTheme('{"id":"aurora","device":"phone"}'), {
    id: 'aurora',
    device: 'phone',
  });
  assert.strictEqual(util.parseStoredTheme('not-json'), null);
  assert.strictEqual(util.parseStoredTheme('{"id":""}'), null);
  assert.strictEqual(util.parseStoredTheme(null), null);
});

test('无本地存储时 getSavedTheme 返回默认玻璃主题', () => {
  const t = util.getSavedTheme();
  assert.strictEqual(t.id, 'glass');
  assert.ok(t.device === 'phone' || t.device === 'desktop');
});

function fakeAccountStore(initial) {
  const store = {};
  if (initial) store['settings.account'] = JSON.stringify(initial);
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

test('MockProvider：未登录 getAccount 返回 null', async () => {
  const provider = util.createMockAccountProvider(fakeAccountStore());
  assert.strictEqual(await provider.getAccount(), null);
});

test('MockProvider：00001/00001 登录成功并持久化', async () => {
  const store = fakeAccountStore();
  const provider = util.createMockAccountProvider(store);
  const account = await provider.login({ id: '00001', password: '00001' });
  assert.deepEqual(account, { id: '00001', name: '内测版' });
  assert.deepEqual(await provider.getAccount(), { id: '00001', name: '内测版' });
  assert.ok(store.getItem('settings.account'));
});

test('MockProvider：错误账号密码登录失败', async () => {
  const store = fakeAccountStore();
  const provider = util.createMockAccountProvider(store);
  await assert.rejects(provider.login({ id: '00001', password: 'wrong' }), /账号或密码错误/);
  assert.strictEqual(await provider.getAccount(), null);
});

test('MockProvider：登出清除并通知订阅者', async () => {
  const store = fakeAccountStore({ id: '00001', name: '内测版' });
  const provider = util.createMockAccountProvider(store);
  let notified = null;
  provider.subscribe((acc) => {
    notified = acc;
  });
  await provider.logout();
  assert.strictEqual(notified, null);
  assert.strictEqual(await provider.getAccount(), null);
});
