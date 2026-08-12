/**
 * shared/storage.js —— 本地记录工具（最高分等）
 * 浏览器中以全局 StorageUtil 使用，Node 中以 CommonJS 引入。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StorageUtil = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getDefaultBackend() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    return null;
  }

  function createStorage(backend) {
    const store = backend || getDefaultBackend();
    return {
      getBest(key) {
        if (!store) return 0;
        const value = store.getItem(key);
        const num = parseInt(value, 10);
        return Number.isFinite(num) ? num : 0;
      },
      setBest(key, score) {
        if (store) store.setItem(key, String(score));
      },
    };
  }

  return { createStorage };
});
