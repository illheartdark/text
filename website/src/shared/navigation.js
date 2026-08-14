/**
 * shared/navigation.js —— 页面跳转管理（含层级化返回导航）
 * 浏览器中以全局 Navigation 使用，Node 中以 CommonJS 引入。
 *
 * 层级化返回原理：
 * - sessionStorage["nav.path"] 保存站内层级路径（如 ["home","detail","play"]）；
 * - 页面加载时 track() 自动维护路径（同源进入追加/截断，直达/异源重置）；
 * - back(parentUrl)：路径 ≥ 2 级时弹出路径末尾并 history.back()，否则 replace 兜底（不新增历史）；
 * - home(homeUrl)：按当前页在路径中的位置一次 history.go(-位置) 退到根，否则 replace 兜底；
 * - a[data-nav="back|home"] 自动绑定返回/首页链接，href 保留作为无脚本环境兜底。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Navigation = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PATH_KEY = 'nav.path';
  var PAGE_ORDER = { home: 0, detail: 1, play: 2 };

  /* ---------- 工具 ---------- */
  function defaultLocation() {
    return typeof window !== 'undefined' ? window.location : null;
  }

  function getSession() {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return null;
      return window.sessionStorage;
    } catch (e) {
      return null;
    }
  }

  function readPath(session) {
    var s = session || getSession();
    if (!s) return [];
    try {
      var raw = JSON.parse(s.getItem(PATH_KEY));
      if (Array.isArray(raw)) return raw.filter(function (p) { return typeof p === 'string'; });
    } catch (e) {}
    return [];
  }

  function writePath(path, session) {
    var s = session || getSession();
    if (!s) return;
    try {
      s.setItem(PATH_KEY, JSON.stringify(path));
    } catch (e) {}
  }

  function getHistory(location) {
    if (location && location.history) return location.history;
    return typeof window !== 'undefined' ? window.history : null;
  }

  /** 按 URL 识别页面层级：play / detail / home */
  function identifyPage(location) {
    var pathname = (location && location.pathname) || '';
    if (/play\.html$/.test(pathname)) return 'play';
    if (/src\/games\/[^/]+\/index\.html$/.test(pathname)) return 'detail';
    return 'home';
  }

  /**
   * 路径规整：末尾必须是 current；current 已在路径中则截断到它；
   * 追加时丢弃层级不低于当前页的旧记录（直达后前跳等边界场景）。
   */
  function normalizePath(path, current) {
    var idx = path.lastIndexOf(current);
    var base = idx >= 0 ? path.slice(0, idx + 1) : path.concat(current);
    var currentOrder = PAGE_ORDER[current] !== undefined ? PAGE_ORDER[current] : 99;
    var out = [];
    base.forEach(function (p, i) {
      var order = PAGE_ORDER[p];
      if (order === undefined) return;
      if (p === current && i === base.length - 1) {
        out.push(p);
        return;
      }
      if (order >= currentOrder) return;
      var prev = out.length ? PAGE_ORDER[out[out.length - 1]] : -1;
      if (order > prev) out.push(p);
    });
    if (out[out.length - 1] !== current) out.push(current);
    return out;
  }

  function sameOrigin(referrer, location) {
    if (!referrer) return false;
    try {
      return referrer.indexOf(location.origin) === 0;
    } catch (e) {
      return false;
    }
  }

  /** 页面加载时维护层级路径（浏览器中自动调用） */
  function track(location, referrer, session) {
    var loc = location || defaultLocation();
    if (!loc) return [];
    if (typeof referrer === 'undefined') {
      referrer = (typeof document !== 'undefined' && document.referrer) || '';
    }
    var current = identifyPage(loc);
    var path = sameOrigin(referrer, loc) ? normalizePath(readPath(session), current) : [current];
    writePath(path, session);
    return path;
  }

  /* ---------- 跳转接口 ---------- */
  function go(path, location) {
    var loc = location || defaultLocation();
    if (loc) loc.assign(path);
  }

  function goBack(location) {
    var loc = location || defaultLocation();
    if (!loc) return;
    if (typeof loc.back === 'function') loc.back();
    else {
      var hist = getHistory(loc);
      if (hist && typeof hist.back === 'function') hist.back();
    }
  }

  /** 返回上一级：路径 ≥ 2 级时弹栈 + 回退；直达/刷新场景 replace 兜底（不新增历史） */
  function back(parentUrl, location, session) {
    var loc = location || defaultLocation();
    if (!loc) return;
    var path = normalizePath(readPath(session), identifyPage(loc));
    if (path.length >= 2) {
      writePath(path.slice(0, path.length - 1), session);
      if (typeof loc.back === 'function') {
        loc.back();
      } else {
        var hist = getHistory(loc);
        if (hist && typeof hist.back === 'function') hist.back();
      }
    } else {
      writePath(path, session);
      if (typeof loc.replace === 'function') loc.replace(parentUrl);
      else loc.href = parentUrl;
    }
  }

  /** 回到首页：按路径位置一次退到根；否则 replace 兜底 */
  function home(homeUrl, location, session) {
    var loc = location || defaultLocation();
    if (!loc) return;
    var path = normalizePath(readPath(session), identifyPage(loc));
    writePath(path, session);
    var pos = path.indexOf(identifyPage(loc));
    if (pos > 0) {
      var hist = getHistory(loc);
      if (hist && typeof hist.go === 'function') {
        hist.go(-pos);
      } else if (typeof loc.go === 'function') {
        loc.go(-pos);
      } else if (typeof loc.assign === 'function') {
        loc.assign(homeUrl);
      }
    } else {
      if (typeof loc.replace === 'function') loc.replace(homeUrl);
      else loc.href = homeUrl;
    }
  }

  function createNavigator(target) {
    var location = target || defaultLocation();
    return {
      go: function (path) { go(path, location); },
      goBack: function () { goBack(location); },
      back: function (parentUrl) { back(parentUrl, location, null); },
      home: function (homeUrl) { home(homeUrl, location, null); },
    };
  }

  /* ---------- 返回链接自动绑定（a[data-nav]） ---------- */
  function bindAnchors() {
    if (typeof document === 'undefined') return;
    var nav = createNavigator();
    document.querySelectorAll('a[data-nav]').forEach(function (a) {
      var kind = a.getAttribute('data-nav');
      var url = a.getAttribute('href');
      if (!url) return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (kind === 'home') nav.home(url);
        else nav.back(url);
      });
    });
  }

  /* ---------- 自动初始化 ---------- */
  function autoInit() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    track();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindAnchors);
    } else {
      bindAnchors();
    }
  }

  autoInit();

  return {
    createNavigator: createNavigator,
    track: track,
    bindAnchors: bindAnchors,
    util: {
      identifyPage: identifyPage,
      normalizePath: normalizePath,
      back: back,
      home: home,
    },
  };
});
