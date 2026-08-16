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
    key:'mc-modpacks', 
    title:'Minecraft 整合包', 
    tag:'MC', 
    tagColor:'red', 
    palette:'red', 
    desc:'硬核与魔改整合包游玩记录与档案',
    children: [
      { key:'hope-and-despair', file:'pages/hope-and-despair.html', title:'Hope and Despair', desc:'惊变100天：硬核僵尸生存与城市废墟' },
      { key:'hope-and-despair-tech', file:'pages/hope-and-despair-tech.html', title:'HAD 技术文档', desc:'核心模组、环境部署与魔改说明' }
    ]
  },
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