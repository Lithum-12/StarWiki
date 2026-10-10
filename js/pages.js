/* pages.js —— 页面注册表、配色预设与多语言(i18n)支持 */

/* ━━ 0. 站点根路径 ━━ */
/* 由当前文档地址反推：去掉文件名，条目页再退掉 pages 目录。
   刻意不用脚本加载地址——托管方会改写资源链接（热铁盒把 ../js/x.js 换成它自己的 CDN 路径），
   那样算出来的根就是错的。文档地址对 file:// 双击、localhost、子目录部署、根部署都成立。 */
window.WIKI_BASE = window.SITE_ROOT || (function () {
  var href = location.href.split('#')[0].split('?')[0];
  href = href.replace(/\/[^/]*$/, '');
  return href.replace(/\/pages$/, '');
})();

/* ━━ 1. 多语言全局状态与工具函数 ━━ */
/* 浏览器语言自动检测（共享函数：CURRENT_LANG 初始化与语言弹窗副标题共用，避免两套实现漂移） */
window.detectBrowserLang = function() {
  const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (/^zh/.test(nav)) return 'zh';  /* zh / zh-CN / zh-TW → 简体中文 */
  if (/^en/.test(nav)) return 'en';
  if (/^ja/.test(nav)) return 'ja';
  if (/^ko/.test(nav)) return 'ko';
  if (/^ru/.test(nav)) return 'ru';
  if (/^fr/.test(nav)) return 'fr';
  if (/^es/.test(nav)) return 'es';
  return 'zh'; /* 未知语言 → 回退中文 */
};

/* 三级优先链：localStorage.wikiLang（手动选择） > navigator.language（首次自动识别） > 'zh'（兜底） */
window.CURRENT_LANG = localStorage.getItem('wikiLang') || window.detectBrowserLang();

/* 翻译函数：兼容纯字符串与 {zh,en} 多语言对象（向后兼容） */
window.t = function(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[window.CURRENT_LANG] || obj['zh'] || Object.values(obj)[0] || '';
};

window.LANG_NAMES = {
  'zh': '简体中文', 'en': 'English', 'ja': '日本語',
  'ko': '한국어', 'ru': 'Русский', 'fr': 'Français', 'es': 'Español'
};

/* 从 Markdown 提取特定语言的内容（<!-- lang:xx --> 作为分隔符） */
window.getMarkdownByLang = function(rawMd, lang) {
  const regex = /<!--\s*lang:([a-zA-Z0-9_-]+)\s*-->([\s\S]*?)(?=<!--\s*lang:[a-zA-Z0-9_-]+\s*-->|$)/g;
  let match, fallback = null, result = null, hasLangBlock = false;
  while ((match = regex.exec(rawMd)) !== null) {
    hasLangBlock = true;
    const blockLang = match[1];
    const content = match[2].trim();
    if (!fallback) fallback = content;
    if (blockLang === lang) { result = content; break; }
  }
  if (!hasLangBlock) return rawMd; /* 无多语言标记 → 返回原文（向后兼容） */
  return result || fallback || '';
};

/* 自动扫描当前页面声明了哪些语言 */
window.getAvailableLangs = function(rawMd) {
  const regex = /<!--\s*lang:([a-zA-Z0-9_-]+)\s*-->/g;
  let match; const langs = [];
  while ((match = regex.exec(rawMd)) !== null) {
    if (!langs.includes(match[1])) langs.push(match[1]);
  }
  return langs;
};

/* ── 语言切换弹窗（设计系统内实现） ── */
window.openLangModal = function() {
  if (!window.WikiModal) {           /* 懒加载 modal.js（首页/部分条目页） */
    var s = document.createElement('script');
    s.src = window.WIKI_BASE + '/js/modal.js';
    s.onload = function(){ window.openLangModal(); };
    document.head.appendChild(s);
    return;
  }

  var stored = null;
  try{ stored = localStorage.getItem('wikiLang'); }catch(e){}
  var isAuto = !stored;
  var raw = '';
  try{ raw = navigator.language || navigator.userLanguage || ''; }catch(e){}
  var autoCode = window.detectBrowserLang ? window.detectBrowserLang() : 'zh';
  var NAME = window.LANG_NAMES || { zh:'简体中文', en:'English' };

  var langs = ['zh','en'];
  var rawMd = (document.getElementById('page-md') || {}).textContent || '';
  var available = window.getAvailableLangs(rawMd);
  if (available.length > 0) langs = available;

  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.5 4 5.7 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.7-4-9s1.4-6.5 4-9z"/></svg>';

  function row(o){
    return '<button type="button" class="lang-opt' + (o.active ? ' on' : '') + '" data-lang="' + o.code + '">'
      + '<span class="lang-ico' + (o.txt ? ' lang-ico-txt' : '') + '">' + o.ico + '</span>'
      + '<span class="lang-body"><span class="lang-name">' + o.main + '</span>'
      + (o.sub ? '<span class="lang-sub">' + o.sub + '</span>' : '') + '</span>'
      + (o.badge ? '<span class="lang-badge">' + o.badge + '</span>' : '')
      + '</button>';
  }

  var html = '<div class="lang-list">';
  html += row({ code:'__auto', ico:GLOBE, main: window.tUI('langAuto'),
    sub: raw ? window.tUI('langAutoWill', { name: (NAME[autoCode] || autoCode), raw: raw })
             : window.tUI('langAutoFail'),
    badge: isAuto ? window.tUI('langCurrent') : '', active: isAuto });
  html += '<div class="lang-sep">' + window.tUI('langForce') + '</div>';
  langs.forEach(function(code){
    var active = !isAuto && stored === code;
    html += row({ code:code, ico:code, txt:true, main: NAME[code] || code,
      badge: active ? window.tUI('langCurrent') : (isAuto && code === autoCode ? window.tUI('langMatch') : ''), active: active });
  });
  html += '</div>';

  window.WikiModal.open({ kicker: window.tUI('langKicker'), title: window.tUI('langTitle'), body: html });

  setTimeout(function(){
    var scope = document.querySelector('#modalBody') || document;
    scope.querySelectorAll('.lang-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        var v = btn.getAttribute('data-lang');
        try{
          if (v === '__auto') localStorage.removeItem('wikiLang');
          else localStorage.setItem('wikiLang', v);
        }catch(e){}
        location.reload();
      });
    });
  }, 0);
};

/* ══ 托管线路（同一份站点部署在多处，供读者按网速自行选择） ══ */
/* 新增线路只改这里：base = 该线路的站点根前缀（GitHub Pages 项目页为 /仓库名，根部署填 ''） */
/* 本分支的天文站只部署在一处，没有可切换的线路：留空即不渲染插头按钮。
   需要时按 mc-res 分支的写法填两条 { code, url, base, name, note, icon } 即可 */
window.HOSTS = [];

/* 当前线路：按 hostname 命中；本地 file:// 预览或自定义域视为未命中 */
window.currentHost = function() {
  var here = location.hostname.toLowerCase();
  if (!here) return null;
  for (var i = 0; i < window.HOSTS.length; i++) {
    var h = window.HOSTS[i];
    try { if (new URL(h.url).hostname.toLowerCase() === here) return h; } catch(e){}
  }
  return null;
};

/* 把当前 URL 换算成目标线路上的同页地址：先剥掉本线路前缀得到站内路径，再挂到目标线路 */
window.hrefOnHost = function(h) {
  var cur = window.currentHost();
  var path = location.pathname;
  if (cur) {
    var from = cur.base || '';
    if (from && path.toLowerCase().indexOf(from.toLowerCase() + '/') === 0) path = path.slice(from.length);
    else if (from && path.toLowerCase() === from.toLowerCase()) path = '/';
  } else {
    /* 本地预览 / 自定义域：用站点根（由脚本加载地址反推）剥出站内路径 */
    var root = String(window.WIKI_BASE || '').replace(/^[a-z]+:\/\/[^/]*/i, '');
    if (root && path.indexOf(root) === 0) path = path.slice(root.length);
  }
  if (!path || path === '/') path = '/index.html';
  return h.url.replace(/\/+$/, '') + path + location.hash;
};

/* ── 线路切换弹窗（复用语言弹窗同一套 .lang-* 设计组件） ── */
window.openHostModal = function() {
  if (!window.WikiModal) {
    var s = document.createElement('script');
    s.src = window.WIKI_BASE + '/js/modal.js';
    s.onload = function(){ window.openHostModal(); };
    document.head.appendChild(s);
    return;
  }

  var cur = window.currentHost();
  var html = '<div class="lang-list">';
  window.HOSTS.forEach(function(h){
    var active = !!cur && cur.code === h.code;
    html += '<button type="button" class="lang-opt' + (active ? ' on' : '') + '" data-host="' + h.code + '">'
      + '<span class="lang-ico">' + h.icon + '</span>'
      + '<span class="lang-body"><span class="lang-name">' + window.t(h.name) + '</span>'
      + '<span class="lang-sub">' + window.t(h.note) + '</span></span>'
      + (active ? '<span class="lang-badge">' + window.tUI('langCurrent') + '</span>' : '')
      + '</button>';
  });
  html += '</div>';
  if (!cur) html += '<div class="lang-sep">' + window.tUI('hostLocal') + '</div>';

  window.WikiModal.open({ kicker: window.tUI('hostKicker'), title: window.tUI('hostTitle'), body: html });

  setTimeout(function(){
    var scope = document.querySelector('#modalBody') || document;
    scope.querySelectorAll('.lang-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        var h = window.HOSTS.filter(function(x){ return x.code === btn.getAttribute('data-host'); })[0];
        if (!h) return;
        if (cur && cur.code === h.code) { window.WikiModal.close(); return; }
        location.href = window.hrefOnHost(h);
      });
    });
  }, 0);
};

/* ══ UI 字符串字典（外壳/首页/弹窗全部固定文案 · zh 以本地原文为准） ══ */
window.I18N = {
  zh: {
    brand:'星图百科', crumbBrand:'✦ 星图百科', brandSub:'PERSONAL · NON-COMMERCIAL',
    searchPh:'搜索条目…  ( / )',
    sideKeys:'<kbd>/</kbd> 搜索 &nbsp;<kbd>[</kbd> 侧栏 &nbsp;<kbd>Esc</kbd> 关闭',
    engine:'engine v6.0 · by lithumc',
    collapse:'收起侧栏', reopen:'展开侧栏', totop:'回到顶部', menu:'目录', lang:'切换语言', theme:'切换主题',
    tocTitle:'本页大纲', tocEmpty:'本页没有小标题', navEmpty:'没有匹配的条目',
    kickLocal:'本地导入', kickDemo:'演示条目 · {tag}',
    words:'约 {n} 字', minutes:'预计 {n} 分钟', updated:'更新 {d}', localFile:'本地文件',
    pagerPrev:'← 上一篇', pagerNext:'下一篇 →',
    copy:'复制', copied:'已复制 ✓', missingWiki:'未收录的条目',
    dropTitle:'松开以载入 Markdown', dropSub:'.md / .markdown / .txt · 解析不会离开本机',
    unsupported:'不支持或未知的文件', removed:'已移除该本地条目',
    modalUndefined:'弹窗内容未定义: {id}', modalUndefinedNoId:'弹窗内容未定义',
    loadedToast:'已载入《{title}》· 解析全程在本地',
    themeDark:'已切换至深色模式', themeLight:'已切换至浅色模式',
    helpKicker:'HELP · KEYBOARD', helpTitle:'快捷键一览',
    keySearch:'聚焦搜索框', keySide:'收起 / 展开侧栏', keyEsc:'关闭弹窗 / 侧栏 / 搜索焦点', keyHelp:'打开本帮助',
    langKicker:'I18N · LANGUAGE', langTitle:'选择显示语言',
    langAuto:'浏览器默认', langAutoWill:'将识别为 {name} · {raw}', langAutoFail:'无法读取浏览器语言 · 回退简体中文',
    langForce:'或强制指定', langMatch:'浏览器匹配', langCurrent:'✓ 当前',
    hostBtn:'切换托管站点', hostKicker:'HOST · MIRROR', hostTitle:'选择托管站点',
    hostLocal:'当前不是线上线路 · 将按目录结构映射到对应页面',
    navProjects:'项目', navAbout:'关于',
    helloKicker:'✦ HELLO WORLD',
    helloTitle:'在喧嚣的互联网中<br>放一叠<em> 不常翻阅的档案</em>',
    helloText:'白天应付需求，晚上折腾爱好。这个小站是我自己的数字自留地：内容就地解析，数据全在本地。<br>如果恰好对你有点用，那是意外之喜。',
    secProjects:'项目列表', secProjectsNote:'每一项都是独立的一页', secAbout:'关于这个小站',
    aboutP1:'一开始只是想把本人 <strong>Github</strong> 的维基界面搬出来，后来写了一个小小的 Markdown 解析器，就变成了现在看到的样子。',
    aboutP2:'全站没有任何框架与构建工具：几个 HTML、JS、CSS，少有模块化但不搞繁杂，方便我随时修修改改。',
    aboutP3:'它不面向任何人，只是我自己折腾出来的一个角落。如果恰好对你有点用，那是意外之喜。',
    factK1:'性质', factV1:'个人项目 · <b>非商业用途</b>',
    factK2:'技术', factV2:'纯代码，无任何依赖',
    factK3:'解析', factV3:'浏览器本地渲染，无网络请求',
    factK4:'维护', factV4:'作为 Github 的镜像教程站，随写随更',
    factK5:'起步', factV5:'2026.06.15 · 缓慢施工中',
    footSig:'✦ 星图百科 · 手写于某个凌晨', footNoncom:'个人项目，仅供学习交流，不用于任何商业用途',
    termWho:'一个把笔记慢慢攒成 wiki 的普通人', termMotto:'"由兴趣驱动 · 非商业用途 · 欢迎随便看看"',
    overview:'OVERVIEW · 概述', overviewDesc:'查看该主题的整体介绍与入口。',
    warnLangTitle:'语言支持提示',
    warnLangBody:'本页正文暂仅提供：{avail}。您当前使用的语言为：{cur}——站点界面已随您的语言翻译，但正文内容尚未撰写。',
    openFile:'打开文件', maintenance:'正在维护', navToggle:'展开 / 折叠',
    navToggleAria:'展开或折叠 {title}', tagLocal:'本地',
    footnotes:'参考脚注', fnBack:'返回正文',
    closeBtn:'关闭 (Esc)', closeModal:'关闭弹窗', unnamed:'未命名',
    homeTitle:'星图百科 · 个人项目站',
    nfPageTitle:'404 · 星图百科', nfTitle:'这一页不在星图上', nfPathLabel:'请求路径：',
    nfMiss:'cat: No such file or directory —— 该条目未被收录',
    nfHint:'试试返回首页，或从项目列表里挑一个条目。', nfHome:'返回首页', nfNoncom:'非商业用途'
  },
  en: {
    brand:'StarChart Wiki', crumbBrand:'✦ StarChart Wiki', brandSub:'PERSONAL · NON-COMMERCIAL',
    searchPh:'Search entries…  ( / )',
    sideKeys:'<kbd>/</kbd> Search &nbsp;<kbd>[</kbd> Sidebar &nbsp;<kbd>Esc</kbd> Close',
    engine:'engine v6.0 · by lithumc',
    collapse:'Collapse sidebar', reopen:'Expand sidebar', totop:'Back to top', menu:'Contents', lang:'Language', theme:'Toggle theme',
    tocTitle:'On this page', tocEmpty:'No subheadings on this page', navEmpty:'No matching entries',
    kickLocal:'LOCAL IMPORT', kickDemo:'DEMO · {tag}',
    words:'~{n} words', minutes:'~{n} min read', updated:'Updated {d}', localFile:'Local file',
    pagerPrev:'← Previous', pagerNext:'Next →',
    copy:'Copy', copied:'Copied ✓', missingWiki:'Entry not indexed',
    dropTitle:'Drop to load Markdown', dropSub:'.md / .markdown / .txt · parsing never leaves this machine',
    unsupported:'Unsupported or unknown file', removed:'Local entry removed',
    modalUndefined:'Modal undefined: {id}', modalUndefinedNoId:'Modal content undefined',
    loadedToast:'Loaded "{title}" · parsed entirely locally',
    themeDark:'Switched to dark mode', themeLight:'Switched to light mode',
    helpKicker:'HELP · KEYBOARD', helpTitle:'Keyboard shortcuts',
    keySearch:'Focus search', keySide:'Collapse / expand sidebar', keyEsc:'Close modal / sidebar / search focus', keyHelp:'Open this help',
    langKicker:'I18N · LANGUAGE', langTitle:'Choose display language',
    langAuto:'Browser default', langAutoWill:'Will detect {name} · {raw}', langAutoFail:'Cannot read browser language · falling back to Chinese',
    langForce:'Or force a language', langMatch:'browser match', langCurrent:'✓ current',
    hostBtn:'Switch hosting site', hostKicker:'HOST · MIRROR', hostTitle:'Choose a hosting site',
    hostLocal:'Not a live mirror · the same path will be opened on the target site',
    navProjects:'Projects', navAbout:'About',
    helloKicker:'✦ HELLO WORLD',
    helloTitle:'In the noisy internet,<br>keep a <em>seldom-opened drawer</em>',
    helloText:'By day I ship features; by night I tinker. This site is my own digital plot: content parsed in place, data all local.<br>If it happens to help you, that\'s a happy accident.',
    secProjects:'Projects', secProjectsNote:'Each entry is a standalone page', secAbout:'About this site',
    aboutP1:'It began as an attempt to move my <strong>GitHub</strong> wiki out; then I wrote a tiny Markdown parser, and it became what you see now.',
    aboutP2:'No frameworks, no build tools: just a few HTML, JS and CSS files — lightly modularized, easy to tweak.',
    aboutP3:'It addresses nobody; a corner I built for myself. If it happens to help you, that\'s a happy accident.',
    factK1:'Nature', factV1:'Personal · <b>non-commercial</b>',
    factK2:'Tech', factV2:'Pure code, zero dependencies',
    factK3:'Parsing', factV3:'Rendered locally in browser, no network',
    factK4:'Maintenance', factV4:'GitHub mirror tutorial site, updated as written',
    factK5:'Started', factV5:'2026.06.15 · slow construction',
    footSig:'✦ StarChart Wiki · handwritten at some midnight', footNoncom:'Personal project, for learning only, never commercial',
    termWho:'an ordinary person piling notes into a wiki', termMotto:'"interest-driven · non-commercial · feel free to look around"',
    overview:'OVERVIEW', overviewDesc:'Overall introduction and entry of this topic.',
    warnLangTitle:'Language notice',
    warnLangBody:'The body of this page is currently only available in: {avail}. Your language is set to {cur} — the site interface is translated, but the article body has not been written yet.',
    openFile:'Open file', maintenance:'Under maintenance', navToggle:'Expand / collapse',
    navToggleAria:'Expand or collapse {title}', tagLocal:'Local',
    footnotes:'References', fnBack:'Back to text',
    closeBtn:'Close (Esc)', closeModal:'Close dialog', unnamed:'Untitled',
    homeTitle:'StarChart Wiki · Personal projects',
    nfPageTitle:'404 · StarChart Wiki', nfTitle:'This page is off the star chart', nfPathLabel:'Requested path: ',
    nfMiss:'cat: No such file or directory — this entry is not indexed',
    nfHint:'Try the home page, or pick an entry from the project list.', nfHome:'Back to home', nfNoncom:'non-commercial'
  }
};

/* 翻译函数：当前语言 → zh 兜底 → 键名兜底；支持 {var} 插值 */
window.tUI = function(key, vars) {
  const lang = window.CURRENT_LANG || 'zh';
  const d = window.I18N[lang] || window.I18N.zh;
  let s = d[key] !== undefined ? d[key] : (window.I18N.zh[key] !== undefined ? window.I18N.zh[key] : key);
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
};

/* 扫描 data-i18n 属性，批量替换静态节点（首页等静态 HTML 用） */
window.applyI18N = function(root) {
  root = root || document;
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const s = window.tUI(el.getAttribute('data-i18n'));
    if (el.tagName === 'TITLE') document.title = s; else el.innerHTML = s;
  });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = window.tUI(el.getAttribute('data-i18n-ph')); });
  root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = window.tUI(el.getAttribute('data-i18n-title')); });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', window.tUI(el.getAttribute('data-i18n-aria'))); });
};

/* <html lang> 与当前界面语言同步 */
document.documentElement.lang = (window.CURRENT_LANG === 'zh') ? 'zh-CN' : window.CURRENT_LANG;

/* ══ 配色预设 ══ */
window.PALETTES = {
  red:   {brand:'#c06a69', rgb:'192,106,105', t:'#c26b6b', tLight:'#a84e46'},
  teal:  {brand:'#589a99', rgb:'88,154,153',  t:'#5b9a9a', tLight:'#3c7a77'},
  orange:{brand:'#ff8035', rgb:'255,128,53',  t:'#ff9552', tLight:'#d15a10'},
  purple:{brand:'#663399', rgb:'102,51,153',  t:'#9b66cc', tLight:'#552b80'},
  gold:  {brand:'#F2C14E', rgb:'242,193,78',  t:'#ffd66b', tLight:'#b8860b'}, /* ★ 新增金色 */
};
/* ══ 子项专属图标（内联 SVG · 自动跟随主题色） ══ */
const SUB_ICONS = window.SUB_ICONS = {
  /* CPU 芯片 · 技术文档 */
  tech:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4" rx="1"/><path d="M9.5 3v3M14.5 3v3M9.5 18v3M14.5 18v3M3 9.5h3M3 14.5h3M18 9.5h3M18 14.5h3"/></svg>',
  /* 双层机架 · 服务端部署 */
  server:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6.5" rx="2"/><rect x="3" y="13.5" width="18" height="6.5" rx="2"/><path d="M7 7.25h.01M7 16.75h.01"/></svg>',
  /* 方框+时钟 · HAD 更新日志 */
  history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4.5" width="16" height="15" rx="2"/><circle cx="12" cy="12" r="3.2"/><path d="M12 10.4V12l1.5.9"/></svg>',
  /* 证书+对勾 · 许可协议 */
  license: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3.5" width="12" height="17" rx="2"/><path d="M9.5 7.5h5M9.5 10.5h5"/><path d="m9.8 14.6 1.6 1.6 3-3"/></svg>',
  /* 面板+双滑杆 · ABF 配置 */
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4.5" width="16" height="15" rx="2"/><path d="M9 8.5v7M15 8.5v7"/><path d="M7.5 10.5h3M13.5 13.5h3"/></svg>',
  /* 版本卡片 · ABF 更新日志 */
  commit:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4.5" width="16" height="15" rx="2"/><circle cx="12" cy="12" r="2.2"/><path d="M7.5 12h2.3M14.2 12h2.3"/></svg>'
};

/* ══ 默认项目图标（干净版，无多余空格） ══ */
window.DEFAULT_ICON = '<svg viewBox="0 0 104 104" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M51.7 92.5V51.7L16.4 31.3l35.3 20.4L87 31.3 51.7 11 16.4 31.3v40.8l35.3 20.4L87 72V31.3L51.7 11"/></svg>';

/**
 * 取图标：有图且能加载 → png/jpg；没图或加载失败 → 默认 SVG
 * @param {Object} p - 页面对象
 * @param {string} base - 基础路径
 * @returns {string} 图标 HTML
 */
window.iconOf = function(p, base) {
  if (p && p.icon) {
    var s = String(p.icon).trim();
    if (s.charAt(0) === '<') return s;
    var src = /^(https?:|data:)/.test(s) ? s : (base ? base + '/' : '') + s;
    /* 关键：图片 404 时自动回退为默认 SVG */
    return '<img src="' + src + '" alt="" loading="lazy" onerror="this.outerHTML=window.DEFAULT_ICON">';
  }
  return window.DEFAULT_ICON;
};

/* ══ 条目注册表（title/tag/desc 支持多语言对象，兼容纯字符串） ══ */
window.PAGES = [
  { 
    key:'syntax', file:'pages/syntax.html', title:'语法手册', tag:'手册', tagColor:'red', palette:'red', date:'2025-06-14', desc:'本站支持的全部 Markdown 语法演示',
    children: [
      { key:'syntax-inline', file:'pages/syntax-inline.html', title:'行内样式', desc:'粗体、斜体、高亮与链接' },
      { key:'syntax-block', file:'pages/syntax-block.html', title:'块级元素', desc:'列表、表格、代码与引用' }
    ]
  },
  { 
    key:'catalog', file:'pages/catalog.html', title:'深空天体目录', tag:'目录', tagColor:'orange', palette:'orange', date:'2025-06-02', desc:'适合入门者的梅西耶天体速查表',
    children: [
      { key:'catalog-messier', file:'pages/catalog-messier.html', title:'梅西耶天体', desc:'110 个经典深空目标' },
      { key:'catalog-caldwell', file:'pages/catalog-caldwell.html', title:'科德韦尔天体', desc:'进阶观测的 109 个目标' }
    ]
  },
  { 
    key:'field', file:'pages/field.html', title:'观测者手册', tag:'手册', tagColor:'teal', palette:'teal', date:'2025-05-21', desc:'出发前的完整检查清单与日志模板',
    children: [
      { key:'field-gear', file:'pages/field-gear.html', title:'装备检查', desc:'三脚架、目镜与红光照明' },
      { key:'field-log', file:'pages/field-log.html', title:'观测日志', desc:'现场手记与后期誊录模板' }
    ]
  },
  { key:'glossary', file:'pages/glossary.html', title:'术语表', tag:'词条', tagColor:'gray', date:'2025-04-30', desc:'按频率排列的高频观星词条' },
  { key:'about', file:'pages/about.html', title:'关于本站', tag:'说明', tagColor:'gray', date:'2025-06-14', desc:'解析器能力、快捷键与项目结构' }
];