/* pages.js —— 页面注册表、配色预设与多语言(i18n)支持 */

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
    s.src = '/js/modal.js';
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
  html += row({ code:'__auto', ico:GLOBE, main:'浏览器默认',
    sub: raw ? ('将识别为 ' + (NAME[autoCode] || autoCode) + ' · ' + raw) : '无法读取浏览器语言 · 回退简体中文',
    badge: isAuto ? '✓ 当前' : '', active: isAuto });
  html += '<div class="lang-sep">或强制指定</div>';
  langs.forEach(function(code){
    var active = !isAuto && stored === code;
    html += row({ code:code, ico:code, txt:true, main: NAME[code] || code,
      badge: active ? '✓ 当前' : (isAuto && code === autoCode ? '浏览器匹配' : ''), active: active });
  });
  html += '</div>';

  window.WikiModal.open({ kicker:'I18N · LANGUAGE', title:'选择显示语言', body: html });

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
    key:'hope-and-despair', 
    file:'pages/hope-and-despair.html',   /* ★ 主条目自带 file，点标题直接进介绍页 */
    title:{ zh:'Hope and Despair', en:'Hope and Despair' },
    tag:{ zh:'整合包', en:'Modpack' },
    tagColor:'red', 
    palette:'red', 
    date:'2026-08-16', 
    desc:{ zh:'惊变100天：硬核僵尸生存与极端挑战', en:'100 Days: Hardcore Zombie Survival' },
    children: [
      { key:'hope-and-despair-tech', file:'pages/hope-and-despair-tech.html', title:{ zh:'安装与环境配置', en:'Installation & Setup' }, desc:{ zh:'核心模组、环境部署与魔改说明', en:'Core mods and setup' }, icon:SUB_ICONS.tech },
      { key:'hope-and-despair-server', file:'pages/hope-and-despair-server.html', title:{ zh:'服务端部署指南', en:'Server Deployment' }, desc:{ zh:'19.4.159 版本 Windows/Linux 自动化部署教程', en:'Automated deployment tutorial' }, icon:SUB_ICONS.server },
      { key:'hope-and-despair-changelog', file:'pages/hope-and-despair-changelog.html', title:{ zh:'更新日志', en:'Changelog' }, desc:{ zh:'历史版本更新记录与注意事项', en:'Version history' }, icon:SUB_ICONS.history },
      { key:'hope-and-despair-license', file:'pages/hope-and-despair-license.html', title:{ zh:'许可协议', en:'License' }, desc:{ zh:'整合包内容授权声明与使用条款', en:'License and terms' }, icon:SUB_ICONS.license },
    ]
  },
  {
    key:'anything-but-fish',
    file:'pages/anything-but-fish.html',
    title:{ zh:'Anything But Fish', en:'Anything But Fish' },
    tag:{ zh:'模组', en:'Mod' },
    tagColor:'orange',
    palette:'orange',
    date:'2026-08-17',
    desc:{ zh:'重构钓鱼：除了鱼，能钓上整个世界', en:'Fishing rework: Catch the whole world' },
    children: [
      { key:'abf-config', file:'pages/abf-config.html', title:{ zh:'配置文件详解', en:'Config Guide' }, desc:{ zh:'GUI 配置与 JSON 战利品池自定义指南', en:'GUI and JSON config guide' }, icon:SUB_ICONS.tech },
      { key:'abf-changelog', file:'pages/abf-changelog.html', title:{ zh:'更新日志', en:'Changelog' }, desc:{ zh:'历史版本更新记录与底层重构说明', en:'Version history' }, icon:SUB_ICONS.history },
    ]
  },
  {
    key:'tracker-tips',
    file:'pages/tracker-tips.html',
    title:{ zh:'Tracker Tips', en:'Tracker Tips' },
    tag:{ zh:'模组', en:'Mod' },
    tagColor:'gold',
    palette:'gold',
    date:'2026-09-01',
    desc:{ zh:'更醒目的弹窗提示，适用于各类整合包的轻量级 Overlay 模组', en:'Eye-catching overlay hints — a lightweight mod for all kinds of modpacks' },
    children: [
      { key:'tt-gui', file:'pages/tt-gui.html', title:{ zh:'初学配置界面', en:'Basic GUI Config' }, desc:{ zh:'GUI 配置面板的基础操作与功能介绍', en:'Basics of the GUI config panel' }, icon:SUB_ICONS.sliders },
      { key:'tt-text', file:'pages/tt-text.html', title:{ zh:'文本配置详解', en:'Text Config Guide' }, desc:{ zh:'hints 文件夹下的 JSON 文本格式与触发器说明', en:'JSON text format and triggers in the hints folder' }, icon:SUB_ICONS.tech },
      { key:'tt-theme', file:'pages/tt-theme.html', title:{ zh:'主题配置详解', en:'Theme Config Guide' }, desc:{ zh:'themes 文件夹下的颜色、动画与布局自定义', en:'Colors, animations and layout in the themes folder' }, icon:SUB_ICONS.license },
      { key:'tt-listener', file:'pages/tt-listener.html', title:{ zh:'新监听器注册', en:'Custom Listeners' }, desc:{ zh:'面向开发者：如何通过 API 注册自定义触发器', en:'For developers: register custom triggers via the API' }, icon:SUB_ICONS.commit },
      { key:'tt-changelog', file:'pages/tt-changelog.html', title:{ zh:'更新日志', en:'Changelog' }, desc:{ zh:'TrackerTips 的历史版本更新记录', en:'Version history of TrackerTips' }, icon:SUB_ICONS.history },
      { key:'tt-license', file:'pages/tt-license.html', title:{ zh:'许可协议', en:'License' }, desc:{ zh:'LGPLv3 开源许可与免责声明', en:'LGPLv3 license and disclaimer' }, icon:SUB_ICONS.license }
    ]
  },
  {
    key:'contact',
    file:'pages/contact.html',
    title:{ zh:'联系与社交', en:'Contact & Social' },
    tag:{ zh:'关于', en:'About' },
    tagColor:'purple', /* ★ 紫色，代表神秘与社交 */
    palette:'purple',
    date:'2026-08-17',
    desc:{ zh:'玩家交流群、开发者主页与社交平台', en:'Community and social links' }
  },
  { key:'about', file:'pages/about.html', title:{ zh:'关于本站', en:'About' }, tag:{ zh:'说明', en:'Info' }, tagColor:'gray', date:'2025-06-14', desc:{ zh:'解析器能力、快捷键与项目结构', en:'Parser capabilities and shortcuts' } }
];