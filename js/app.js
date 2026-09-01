/* app.js —— 条目页外壳与交互 */
(function(){
'use strict';
const PAGES = window.PAGES || [];
const PALETTES = window.PALETTES || {};
const iconOf = window.iconOf || function(){ return ''; };
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ── 功能开关 ── */
const IMPORT_ENABLED = false;

const BASE = document.body.hasAttribute('data-root') ? document.body.dataset.root : '.';
const KEY  = document.body.dataset.page || 'home';
const params = new URLSearchParams(location.search);
const impKey = params.get('imp');

let imports = [];
if(IMPORT_ENABLED){
  try{ imports = JSON.parse(sessionStorage.getItem('wikiImports')||'[]'); }catch(e){ imports=[]; }
}
const saveImports = () => { try{ sessionStorage.setItem('wikiImports',JSON.stringify(imports)); }catch(e){} };
const hrefOf = p => p.removable ? BASE+'/index.html?imp='+p.key : BASE+'/'+p.file;

/* ── 项目配色（支持子页面继承父级 palette） ── */
function applyPalette(key){
  let p = PAGES.find(x=>x.key===key);
  let pal = p && p.palette ? (typeof p.palette==='string' ? PALETTES[p.palette] : p.palette) : null;
  
  // 如果顶层没找到，去 children 里找，并继承父级配色
  if (!pal) {
    for (const parent of PAGES) {
      if (parent.children) {
        const child = parent.children.find(c => c.key === key);
        if (child) {
          pal = parent.palette ? (typeof parent.palette==='string' ? PALETTES[parent.palette] : parent.palette) : null;
          break;
        }
      }
    }
  }

  const rs=document.documentElement.style;
  const KEYS=['--brand','--brand-rgb','--brand-t','--brand-tint','--brand-line'];
  if(!pal){ KEYS.forEach(k=>rs.removeProperty(k)); return; }
  const light=(document.documentElement.getAttribute('data-theme')||'dark')==='light';
  rs.setProperty('--brand',pal.brand);
  rs.setProperty('--brand-rgb',pal.rgb);
  rs.setProperty('--brand-t',light&&pal.tLight?pal.tLight:(pal.t||pal.brand));
  rs.setProperty('--brand-tint','rgba('+pal.rgb+','+(light?.10:.09)+')');
  rs.setProperty('--brand-line','rgba('+pal.rgb+','+(light?.55:.5)+')');
}

/* ── 维基链接（支持子页面） ── */
function wikiResolver(target, anchor){
  const t = target.trim();
  // 1. 先在顶层找
  let p = PAGES.find(x=>x.title===t) || PAGES.find(x=>x.title.includes(t));
  if(p) return BASE+'/'+p.file + (anchor ? '#a-'+encodeURIComponent(anchor) : '');
  
  // 2. 去 children 里找
  for (const parent of PAGES) {
    if (parent.children) {
      const child = parent.children.find(c => c.title === t) || parent.children.find(c => c.title.includes(t));
      if (child) return BASE+'/'+child.file + (anchor ? '#a-'+encodeURIComponent(anchor) : '');
    }
  }
  
  // 3. 在本地导入里找
  const im = imports.find(x=>x.title===t || x.title.includes(t));
  if(im) return BASE+'/index.html?imp='+im.key;
  return null;
}

/* ── 外壳 ── */
document.body.insertAdjacentHTML('afterbegin', `
<div class="dots" aria-hidden="true"></div>
<div id="progress"></div>
<div class="app">
  <aside class="sidebar" id="sidebar">
    <a class="brand" href="${BASE}/index.html">
      <span class="logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path class="star" d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2L12 2z"/>
          <circle class="spark" cx="19.5" cy="4.5" r="1.3"/>
        </svg>
      </span>
<span><b>星图百科</b><span class="brand-text-wrap"><small id="brandTypewriter"></small><div class="tw-error-overlay" id="twError">SYNTAX ERROR</div></span></span>
    </a>
    <div class="search">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input id="searchInput" placeholder="搜索条目…  ( / )" autocomplete="off">
    </div>
    <nav id="navList"></nav>
    <div class="side-foot">
      <div class="side-foot-info">
        <div><kbd>/</kbd> 搜索 &nbsp;<kbd>[</kbd> 侧栏 &nbsp;<kbd>Esc</kbd> 关闭</div>
        <div class="mono" style="opacity:.7">engine v5.2 · by lithumc</div>
      </div>
      <button class="btn side-collapse-btn" id="collapseBtn" title="收起侧栏" aria-label="收起侧栏">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="m14 10-2 2 2 2"/></svg>
      </button>
    </div>
  </aside>
  <button class="side-reopen" id="reopenBtn" title="展开侧栏" aria-label="展开侧栏">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="m14 10 2 2-2 2"/></svg>
  </button>
  <button class="side-top" id="topBtn" title="回到顶部" aria-label="回到顶部">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14"/><path d="M12 20V8"/><path d="m6 14 6-6 6 6"/></svg>
  </button>
  <div class="scrim" id="scrim"></div>
  <main class="main" id="main">
    <header class="topbar">
      <button class="icon-btn" id="menuBtn" title="目录" aria-label="目录">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
      <div class="crumb"><span class="crumb-brand">✦ 星图百科</span><span class="sep">/</span><b id="crumbPage"></b></div>
      <div class="spacer"></div>
      <button class="btn ${IMPORT_ENABLED?'':'is-disabled'}" id="openBtn"
        ${IMPORT_ENABLED?'':'aria-disabled="true" title="正在维护"'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-2.54 6a2 2 0 0 1-1.84 1.25H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>打开文件</button>      <input type="file" id="fileInput" accept=".md,.markdown,.txt,text/markdown" multiple hidden>
      <button class="btn theme-btn" id="langBtn" disabled title="正在维护" aria-label="语言切换">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 2.5V5"/><path d="M3 6.5h11.5"/><path d="M5.5 9.5c1 3.4 3.6 6.3 7 8"/><path d="M11.5 9.5c-1 3.4-3.6 6.3-7 8"/><path d="M13 21.5l4-10 4 10"/><path d="M14.7 17.5h4.6"/></svg>
      </button>
      <button class="btn theme-btn" id="themeBtn" title="切换主题" aria-label="切换主题">
        <svg class="ic-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        <svg class="ic-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      </button>
    </header>
    <div class="wrap">
      <article class="card page" id="pageCard">
        <div class="kicker"><span id="kick"></span></div>
        <h1 class="ptitle" id="pageTitle"></h1>
        <div class="meta" id="metaChips"></div>
        <div class="divider"></div>
        <div class="md" id="mdContent"></div>
        <div class="pager" id="pager"></div>
      </article>
      <nav class="card toc" aria-label="本页大纲">
        <div class="toc-title"><i class="pulse"></i>本页大纲</div>
        <div id="tocList"></div>
      </nav>
    </div>
  </main>
</div>
<div class="drop" id="drop"><div class="drop-in">
  <div class="drop-ico">✦</div>
  <div class="drop-t">松开以载入 Markdown</div>
  <div class="drop-s">.md / .markdown / .txt · 解析不会离开本机</div>
</div></div>
<div class="toast" id="toast" role="status"></div>
`);

const mainEl=$('#main'),contentEl=$('#mdContent'),tocList=$('#tocList'),navList=$('#navList'),
      pager=$('#pager'),pageCard=$('#pageCard'),progress=$('#progress'),searchInput=$('#searchInput'),
      toastEl=$('#toast'),dropEl=$('#drop'),statLine=$('#statLine');
let codeStore={}, spyEls=[];
const currentKey = () => impKey || KEY;

/**
 * 显示提示消息
 * @param {string} msg - 提示内容
 */
function toast(msg){ toastEl.textContent=msg; toastEl.classList.add('show');
  clearTimeout(toastEl._t); toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),2400); }

/* ── 主题切换 ── */
const curTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
$('#themeBtn').addEventListener('click',()=>{
  const t = curTheme()==='dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme',t);
  try{ localStorage.setItem('wikiTheme',t); }catch(e){}
  applyPalette(currentKey());
  toast(t==='dark' ? '已切换至深色模式' : '已切换至浅色模式');
});

/* ── 侧栏收起 / 展开（状态记忆） ── */
const setSide = collapsed => {
  // ★ 折叠动画前冻结正文宽度，避免文字被逐行挤压重排
  if (matchMedia('(min-width:901px)').matches) {
    const wrap = document.querySelector('.wrap');
    if (wrap) {
      document.body.style.setProperty('--freeze-w', wrap.offsetWidth + 'px');
      document.body.classList.add('side-anim');
      clearTimeout(setSide._t);
      setSide._t = setTimeout(() => document.body.classList.remove('side-anim'), 320);
    }
  }
  document.body.classList.toggle('side-collapsed', collapsed);
  try{ localStorage.setItem('wikiSide', collapsed?'collapsed':'open'); }catch(e){}
};
try{ if(localStorage.getItem('wikiSide')==='collapsed') document.body.classList.add('side-collapsed'); }catch(e){}
$('#collapseBtn').addEventListener('click', () => {
  if (matchMedia('(min-width:901px)').matches) {
    setSide(true); // 桌面端：执行折叠动画
  } else {
    document.body.classList.remove('nav-open'); // 手机端：直接关闭抽屉
  }
});
$('#reopenBtn').addEventListener('click',()=>setSide(false));

/* ── 收起态：回到顶部（下滚才显示，点击立刻隐藏） ── */
let topLocked=false;
$('#topBtn').addEventListener('click',()=>{
  topLocked=true;                              // 上锁：回顶途中不让按钮重新冒出
  document.body.classList.remove('show-top');  // 立刻隐藏
  mainEl.scrollTo({top:0,behavior:'smooth'});
});
/* 用户中途手动滚轮干预 → 解锁，恢复正常的显隐逻辑 */
mainEl.addEventListener('wheel',()=>{ topLocked=false; },{passive:true});

/**
 * 扁平化页面注册表（用于上一篇/下一篇翻页）
 * @returns {Array} 扁平化后的页面列表
 */
const registry = () => {
  const flat = [];
  PAGES.forEach(p => {
    if (p.file) flat.push(p); // 父级本身如果有 file，也作为一页
    if (p.children) p.children.forEach(c => flat.push({ ...c, parent: p.key, tagColor: p.tagColor }));
  });
  return flat.concat(imports.map(p=>({ key:p.key, title:p.title, desc:'本地导入', tag:'本地', tagColor:'red', removable:true })));
};

/* ── 侧栏（图标即折叠按钮） ── */
/**
 * 渲染侧边栏导航
 * @param {string} filter - 搜索过滤词（可选）
 */
function renderNav(filter){
  if(!navList) return;
  const q=(filter||'').trim().toLowerCase();
  let html='';

  PAGES.forEach(p => {
    const hasChildren = p.children && p.children.length > 0;
    const isMatch = !q || p.title.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q);

    let childMatch = false;
    let childHtml = '';
    
    // 1. 先生成子项 HTML 和匹配状态
    if (hasChildren) {
      p.children.forEach(c => {
        const cMatch = !q || c.title.toLowerCase().includes(q) || (c.desc||'').toLowerCase().includes(q);
        if (cMatch) childMatch = true;
        const isCurrent = c.key === currentKey();
        childHtml += `<a class="nav-item nav-child ${isCurrent?'on':''}" href="${BASE+'/'+c.file}">
          <span class="nav-ico">${iconOf(c,BASE)}</span>
          <span class="nav-body"><span class="t">${esc(c.title)}</span></span>
        </a>`;
      });
    }

    if (!isMatch && !childMatch) return;

    const containsCurrent = p.key === currentKey() || (hasChildren && p.children.some(c => c.key === currentKey()));
    const isOpen = hasChildren && (containsCurrent || (!!q && childMatch));

    // 2. 根据是否有子项，生成父级 HTML
    if (hasChildren) {
      // 判断是否为纯目录（没有 file 属性）
      const isDir = !p.file;
      const tag = isDir ? 'span' : 'a';
      const href = isDir ? '' : ` href="${BASE+'/'+p.file}"`;
      
      html += `<div class="nav-group ${isOpen?'is-open':''}">
        <div class="nav-parent-row">
          <button class="nav-ico-btn" data-group="${p.key}" title="展开 / 折叠" aria-label="展开或折叠 ${esc(p.title)}">
            <span class="ico-face">${iconOf(p,BASE)}</span>
            <span class="ico-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <${tag} class="nav-parent-link ${p.key===currentKey()?'on':''} ${isDir?'is-dir':''}"${href}>
            <span class="nav-body">
              <span class="row"><span class="t">${esc(p.title)}</span><span class="tag tag-${p.tagColor}">${esc(p.tag)}</span></span>
              <span class="s">${esc(p.desc||'')}</span>
            </span>
          </${tag}>
        </div>
        <div class="nav-children-wrap"><div>${childHtml}</div></div>
      </div>`;
    } else {
      html += `<a class="nav-item ${p.key===currentKey()?'on':''}" href="${hrefOf(p)}">
        <span class="nav-ico">${iconOf(p,BASE)}</span>
        <span class="nav-body">
          <span class="row"><span class="t">${esc(p.title)}</span><span class="tag tag-${p.tagColor}">${esc(p.tag)}</span></span>
          <span class="s">${esc(p.desc||'')}</span>
        </span>
      </a>`;
    }
  });

  navList.innerHTML = html || '<div class="nav-empty">没有匹配的条目</div>';

  /* 图标按钮 = 折叠开关 */
  navList.querySelectorAll('.nav-ico-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.closest('.nav-group').classList.toggle('is-open');
    });
  });

  // 新增：点击纯目录（无 file）的文字也触发折叠
  navList.querySelectorAll('.nav-parent-link.is-dir').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      link.closest('.nav-group').classList.toggle('is-open');
    });
  });
}

/* ── 渲染当前页（支持子页面） ── */
/**
 * 渲染当前页面内容
 */
function renderCurrent(){
  let md, info;
  if(impKey){
    const p=imports.find(x=>x.key===impKey);
    if(!p){ location.replace(BASE+'/index.html'); return; }
    info={title:p.title,tag:'本地',removable:true}; md=p.body;
  }else{
    // 1. 先在顶层找
    info = PAGES.find(x=>x.key===KEY);
    
    // 2. 如果没找到，去 children 里找，并继承父级属性
    if (!info) {
      for (const parent of PAGES) {
        if (parent.children) {
          const child = parent.children.find(c => c.key === KEY);
          if (child) {
            info = { ...child, tagColor: child.tagColor || parent.tagColor, palette: child.palette || parent.palette, tag: child.tag || parent.tag };
            break;
          }
        }
      }
    }
    
    // 3. 最终兜底
    if (!info) info = PAGES[0]; 
    
    md=(document.getElementById('page-md')||{}).textContent||'';
  }

  applyPalette(currentKey());

  const res=MDParser.render(md,{wiki:wikiResolver});
  codeStore=res.codes;

  document.title=info.title+' · 星图百科';
  $('#crumbPage').textContent=info.title;
  $('#kick').textContent=info.removable?'本地导入':'演示条目 · '+(info.tag||'');
  const pageTitle=$('#pageTitle');
  pageTitle.textContent=info.title;
  pageTitle.insertAdjacentHTML('beforeend','<span class="caret" aria-hidden="true"></span>');

  const text=res.html.replace(/<[^>]+>/g,'');
  const chars=[...text.replace(/\s/g,'')].length;
  $('#metaChips').innerHTML=
    '<span class="chip"><i class="dot dot-red"></i>约 '+chars+' 字</span>'+
    '<span class="chip"><i class="dot dot-teal"></i>预计 '+Math.max(1,Math.round(chars/450))+' 分钟</span>'+
    '<span class="chip"><i class="dot dot-gray"></i>'+(info.removable?'本地文件':'更新 '+info.date)+'</span>';

  contentEl.innerHTML=res.html;
  contentEl.querySelectorAll('img').forEach(im=>{
    const s=im.getAttribute('src')||'';
    const m=s.match(/img\/([a-z0-9_-]+)\.svg$/i);
    // ★ 命中资产包 → 原地替换为内联 SVG（不发起任何图片请求）
    if(m && window.SVGPack && SVGPack[m[1]]){ im.outerHTML=SVGPack[m[1]]; return; }
    if(s && !/^(https?:|data:|#)/.test(s)) im.setAttribute('src', BASE+'/'+s);
  });

  tocList.innerHTML = res.toc.filter(h=>h.level<=3)
    .map(h=>'<a class="l'+h.level+'" href="#'+h.id+'">'+esc(h.text)+'</a>').join('')
    || '<div class="toc-empty">本页没有小标题</div>';

  const order=registry(), idx=order.findIndex(x=>x.key===currentKey());
  if(order.length>1){
    const prev=order[(idx-1+order.length)%order.length], next=order[(idx+1)%order.length];
    pager.innerHTML=
      '<a class="prev" href="'+hrefOf(prev)+'"><span class="lbl">← 上一篇</span><span class="ttl">'+esc(prev.title)+'</span></a>'+
      '<a class="next" href="'+hrefOf(next)+'"><span class="lbl">下一篇 →</span><span class="ttl">'+esc(next.title)+'</span></a>';
  } else pager.innerHTML='';

  renderNav(searchInput.value);
  spyEls=[...contentEl.querySelectorAll('h2[id],h3[id]')];
  pageCard.classList.remove('enter'); void pageCard.offsetWidth; pageCard.classList.add('enter');
  updateScroll();
}

/* ── 复制代码 ── */
/**
 * 复制代码到剪贴板
 * @param {HTMLElement} btn - 复制按钮元素
 */
function copyCode(btn){
  const text=codeStore[btn.dataset.code]||'';
  const done=()=>{btn.classList.add('ok');btn.textContent='已复制 ✓';
    setTimeout(()=>{btn.classList.remove('ok');btn.textContent='复制';},1600);};
  const fb=()=>{const ta=document.createElement('textarea');ta.value=text;
    ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');done();}catch(e){}ta.remove();};
  if(navigator.clipboard&&navigator.clipboard.writeText)
    navigator.clipboard.writeText(text).then(done).catch(fb); else fb();
}

/* ── 事件 ── */
contentEl.addEventListener('click',e=>{
  const cp=e.target.closest('.copy-btn'); if(cp){copyCode(cp);return;}

  // ★ 新增：拦截文章内的魔法弹窗按钮
  const mb=e.target.closest('.md-modal');
  if(mb){
    const id = mb.dataset.modal;
    if(window.WikiModal && window.ModalDict && window.ModalDict[id]){
      WikiModal.open(window.ModalDict[id]);
    } else {
      toast('弹窗内容未定义: ' + id);
    }
    return;
  }

  const a=e.target.closest('a');
  // ... 下面保持原有的 a 标签逻辑不动 ...
  if(a){ 
    const href=a.getAttribute('href')||'';
    
    // ★ 新增：拦截 #modal: 开头的魔法链接
    if(href.startsWith('#modal:')){
      e.preventDefault();
      const id = href.slice(7); // 提取 modal:id 中的 id
      if(window.WikiModal && window.ModalDict && window.ModalDict[id]){
        WikiModal.open(window.ModalDict[id]);
      } else {
        toast('弹窗内容未定义');
      }
      return;
    }

    // 原有的锚点平滑跳转逻辑
    if(href.startsWith('#')&&!href.startsWith('#a-')){ 
      e.preventDefault();
      const t=document.getElementById(href.slice(1));
      if(t)t.scrollIntoView({behavior:'smooth',block:'start'}); 
    }
  }
});
tocList.addEventListener('click',e=>{
  const a=e.target.closest('a'); if(!a)return; e.preventDefault();
  const t=document.getElementById(a.getAttribute('href').slice(1));
  if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
});
navList.addEventListener('click',e=>{
  // 1. 处理移除本地导入条目的 "×" 按钮
  const rm=e.target.closest('.rm');
  if(rm){ 
    e.preventDefault(); 
    e.stopPropagation();
    const key=rm.dataset.rm;
    imports=imports.filter(p=>p.key!==key); 
    saveImports();
    toast('已移除该本地条目');
    if(key===impKey){ location.href=BASE+'/index.html'; } 
    else renderNav(searchInput.value);
    return;
  }

  // 2. ★ 新增：点击当前已选中的条目，阻止刷新并平滑回到顶部
  const activeLink = e.target.closest('a.on');
  if(activeLink){
    e.preventDefault(); // 阻止 a 标签默认的跳转刷新行为
    mainEl.scrollTo({ top: 0, behavior: 'smooth' }); // 主阅读区平滑滚回顶部
    document.body.classList.remove('nav-open'); // 移动端下顺便自动收起侧边栏
  }
});
$('#menuBtn').addEventListener('click',()=>document.body.classList.toggle('nav-open'));
$('#scrim').addEventListener('click',()=>document.body.classList.remove('nav-open'));
searchInput.addEventListener('input',()=>renderNav(searchInput.value));
document.addEventListener('keydown',e=>{
  const typing=/INPUT|TEXTAREA/.test(document.activeElement.tagName);
  if(e.key==='/'&&!typing){
    e.preventDefault();
    // ★ 侧栏收着时先展开再聚焦，杜绝“凭空打字”
    if(matchMedia('(min-width:901px)').matches){
      if(document.body.classList.contains('side-collapsed')) setSide(false);
    }else{
      document.body.classList.add('nav-open');   // 移动端直接拉开抽屉
    }
    searchInput.focus();
  }
  else if(e.key==='['&&!typing){
    if(matchMedia('(min-width:901px)').matches) setSide(!document.body.classList.contains('side-collapsed'));
    else document.body.classList.toggle('nav-open');
  }
  else if(e.key==='Escape'){
    document.body.classList.remove('nav-open');
    if(document.activeElement===searchInput){searchInput.blur();searchInput.value='';renderNav('');}}
});

/* ── 本地文件导入 ── */
/**
 * 处理本地文件导入
 * @param {FileList} files - 选择的文件列表
 */
function handleFiles(files){
  if(!IMPORT_ENABLED){ toast('不支持或未知的文件'); return; }
  [...files].forEach(f=>{
    const r=new FileReader();
    r.onload=e=>{
      let body=String(e.target.result);
      let title=f.name.replace(/\.(md|markdown|txt)$/i,'');
      const lines=body.split('\n');
      for(let i=0;i<lines.length;i++){
        const m=lines[i].match(/^#\s+(.*)$/);
        if(m){title=m[1].trim();lines.splice(i,1);body=lines.join('\n');break;}
        if(lines[i].trim()!=='')break;
      }
      const key='imp'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
      imports.push({key,title,body}); saveImports();
      sessionStorage.setItem('wikiToast','已载入「'+title+'」· 解析全程在本地');
      location.href=(KEY==='home'?'':BASE+'/')+'index.html?imp='+key;
    };
    r.readAsText(f);
  });
}
$('#openBtn').addEventListener('click',()=>{
  if(!IMPORT_ENABLED){ toast('不支持或未知的文件'); return; }
  $('#fileInput').click();
});
$('#fileInput').addEventListener('change',e=>{handleFiles(e.target.files);e.target.value='';});

if(IMPORT_ENABLED){
  let dragDepth=0;
  window.addEventListener('dragenter',e=>{e.preventDefault();dragDepth++;dropEl.classList.add('show');});
  window.addEventListener('dragleave',e=>{e.preventDefault();if(--dragDepth<=0){dragDepth=0;dropEl.classList.remove('show');}});
  window.addEventListener('dragover',e=>e.preventDefault());
  window.addEventListener('drop',e=>{e.preventDefault();dragDepth=0;dropEl.classList.remove('show');handleFiles(e.dataTransfer.files);});
}else{
  window.addEventListener('dragover',e=>e.preventDefault());
  window.addEventListener('drop',e=>{e.preventDefault();toast('不支持或未知的文件');});
}

/* ── 滚动 ── */
let ticking=false;
/**
 * 更新滚动进度条与大纲高亮
 */
function updateScroll(){
  const max=mainEl.scrollHeight-mainEl.clientHeight;
  progress.style.width=(max>0?mainEl.scrollTop/max*100:0)+'%';
  const down=mainEl.scrollTop>320;
  if(!down) topLocked=false;
  if(!topLocked) document.body.classList.toggle('show-top',down);
  if(!spyEls.length)return;
  const top=mainEl.scrollTop+120-pageCard.offsetTop;
  let cur=spyEls[0];
  for(const h of spyEls){ if(h.offsetTop<=top)cur=h; else break; }
  tocList.querySelectorAll('a').forEach(a=>
    a.classList.toggle('on',a.getAttribute('href')==='#'+cur.id));
}
mainEl.addEventListener('scroll',()=>{
  if(!ticking){requestAnimationFrame(()=>{updateScroll();ticking=false;});ticking=true;}
},{passive:true});

/* ── 启动 ── */
renderCurrent();

/* ── 侧边栏品牌区：随机极客打字机 (含 Syntax Error 彩蛋) ── */
(function(){
  const el = document.getElementById('brandTypewriter');
  const errOverlay = document.getElementById('twError');
  if(!el || !errOverlay) return;

  const PHRASES_NORMAL = [
    'LOCAL · MARKDOWN · WIKI', 'NO SERVER · NO TRACKER', 'OBSERVING THE STARS...', 
    'PURE STATIC · ZERO DEPS', 'BREWING COFFEE... [OK]', 'WELCOME OBSERVER', 
    'GIT COMMIT -M "UPDATE"', 'LOADING STAR_MAP...', 'BUILD SUCCESSFUL IN 0S', 'KEEP CALM AND CODE.'
  ];
  
  const PHRASES_MEME = [
    'GOLDEN CARROT NOT TOTEM', '3 ⊄ VALVE', 'CONNECT POTATO FAILED', 
    'FIXED 90% OF THE BUGS', 'KILL WHITE ZOMBIE', 'NUKE EASY · UH OH', 
    'KA · LE', 'FREE MY PARTNER MOD', 'DRINK MORE LAVA', 'I CAN JVAV', 'THE CAKE IS REAL'
  ];

  // 70% 概率正常，30% 概率触发彩蛋
  const isMeme = Math.random() < 0.3;
  const pool = isMeme ? PHRASES_MEME : PHRASES_NORMAL;
  const text = pool[Math.floor(Math.random() * pool.length)];
  
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'tw-cursor';
  cursor.textContent = '_';
  if(isMeme) cursor.style.color = 'var(--acc-orange-t)';
  el.appendChild(cursor);

  function type() {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text.charAt(i)), cursor);
      i++;
      setTimeout(type, 35 + Math.random() * 50);
    } else {
      // 打字完成
      if (isMeme) {
        // ★ 触发 Syntax Error 彩蛋流程 (瞬间闪现版)
        setTimeout(() => {
          // 1. 红色报错层瞬间闪现 (不再有向上推的动画)
          errOverlay.classList.add('show');
          
          // 2. 等待 1.2 秒 (稍微缩短一点，更符合故障的急促感)
          setTimeout(() => {
            // 3. 瞬间消失
            errOverlay.classList.remove('show');
            
            // 4. 清空当前梗，重新输出一句正常的话
            setTimeout(() => {
              el.innerHTML = '';
              el.appendChild(cursor);
              cursor.style.color = ''; // 恢复默认色
              
              const normalText = PHRASES_NORMAL[Math.floor(Math.random() * PHRASES_NORMAL.length)];
              let j = 0;
              (function retype() {
                if (j < normalText.length) {
                  el.insertBefore(document.createTextNode(normalText.charAt(j)), cursor);
                  j++;
                  setTimeout(retype, 35 + Math.random() * 50);
                } else {
                  setTimeout(() => { cursor.style.display = 'none'; }, 3000);
                }
              })();
            }, 150); // 红屏消失后，稍微停顿一下再重打
          }, 1200); // 红屏停留 1.2 秒
        }, 1500); // 打完后等 1.5 秒再报错
      } else {
        // 正常语句，打完 3 秒后隐藏光标
        setTimeout(() => { cursor.style.display = 'none'; }, 3000);
      }
    }
  }
  
  setTimeout(type, 500);
})();

const h=decodeURIComponent(location.hash.slice(1));
if(h.startsWith('a-')){
  const want=h.slice(2);
  requestAnimationFrame(()=>{
    const t=[...contentEl.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .find(x=>x.textContent.trim()===want||x.textContent.trim().startsWith(want));
    if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  });
}
const pt=sessionStorage.getItem('wikiToast');
if(pt){toast(pt);sessionStorage.removeItem('wikiToast');}
})();