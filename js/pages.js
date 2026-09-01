/* pages.js —— 页面注册表与配色预设 */
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

/* ══ 条目注册表（包含 children 子项目） ══ */
window.PAGES = [
  { 
    key:'hope-and-despair', 
    file:'pages/hope-and-despair.html',   /* ★ 主条目自带 file，点标题直接进介绍页 */
    title:'Hope and Despair', 
    tag:'整合包', 
    tagColor:'red', 
    palette:'red', 
    date:'2026-08-16', 
    desc:'惊变100天：硬核僵尸生存与极端挑战',
    children: [
      { key:'hope-and-despair-tech', file:'pages/hope-and-despair-tech.html', title:'安装与环境配置', desc:'核心模组、环境部署与魔改说明', icon:SUB_ICONS.tech },
      { key:'hope-and-despair-server', file:'pages/hope-and-despair-server.html', title:'服务端部署指南', desc:'19.4.159 版本 Windows/Linux 自动化部署教程', icon:SUB_ICONS.server },
      { key:'hope-and-despair-changelog', file:'pages/hope-and-despair-changelog.html', title:'更新日志', desc:'历史版本更新记录与注意事项', icon:SUB_ICONS.history },
      { key:'hope-and-despair-license', file:'pages/hope-and-despair-license.html', title:'许可协议', desc:'整合包内容授权声明与使用条款', icon:SUB_ICONS.license },
    ]
  },
  {
    key:'anything-but-fish',
    file:'pages/anything-but-fish.html',
    title:'Anything But Fish',
    tag:'模组',
    tagColor:'orange',
    palette:'orange',
    date:'2026-08-17',
    desc:'重构钓鱼：除了鱼，能钓上整个世界',
    children: [
      { key:'abf-config', file:'pages/abf-config.html', title:'配置文件详解', desc:'GUI 配置与 JSON 战利品池自定义指南', icon:SUB_ICONS.tech },
      { key:'abf-changelog', file:'pages/abf-changelog.html', title:'更新日志', desc:'历史版本更新记录与底层重构说明', icon:SUB_ICONS.history },
    ]
  },
  {
    key:'tracker-tips',
    file:'pages/tracker-tips.html',
    title:'TrackerTips',
    tag:'模组',
    tagColor:'gold',
    palette:'gold',
    date:'2026-09-01',
    desc:'更醒目的弹窗提示，适用于各类整合包的轻量级 Overlay 模组',
    children: [
      { key:'tt-gui', file:'pages/tt-gui.html', title:'初学配置界面', desc:'GUI 配置面板的基础操作与功能介绍', icon:SUB_ICONS.sliders },
      { key:'tt-text', file:'pages/tt-text.html', title:'文本配置详解', desc:'hints 文件夹下的 JSON 文本格式与触发器说明', icon:SUB_ICONS.tech },
      { key:'tt-theme', file:'pages/tt-theme.html', title:'主题配置详解', desc:'themes 文件夹下的颜色、动画与布局自定义', icon:SUB_ICONS.license },
      { key:'tt-listener', file:'pages/tt-listener.html', title:'新监听器注册', desc:'面向开发者：如何通过 API 注册自定义触发器', icon:SUB_ICONS.commit },
      { key:'tt-changelog', file:'pages/tt-changelog.html', title:'更新日志', desc:'TrackerTips 的历史版本更新记录', icon:SUB_ICONS.history },
      { key:'tt-license', file:'pages/tt-license.html', title:'许可协议', desc:'LGPLv3 开源许可与免责声明', icon:SUB_ICONS.license }
    ]
  },
  {
    key:'contact',
    file:'pages/contact.html',
    title:'联系与社交',
    tag:'关于',
    tagColor:'purple', /* ★ 使用我们之前加的紫色，代表神秘与社交 */
    palette:'purple',
    date:'2026-08-17',
    desc:'玩家交流群、开发者主页与社交平台'
  },
  { key:'about', file:'pages/about.html', title:'关于本站', tag:'说明', tagColor:'gray', date:'2025-06-14', desc:'解析器能力、快捷键与项目结构' }
];