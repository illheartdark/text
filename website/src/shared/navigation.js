/**
 * shared/navigation.js —— 页面跳转管理
 * 浏览器中以全局 Navigation 使用，Node 中以 CommonJS 引入。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Navigation = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function createNavigator(target) {
    const location = target || (typeof window !== 'undefined' ? window.location : null);
    return {
      go(path) {
        if (location) location.assign(path);
      },
      goBack() {
        if (location) location.back();
      },
    };
  }

  return { createNavigator };
});
