/**
 * settings/settings.js —— 设置核心
 * 浏览器全局 SettingsApp（UMD，Node 可 require 测试纯函数）。
 * 职责：
 *   1. 全站主题应用：按 localStorage 保存的「主题 × 设备」在页面加载时复现；
 *   2. 首页设置面板：树形层级导航（设置 → 账户/主题 → 主题列表 → 调整画面）、
 *      主题注册表加载与「识别本地文件」、壁纸式框选调整与预览、持久化。
 * 使用前必须在页面声明 window.THEMES_BASE（首页 "themes/"；src 下页面 "../../themes/"）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SettingsApp = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ================= 常量 ================= */
  var THEME_KEY = 'settings.theme';
  var CROP_PREFIX = 'settings.crop.';
  var DEFAULT_ID = 'glass';
  var MAX_SCALE = 4;
  var ACCOUNT_KEY = 'settings.account';
  var TEST_ACCOUNT = { id: '00001', password: '00001', name: '内测版' };

  /* ================= 基础工具 ================= */
  function getBase() {
    return (typeof window !== 'undefined' && window.THEMES_BASE) || 'themes/';
  }

  function getStore() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  function detectDevice() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'desktop';
    var coarse = false;
    try {
      coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    } catch (e) {
      coarse = false;
    }
    var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var narrow = window.innerWidth < 768;
    return coarse || touch || narrow ? 'phone' : 'desktop';
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function isObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  /* ================= 持久化 ================= */
  function parseStoredTheme(raw) {
    if (!raw) return null;
    try {
      var d = JSON.parse(raw);
      if (isObject(d) && typeof d.id === 'string' && d.id) return d;
    } catch (e) {}
    return null;
  }

  function getSavedTheme() {
    var store = getStore();
    var t = parseStoredTheme(store ? store.getItem(THEME_KEY) : null);
    if (t) return t;
    return { id: DEFAULT_ID, device: detectDevice() };
  }

  function saveTheme(id, device) {
    var store = getStore();
    if (!store) return;
    try {
      store.setItem(THEME_KEY, JSON.stringify({ id: id, device: device }));
    } catch (e) {}
  }

  function cropKey(id, device) {
    return CROP_PREFIX + id + '.' + device;
  }

  function normalizeCrop(c) {
    var src = isObject(c) ? c : {};
    var scale = clamp(
      typeof src.scale === 'number' && isFinite(src.scale) ? src.scale : 1,
      1,
      MAX_SCALE
    );
    var limit = (scale - 1) / 2;
    var x = clamp(typeof src.x === 'number' && isFinite(src.x) ? src.x : 0, -limit, limit);
    var y = clamp(typeof src.y === 'number' && isFinite(src.y) ? src.y : 0, -limit, limit);
    return { x: x, y: y, scale: scale };
  }

  function getSavedCrop(id, device) {
    var fallback = { x: 0, y: 0, scale: 1 };
    var store = getStore();
    if (!store) return fallback;
    try {
      var raw = store.getItem(cropKey(id, device));
      if (raw) return normalizeCrop(JSON.parse(raw));
    } catch (e) {}
    return fallback;
  }

  function saveCrop(id, device, crop) {
    var store = getStore();
    if (!store) return;
    try {
      store.setItem(cropKey(id, device), JSON.stringify(normalizeCrop(crop)));
    } catch (e) {}
  }

  /* ================= 账户数据源（Account Provider 接口，为 App / 小程序预留） ================= */
  var mockAccountProvider = null;

  /**
   * 创建本地模拟登录 Provider（预置内测账号：00001 / 00001，昵称「内测版」）。
   * 接口：getAccount() / login({id,password}) / logout() / subscribe(fn)。
   * store 可注入（Node 测试用假 store），默认使用 localStorage。
   */
  function createMockAccountProvider(store) {
    var s = store || getStore();
    var listeners = [];

    function readAccount() {
      if (!s) return null;
      try {
        var raw = s.getItem(ACCOUNT_KEY);
        if (raw) {
          var d = JSON.parse(raw);
          if (d && typeof d.id === 'string' && d.id) {
            return { id: d.id, name: typeof d.name === 'string' && d.name ? d.name : d.id };
          }
        }
      } catch (e) {}
      return null;
    }

    function notify(account) {
      listeners.slice().forEach(function (fn) {
        try { fn(account); } catch (e) {}
      });
    }

    return {
      getAccount: function () {
        return Promise.resolve(readAccount());
      },
      login: function (credentials) {
        return new Promise(function (resolve, reject) {
          var c = isObject(credentials) ? credentials : {};
          if (c.id !== TEST_ACCOUNT.id || c.password !== TEST_ACCOUNT.password) {
            reject(new Error('账号或密码错误'));
            return;
          }
          var account = { id: TEST_ACCOUNT.id, name: TEST_ACCOUNT.name };
          if (s) {
            try { s.setItem(ACCOUNT_KEY, JSON.stringify(account)); } catch (e) {}
          }
          notify(account);
          resolve(account);
        });
      },
      logout: function () {
        return new Promise(function (resolve) {
          if (s) {
            try { s.removeItem(ACCOUNT_KEY); } catch (e) {}
          }
          notify(null);
          resolve();
        });
      },
      subscribe: function (fn) {
        listeners.push(fn);
        return function () {
          var i = listeners.indexOf(fn);
          if (i >= 0) listeners.splice(i, 1);
        };
      },
    };
  }

  /** 优先使用外部注入的 Provider（App / 小程序桥接点），否则用内置 Mock */
  function getAccountProvider() {
    if (typeof window !== 'undefined' && window.AccountProvider) return window.AccountProvider;
    if (!mockAccountProvider) mockAccountProvider = createMockAccountProvider();
    return mockAccountProvider;
  }

  /* ================= 主题应用（全站） ================= */
  function applyCropTransform(el, crop) {
    var c = normalizeCrop(crop);
    el.style.transform =
      'translate(calc(-100% * ' + c.x + '), calc(-100% * ' + c.y + ')) scale(' + c.scale + ')';
  }

  function ensureThemeBg() {
    var bg = document.getElementById('themeBg');
    if (bg) return bg;
    bg = document.createElement('img');
    bg.id = 'themeBg';
    bg.className = 'theme-bg';
    bg.alt = '';
    bg.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bg);
    return bg;
  }

  function clearTheme() {
    var html = document.documentElement;
    var applied = html.getAttribute('data-theme-vars');
    if (applied) {
      applied.split(' ').forEach(function (k) {
        if (k) html.style.removeProperty(k);
      });
    }
    html.removeAttribute('data-theme-vars');
    html.setAttribute('data-theme', DEFAULT_ID);
    document.body.classList.remove('theme--image');
    var bg = document.getElementById('themeBg');
    if (bg && bg.parentNode) bg.parentNode.removeChild(bg);
  }

  function setCssVars(html, vars) {
    Object.keys(vars).forEach(function (k) {
      var v = vars[k];
      if (v !== null && v !== undefined && v !== '') html.style.setProperty(k, v);
    });
  }

  function applyThemeMeta(id, device, crop, meta) {
    var html = document.documentElement;
    var vars = isObject(meta.cssVars) ? meta.cssVars : {};
    var entry =
      device === 'phone' && isObject(meta.mobile)
        ? meta.mobile
        : isObject(meta.desktop)
          ? meta.desktop
          : null;
    var image = entry && entry.image ? String(entry.image) : null;

    clearTheme();
    if (Object.keys(vars).length) {
      setCssVars(html, vars);
      html.setAttribute('data-theme-vars', Object.keys(vars).join(' '));
    }
    html.setAttribute('data-theme', id);
    if (!image) return;

    var bg = ensureThemeBg();
    bg.onload = function () {
      document.body.classList.add('theme--image');
      applyCropTransform(bg, crop || getSavedCrop(id, device));
    };
    bg.onerror = function () {
      html.setAttribute('data-theme', DEFAULT_ID);
      document.body.classList.remove('theme--image');
      var bgEl = document.getElementById('themeBg');
      if (bgEl && bgEl.parentNode) bgEl.parentNode.removeChild(bgEl);
    };
    bg.src = getBase() + encodeURIComponent(id) + '/' + image;
  }

  function applyTheme(id, device, crop) {
    if (!id || id === DEFAULT_ID) {
      clearTheme();
      return;
    }
    var base = getBase();
    fetch(base + encodeURIComponent(id) + '/theme.json')
      .then(function (r) {
        if (!r.ok) throw new Error('theme.json ' + r.status);
        return r.json();
      })
      .then(function (meta) {
        applyThemeMeta(id, device, crop, meta);
      })
      .catch(function () {
        clearTheme();
      });
  }

  /* ================= 主题列表加载 ================= */
  function probeImage(src) {
    return new Promise(function (resolve) {
      if (typeof Image === 'undefined') {
        resolve(false);
        return;
      }
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  function buildThemeItem(id, meta) {
    if (!isObject(meta) || meta.id !== id || typeof meta.name !== 'string') {
      return Promise.resolve({
        id: id,
        name: '（无效主题）',
        status: 'error',
        meta: null,
        device: null,
        hasImage: false,
        preview: null,
      });
    }
    var device = detectDevice();
    var entry =
      device === 'phone' && isObject(meta.mobile)
        ? meta.mobile
        : isObject(meta.desktop)
          ? meta.desktop
          : null;
    var image = entry && entry.image ? String(entry.image) : null;
    var item = {
      id: id,
      name: meta.name,
      meta: meta,
      device: device,
      hasImage: !!image,
      preview: meta.preview ? String(meta.preview) : null,
      status: 'ok',
    };
    if (!image) return Promise.resolve(item);
    return probeImage(getBase() + encodeURIComponent(id) + '/' + image).then(function (ok) {
      item.status = ok ? 'ok' : 'warn';
      return item;
    });
  }

  function loadThemes() {
    var base = getBase();
    return fetch(base + 'index.json')
      .then(function (r) {
        if (!r.ok) throw new Error('index.json ' + r.status);
        return r.json();
      })
      .then(function (ids) {
        if (!Array.isArray(ids)) throw new Error('index.json 需为数组');
        return Promise.all(
          ids.map(function (id) {
            return fetch(base + encodeURIComponent(id) + '/theme.json')
              .then(function (r) {
                if (!r.ok) return null;
                return r.json();
              })
              .then(function (meta) {
                return buildThemeItem(id, meta);
              });
          })
        );
      })
      .then(function (list) {
        themesCache = list;
        return list;
      })
      .catch(function () {
        themesCache = [];
        return themesCache;
      });
  }

  /* ================= 设置面板（仅首页） ================= */
  var mask = null;
  var panel = null;
  var panelBody = null;
  var panelTitle = null;
  var backBtn = null;
  var pageStack = [];
  var themesCache = null;
  var accountState = null;
  var accountProvider = null;
  var accountSheet = null;
  var accountSheetMask = null;
  var accountSheetBody = null;

  var BLOCKS = [
    { id: 'account', title: '账户', icon: '👤' },
    { id: 'themes', title: '主题', icon: '🎨' },
  ];

  function buildPanel() {
    mask = document.createElement('div');
    mask.className = 'settings-mask';
    mask.id = 'settingsMask';
    mask.hidden = true;
    document.body.appendChild(mask);

    panel = document.createElement('div');
    panel.className = 'settings-panel';
    panel.id = 'settingsPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', '设置');
    panel.hidden = true;

    var header = document.createElement('header');
    header.className = 'settings-header';
    backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'settings-back';
    backBtn.textContent = '←';
    backBtn.setAttribute('aria-label', '返回');
    panelTitle = document.createElement('span');
    panelTitle.className = 'settings-title';
    panelTitle.textContent = '设置';
    var spacer = document.createElement('span');
    spacer.className = 'settings-header__spacer';
    spacer.setAttribute('aria-hidden', 'true');
    header.appendChild(backBtn);
    header.appendChild(panelTitle);
    header.appendChild(spacer);
    panel.appendChild(header);

    panelBody = document.createElement('div');
    panelBody.className = 'settings-body';
    panel.appendChild(panelBody);

    document.body.appendChild(panel);

    backBtn.addEventListener('click', goBack);
    mask.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (!panel || panel.hidden) return;
      if (e.key === 'Escape') closePanel();
    });
  }

  function openPanel() {
    if (!panel) buildPanel();
    pageStack = [];
    document.body.classList.add('settings-open');
    mask.hidden = false;
    panel.hidden = false;
    requestAnimationFrame(function () {
      mask.classList.add('is-open');
      panel.classList.add('is-open');
    });
    pushPage({ id: 'root', title: '设置', render: renderRoot });
  }

  function closePanel() {
    if (!panel) return;
    mask.classList.remove('is-open');
    panel.classList.remove('is-open');
    document.body.classList.remove('settings-open');
    window.setTimeout(function () {
      mask.hidden = true;
      panel.hidden = true;
    }, 240);
  }

  function pushPage(page) {
    pageStack.push(page);
    renderPage(page);
  }

  function goBack() {
    if (pageStack.length > 1) {
      pageStack.pop();
      renderPage(pageStack[pageStack.length - 1]);
    } else {
      closePanel();
    }
  }

  function renderPage(page) {
    panelTitle.textContent = page.title;
    panelBody.innerHTML = '';
    if (page.render) page.render(panelBody, page);
    panelBody.scrollTop = 0;
  }

  function renderRoot(body) {
    var list = document.createElement('div');
    list.className = 'settings-list';
    list.appendChild(renderAccountCard());
    BLOCKS.forEach(function (block) {
      if (block.id === 'account') return;
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'settings-row';
      var icon = document.createElement('span');
      icon.className = 'settings-row__icon';
      icon.textContent = block.icon;
      var name = document.createElement('span');
      name.className = 'settings-row__name';
      name.textContent = block.title;
      var arrow = document.createElement('span');
      arrow.className = 'settings-row__arrow';
      arrow.textContent = '›';
      row.appendChild(icon);
      row.appendChild(name);
      row.appendChild(arrow);
      row.addEventListener('click', function () {
        pushPage({
          id: block.id,
          title: block.title,
          render: renderThemes,
        });
      });
      list.appendChild(row);
    });
    body.appendChild(list);
  }

  /* ================= 账户卡片与浮层（手机底部弹出 / 电脑居中弹窗） ================= */
  function renderAccountCard() {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'account-card';
    var avatar = document.createElement('span');
    avatar.className = 'account-card__avatar';
    avatar.textContent = accountState && accountState.name ? accountState.name.charAt(0) : '未';
    var info = document.createElement('span');
    info.className = 'account-card__info';
    var name = document.createElement('span');
    name.className = 'account-card__name';
    name.textContent = accountState ? accountState.name : '未登录';
    var id = document.createElement('span');
    id.className = 'account-card__id';
    id.textContent = accountState ? 'ID ' + accountState.id : 'ID 未设置';
    info.appendChild(name);
    info.appendChild(id);
    var arrow = document.createElement('span');
    arrow.className = 'settings-row__arrow';
    arrow.textContent = '›';
    card.appendChild(avatar);
    card.appendChild(info);
    card.appendChild(arrow);
    card.addEventListener('click', openAccountSheet);
    return card;
  }

  function buildAccountSheet() {
    accountSheetMask = document.createElement('div');
    accountSheetMask.className = 'account-sheet-mask';
    accountSheetMask.hidden = true;
    document.body.appendChild(accountSheetMask);

    accountSheet = document.createElement('div');
    accountSheet.className = 'account-sheet';
    accountSheet.setAttribute('role', 'dialog');
    accountSheet.setAttribute('aria-modal', 'true');
    accountSheet.hidden = true;

    var head = document.createElement('div');
    head.className = 'account-sheet__head';
    var title = document.createElement('span');
    title.className = 'account-sheet__title';
    title.textContent = '账户';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'account-sheet__close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', '关闭');
    head.appendChild(title);
    head.appendChild(closeBtn);
    accountSheet.appendChild(head);

    accountSheetBody = document.createElement('div');
    accountSheetBody.className = 'account-sheet__body';
    accountSheet.appendChild(accountSheetBody);

    document.body.appendChild(accountSheet);

    closeBtn.addEventListener('click', closeAccountSheet);
    accountSheetMask.addEventListener('click', closeAccountSheet);
  }

  function openAccountSheet() {
    if (!accountSheet) buildAccountSheet();
    refreshAccountSheet();
    document.body.classList.add('settings-open');
    accountSheetMask.hidden = false;
    accountSheet.hidden = false;
    requestAnimationFrame(function () {
      accountSheetMask.classList.add('is-open');
      accountSheet.classList.add('is-open');
    });
  }

  function closeAccountSheet() {
    if (!accountSheet) return;
    accountSheetMask.classList.remove('is-open');
    accountSheet.classList.remove('is-open');
    document.body.classList.remove('settings-open');
    window.setTimeout(function () {
      accountSheetMask.hidden = true;
      accountSheet.hidden = true;
    }, 240);
  }

  function refreshAccountSheet() {
    if (!accountSheetBody) return;
    accountSheetBody.innerHTML = '';
    if (accountState) {
      var profile = document.createElement('div');
      profile.className = 'account-card account-card--static';
      var pv = document.createElement('span');
      pv.className = 'account-card__avatar';
      pv.textContent = accountState.name ? accountState.name.charAt(0) : '未';
      var pinfo = document.createElement('span');
      pinfo.className = 'account-card__info';
      var pname = document.createElement('span');
      pname.className = 'account-card__name';
      pname.textContent = accountState.name;
      var pid = document.createElement('span');
      pid.className = 'account-card__id';
      pid.textContent = 'ID ' + accountState.id;
      pinfo.appendChild(pname);
      pinfo.appendChild(pid);
      profile.appendChild(pv);
      profile.appendChild(pinfo);
      accountSheetBody.appendChild(profile);

      var logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'settings-btn account-logout';
      logoutBtn.textContent = '退出登录';
      logoutBtn.addEventListener('click', function () {
        accountProvider.logout();
      });
      accountSheetBody.appendChild(logoutBtn);
      return;
    }

    var hint = document.createElement('p');
    hint.className = 'account-hint';
    hint.textContent = '使用内测账号：登录ID 00001，密码 00001';
    accountSheetBody.appendChild(hint);

    var form = document.createElement('form');
    form.className = 'account-form';
    form.noValidate = true;

    var idField = document.createElement('label');
    idField.className = 'account-field';
    var idLabel = document.createElement('span');
    idLabel.textContent = '登录ID';
    var idInput = document.createElement('input');
    idInput.type = 'text';
    idInput.className = 'account-input';
    idInput.autocomplete = 'username';
    idInput.placeholder = '请输入登录ID';
    idField.appendChild(idLabel);
    idField.appendChild(idInput);

    var pwdField = document.createElement('label');
    pwdField.className = 'account-field';
    var pwdLabel = document.createElement('span');
    pwdLabel.textContent = '密码';
    var pwdInput = document.createElement('input');
    pwdInput.type = 'password';
    pwdInput.className = 'account-input';
    pwdInput.autocomplete = 'current-password';
    pwdInput.placeholder = '请输入密码';
    pwdField.appendChild(pwdLabel);
    pwdField.appendChild(pwdInput);

    var errEl = document.createElement('p');
    errEl.className = 'account-error';
    errEl.hidden = true;

    var submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'settings-btn account-submit';
    submit.textContent = '登录';

    form.appendChild(idField);
    form.appendChild(pwdField);
    form.appendChild(errEl);
    form.appendChild(submit);
    accountSheetBody.appendChild(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errEl.hidden = true;
      submit.disabled = true;
      submit.textContent = '登录中…';
      accountProvider.login({ id: idInput.value.trim(), password: pwdInput.value })
        .then(function () { /* 登录成功后由订阅回调刷新浮层 */ })
        .catch(function (err) {
          errEl.textContent = err && err.message ? err.message : '登录失败';
          errEl.hidden = false;
          submit.disabled = false;
          submit.textContent = '登录';
        });
    });
  }

  function initAccount() {
    accountProvider = getAccountProvider();
    accountProvider.getAccount().then(function (acc) {
      accountState = acc;
      if (panel && !panel.hidden && pageStack.length) renderPage(pageStack[pageStack.length - 1]);
      if (accountSheet && !accountSheet.hidden) refreshAccountSheet();
    });
    accountProvider.subscribe(function (acc) {
      accountState = acc;
      if (panel && !panel.hidden && pageStack.length) renderPage(pageStack[pageStack.length - 1]);
      if (accountSheet && !accountSheet.hidden) refreshAccountSheet();
    });
  }


  function renderThemes(body) {
    var toolbar = document.createElement('div');
    toolbar.className = 'settings-toolbar';
    var refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.className = 'settings-btn';
    refresh.textContent = '识别本地文件';
    refresh.addEventListener('click', function () {
      refresh.disabled = true;
      refresh.textContent = '正在识别…';
      loadThemes().then(function () {
        renderPage(pageStack[pageStack.length - 1]);
      });
    });
    toolbar.appendChild(refresh);
    body.appendChild(toolbar);

    var list = document.createElement('div');
    list.className = 'theme-list';
    body.appendChild(list);

    if (themesCache === null) {
      list.textContent = '加载主题中…';
      loadThemes().then(function () {
        renderPage(pageStack[pageStack.length - 1]);
      });
      return;
    }
    if (!themesCache.length) {
      var empty = document.createElement('p');
      empty.className = 'settings-hint';
      empty.textContent = '未读取到主题列表：请通过 http(s) 访问本网站（本地可用 python -m http.server），或检查 themes/index.json。';
      list.appendChild(empty);
    } else {
      themesCache.forEach(function (theme) {
        list.appendChild(renderThemeCard(theme));
      });
    }
  }

  function statusText(status) {
    if (status === 'warn') return '缺图异常';
    if (status === 'error') return '清单异常';
    return '正常';
  }

  function renderThemeCard(theme) {
    var card = document.createElement('div');
    card.className = 'theme-card';

    var preview = document.createElement('div');
    preview.className = 'theme-card__preview';
    if (theme.preview) {
      var img = document.createElement('img');
      img.src = getBase() + encodeURIComponent(theme.id) + '/' + theme.preview;
      img.alt = '';
      preview.appendChild(img);
    }
    card.appendChild(preview);

    var info = document.createElement('div');
    info.className = 'theme-card__info';

    var name = document.createElement('div');
    name.className = 'theme-card__name';
    name.textContent = theme.name;
    var badge = document.createElement('span');
    badge.className = 'theme-card__status theme-card__status--' + theme.status;
    badge.textContent = statusText(theme.status);
    name.appendChild(badge);
    info.appendChild(name);

    var actions = document.createElement('div');
    actions.className = 'theme-card__actions';

    var applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'settings-btn';
    var current = getSavedTheme();
    if (current.id === theme.id) {
      applyBtn.textContent = '已应用';
      applyBtn.disabled = true;
    } else {
      applyBtn.textContent = '应用';
      applyBtn.addEventListener('click', function () {
        var device = detectDevice();
        saveTheme(theme.id, device);
        applyTheme(theme.id, device);
        renderPage(pageStack[pageStack.length - 1]);
      });
    }
    actions.appendChild(applyBtn);

    if (theme.hasImage) {
      var adjustBtn = document.createElement('button');
      adjustBtn.type = 'button';
      adjustBtn.className = 'settings-btn settings-btn--ghost';
      adjustBtn.textContent = '调整画面';
      adjustBtn.addEventListener('click', function () {
        var device = theme.device || detectDevice();
        saveTheme(theme.id, device);
        applyTheme(theme.id, device);
        pushPage({
          id: 'adjust:' + theme.id,
          title: theme.name,
          render: function (b) {
            renderAdjust(b, theme);
          },
        });
      });
      actions.appendChild(adjustBtn);
    }

    info.appendChild(actions);
    card.appendChild(info);
    return card;
  }

  /* ================= 调整画面（壁纸式框选） ================= */
  function renderAdjust(body, theme) {
    var device = theme.device || detectDevice();
    var entry =
      device === 'phone' && isObject(theme.meta.mobile) && theme.meta.mobile.image
        ? theme.meta.mobile
        : isObject(theme.meta.desktop) && theme.meta.desktop.image
          ? theme.meta.desktop
          : null;
    if (!entry) {
      var none = document.createElement('p');
      none.className = 'settings-hint';
      none.textContent = '该主题没有可用图片，无法调整画面。';
      body.appendChild(none);
      return;
    }
    var imageSrc = getBase() + encodeURIComponent(theme.id) + '/' + entry.image;
    var crop = getSavedCrop(theme.id, device);
    var fullPreviewImg = null;

    var wrap = document.createElement('div');
    wrap.className = 'crop-wrap';

    var frame = document.createElement('div');
    frame.className = 'crop-frame';
    var img = document.createElement('img');
    img.className = 'crop-frame__img';
    img.alt = '';
    img.draggable = false;
    img.src = imageSrc;
    img.onload = function () {
      var ratio = img.naturalWidth / img.naturalHeight;
      frame.style.aspectRatio = String(img.naturalWidth) + ' / ' + String(img.naturalHeight);
      if (ratio < 1 && pvFrame) {
        pvFrame.style.aspectRatio = String(img.naturalWidth) + ' / ' + String(img.naturalHeight);
        overlayFrame.style.aspectRatio = String(img.naturalWidth) + ' / ' + String(img.naturalHeight);
      }
      applyCropTransform(img, crop);
    };
    frame.appendChild(img);
    wrap.appendChild(frame);

    var hint = document.createElement('p');
    hint.className = 'settings-hint';
    hint.textContent =
      device === 'phone' ? '单指拖动画面 · 双指缩放 · 视框外区域为裁切掉的部分' : '拖动画面 · 滚轮或滑块缩放';
    wrap.appendChild(hint);

    var zoomRow = document.createElement('div');
    zoomRow.className = 'crop-zoom';
    var zoomLabel = document.createElement('span');
    zoomLabel.textContent = '缩放';
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = String(MAX_SCALE);
    slider.step = '0.01';
    slider.value = String(crop.scale);
    var zoomValue = document.createElement('span');
    zoomValue.className = 'crop-zoom__value';
    zoomValue.textContent = Math.round(crop.scale * 100) + '%';
    zoomRow.appendChild(zoomLabel);
    zoomRow.appendChild(slider);
    zoomRow.appendChild(zoomValue);
    wrap.appendChild(zoomRow);

    var pvWrap = document.createElement('div');
    pvWrap.className = 'crop-preview';
    var pvLabel = document.createElement('div');
    pvLabel.className = 'crop-preview__label';
    pvLabel.textContent = '最终效果预览';
    var pvFrame = document.createElement('div');
    pvFrame.className = 'crop-preview__frame';
    var pvImg = document.createElement('img');
    pvImg.className = 'crop-frame__img';
    pvImg.alt = '';
    pvImg.draggable = false;
    pvImg.src = imageSrc;
    pvImg.onload = function () {
      pvFrame.style.aspectRatio = String(pvImg.naturalWidth) + ' / ' + String(pvImg.naturalHeight);
      applyCropTransform(pvImg, crop);
    };
    pvFrame.appendChild(pvImg);
    pvWrap.appendChild(pvLabel);
    pvWrap.appendChild(pvFrame);
    wrap.appendChild(pvWrap);

    var actions = document.createElement('div');
    actions.className = 'crop-actions';
    var previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.className = 'settings-btn settings-btn--ghost';
    previewBtn.textContent = '全屏预览';
    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'settings-btn';
    saveBtn.textContent = '保存';
    actions.appendChild(previewBtn);
    actions.appendChild(saveBtn);
    wrap.appendChild(actions);

    body.appendChild(wrap);

    var overlayFrame = document.createElement('div');

    function updateCrop(c) {
      crop = normalizeCrop(c);
      slider.value = String(crop.scale);
      zoomValue.textContent = Math.round(crop.scale * 100) + '%';
      applyCropTransform(img, crop);
      applyCropTransform(pvImg, crop);
      if (fullPreviewImg) applyCropTransform(fullPreviewImg, crop);
    }

    /* 电脑：拖拽平移 */
    frame.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      var last = { x: e.clientX, y: e.clientY };
      function onMove(ev) {
        var rect = frame.getBoundingClientRect();
        updateCrop({
          x: crop.x + (ev.clientX - last.x) / rect.width,
          y: crop.y + (ev.clientY - last.y) / rect.height,
          scale: crop.scale,
        });
        last = { x: ev.clientX, y: ev.clientY };
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    /* 电脑：滚轮缩放 */
    frame.addEventListener(
      'wheel',
      function (e) {
        e.preventDefault();
        updateCrop({ x: crop.x, y: crop.y, scale: crop.scale - e.deltaY * 0.001 });
      },
      { passive: false }
    );

    /* 缩放滑块 */
    slider.addEventListener('input', function () {
      updateCrop({ x: crop.x, y: crop.y, scale: parseFloat(slider.value) });
    });

    /* 手机：单指拖动 + 双指缩放 */
    var touches = {};
    frame.addEventListener(
      'touchstart',
      function (e) {
        e.preventDefault();
        touches = {};
        for (var i = 0; i < e.touches.length; i++) {
          touches[e.touches[i].identifier] = { x: e.touches[i].clientX, y: e.touches[i].clientY };
        }
      },
      { passive: false }
    );

    frame.addEventListener(
      'touchmove',
      function (e) {
        e.preventDefault();
        var list = e.touches;
        if (list.length === 1) {
          var t0 = list[0];
          var prev = touches[t0.identifier];
          if (prev) {
            var rect = frame.getBoundingClientRect();
            updateCrop({
              x: crop.x + (t0.clientX - prev.x) / rect.width,
              y: crop.y + (t0.clientY - prev.y) / rect.height,
              scale: crop.scale,
            });
          }
          touches = {};
          touches[t0.identifier] = { x: t0.clientX, y: t0.clientY };
        } else if (list.length === 2) {
          var ta = list[0];
          var tb = list[1];
          var dist = Math.hypot(tb.clientX - ta.clientX, tb.clientY - ta.clientY);
          var pa = touches[ta.identifier];
          var pb = touches[tb.identifier];
          if (pa && pb) {
            var prevDist = Math.hypot(pb.x - pa.x, pb.y - pa.y);
            if (prevDist > 0) {
              updateCrop({ x: crop.x, y: crop.y, scale: crop.scale * (dist / prevDist) });
            }
          }
          touches = {};
          for (var j = 0; j < list.length; j++) {
            touches[list[j].identifier] = { x: list[j].clientX, y: list[j].clientY };
          }
        }
      },
      { passive: false }
    );

    frame.addEventListener('touchend', function () {
      touches = {};
    });

    /* 保存：按主题 × 设备持久化并立即应用 */
    saveBtn.addEventListener('click', function () {
      saveCrop(theme.id, device, crop);
      saveTheme(theme.id, device);
      applyTheme(theme.id, device, crop);
      saveBtn.textContent = '已保存 ✓';
      window.setTimeout(function () {
        saveBtn.textContent = '保存';
      }, 1200);
    });

    /* 全屏预览（手机全屏 / 电脑弹窗），实时跟随调整 */
    previewBtn.addEventListener('click', function () {
      var overlay = document.createElement('div');
      overlay.className = 'crop-overlay';
      var content = document.createElement('div');
      content.className = 'crop-overlay__content';
      overlayFrame = document.createElement('div');
      overlayFrame.className = 'crop-overlay__frame';
      var oImg = document.createElement('img');
      oImg.className = 'crop-frame__img';
      oImg.alt = '';
      oImg.draggable = false;
      oImg.src = imageSrc;
      oImg.onload = function () {
        overlayFrame.style.aspectRatio =
          String(oImg.naturalWidth) + ' / ' + String(oImg.naturalHeight);
        applyCropTransform(oImg, crop);
      };
      overlayFrame.appendChild(oImg);
      content.appendChild(overlayFrame);
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'settings-btn crop-overlay__close';
      closeBtn.textContent = '关闭预览';
      closeBtn.addEventListener('click', function () {
        fullPreviewImg = null;
        overlay.remove();
      });
      content.appendChild(closeBtn);
      overlay.appendChild(content);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          fullPreviewImg = null;
          overlay.remove();
        }
      });
      document.body.appendChild(overlay);
      fullPreviewImg = oImg;
    });
  }

  /* ================= 初始化 ================= */
  function initApply() {
    if (typeof document === 'undefined') return;
    var t = getSavedTheme();
    applyTheme(t.id, t.device);
  }

  function init() {
    if (typeof document === 'undefined') return;
    initApply();
    var btn = document.getElementById('settingsBtn');
    if (btn) {
      initAccount();
      btn.addEventListener('click', function () {
        if (panel && !panel.hidden) {
          closePanel();
          return;
        }
        openPanel();
      });
    }
  }

  function autoInit() {
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  autoInit();

  return {
    init: init,
    util: {
      detectDevice: detectDevice,
      normalizeCrop: normalizeCrop,
      cropKey: cropKey,
      parseStoredTheme: parseStoredTheme,
      getSavedTheme: getSavedTheme,
      getSavedCrop: getSavedCrop,
      createMockAccountProvider: createMockAccountProvider,
      getAccountProvider: getAccountProvider,
    },
  };
});
