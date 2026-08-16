/* pages.js —— 页面注册表与配色预设 */
/* ══ 配色预设 ══ */
window.PALETTES = {
  red:   {brand:'#c06a69', rgb:'192,106,105', t:'#c26b6b', tLight:'#a84e46'},
  teal:  {brand:'#589a99', rgb:'88,154,153',  t:'#5b9a9a', tLight:'#3c7a77'},
  orange:{brand:'#ff8035', rgb:'255,128,53',  t:'#ff9552', tLight:'#d15a10'},
  purple:{brand:'#663399', rgb:'102,51,153',  t:'#9b66cc', tLight:'#552b80'},
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
      { key:'hope-and-despair-tech', file:'pages/hope-and-despair-tech.html', title:'安装与环境配置', desc:'核心模组、环境部署与魔改说明' },
      { key:'hope-and-despair-server', file:'pages/hope-and-despair-server.html', title:'服务端部署指南', desc:'19.4.159 版本 Windows/Linux 自动化部署教程' },
      { key:'hope-and-despair-changelog', file:'pages/hope-and-despair-changelog.html', title:'更新日志', desc:'历史版本更新记录与注意事项' },
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
      { key:'abf-config', file:'pages/abf-config.html', title:'ABF 配置文件详解', desc:'GUI 配置与 JSON 战利品池自定义指南' },
      { key:'abf-changelog', file:'pages/abf-changelog.html', title:'更新日志', desc:'历史版本更新记录与底层重构说明' },
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