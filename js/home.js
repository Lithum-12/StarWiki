/* home.js —— 独立首页逻辑（支持分组展示） */
(function(){
'use strict';
const PAGES = window.PAGES || [];
const PALETTES = window.PALETTES || {};
const iconOf = window.iconOf || function(){ return ''; };
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* 首页静态文案：先翻译 HTML 里 data-i18n 标记的节点，再渲染卡片 */
window.applyI18N();

const accCls=c=>({teal:'acc-teal',gray:'acc-gray',orange:'acc-orange',purple:'acc-purple',gold:'acc-gold'}[c]||'');

let html = '';
PAGES.forEach((p, groupIdx) => {
  const pal=p.palette?(typeof p.palette==='string'?PALETTES[p.palette]:p.palette):null;
  const groupAccCls=pal?'':accCls(p.tagColor);
  const groupStyle=pal?` style="--card-acc:${pal.brand}"`:'';

  if (p.children && p.children.length > 0) {
    // 有子项目：渲染为分组
    html += `<div class="proj-group">
      <div class="proj-group-head">
        <span class="proj-group-icon">${iconOf(p,'')}</span>
        <h3 class="proj-group-title">${esc(window.t(p.title))}</h3>
        <span class="tag tag-${p.tagColor}">${esc(window.t(p.tag))}</span>
        <span class="proj-group-desc">${esc(window.t(p.desc)||'')}</span>
      </div>
      <div class="proj-grid">`;
    
    // 如果父级本身也有 file，把它作为第一个卡片（概述）
    if (p.file) {
      html += `<a class="proj-card ${groupAccCls}" href="${p.file}"${groupStyle}>
        <span class="proj-top">
          <span class="proj-icon">${iconOf(p,'')}</span>
          <span class="proj-info">
            <span class="proj-row"><span class="proj-date">${window.tUI('overview')}</span></span>
            <span class="proj-title">${esc(window.t(p.title))}</span>
          </span>
        </span>
        <span class="proj-desc">${window.tUI('overviewDesc')}</span>
        <span class="proj-more">README <span class="arr">→</span></span>
      </a>`;
    }

    p.children.forEach((c, i) => {
      html += `<a class="proj-card ${groupAccCls}" href="${c.file}"${groupStyle}>
        <span class="proj-top">
          <span class="proj-icon">${iconOf(c,'')}</span>
          <span class="proj-info">
            <span class="proj-row"><span class="proj-date">${String(groupIdx+1).padStart(2,'0')}.${String(i+1).padStart(2,'0')}</span></span>
            <span class="proj-title">${esc(window.t(c.title))}</span>
          </span>
        </span>
        <span class="proj-desc">${esc(window.t(c.desc)||'')}</span>
        <span class="proj-more">README <span class="arr">→</span></span>
      </a>`;
    });
    html += `</div></div>`;
  } else {
    // 无子项目：独立卡片
    html += `<div class="proj-group"><div class="proj-grid">
      <a class="proj-card ${groupAccCls}" href="${p.file}"${groupStyle}>
        <span class="proj-top">
          <span class="proj-icon">${iconOf(p,'')}</span>
          <span class="proj-info">
            <span class="proj-row">
              <span class="tag tag-${p.tagColor}">${esc(window.t(p.tag))}</span>
              <span class="proj-date">${esc(p.date||'')}</span>
            </span>
            <span class="proj-title">${esc(window.t(p.title))}</span>
          </span>
        </span>
        <span class="proj-desc">${esc(window.t(p.desc)||'')}</span>
        <span class="proj-more">README <span class="arr">→</span></span>
      </a>
    </div></div>`;
  }
});

$('#projGrid').innerHTML = html;

/* 主题切换与终端打字（保持原样） */
$('#themeBtn').addEventListener('click',()=>{
  const cur=document.documentElement.getAttribute('data-theme')||'dark';
  const t=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',t);
  try{localStorage.setItem('wikiTheme',t);}catch(e){}
});

/* ── 语言切换弹窗 ── */
const langBtn=$('#langBtn');
if(langBtn) langBtn.addEventListener('click',window.openLangModal);

/* ── 托管站点切换：没配线路就不留这个按钮 ── */
const hostBtn=$('#hostBtn');
if(hostBtn){
  if((window.HOSTS||[]).length){
    hostBtn.title = window.tUI('hostBtn');
    hostBtn.setAttribute('aria-label', window.tUI('hostBtn'));
    hostBtn.addEventListener('click',window.openHostModal);
  } else hostBtn.remove();
}

const term=$('#termBody');
const LINES=[
  {cmd:true,  t:'whoami'},
  {cmd:false, t:window.tUI('termWho')},
  {cmd:true,  t:'ls ./projects'},
  {cmd:false, t:PAGES.map(p=>window.t(p.title)).join('  ')},
  {cmd:true,  t:'cat motto.txt'},
  {cmd:false, t:window.tUI('termMotto')}
];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function addLine(l){
  const d=document.createElement('div');
  d.className='term-line'+(l.cmd?' cmd':'');
  d.innerHTML=`<span class="tp">${l.cmd?'$':'›'}</span> <span class="out"></span>`;
  term.appendChild(d);
  return d.querySelector('.out');
}
if(reduce){
  LINES.forEach(l=>{addLine(l).textContent=l.t;});
}else{
  const caret=document.createElement('span');caret.className='tcaret';
  term.appendChild(caret);
  let i=0;
  (function next(){
    if(i>=LINES.length)return;
    const l=LINES[i++], out=addLine(l);
    out.after(caret);
    let j=0;
    (function type(){
      if(j<=l.t.length){out.textContent=l.t.slice(0,j++);setTimeout(type,l.cmd?42:24);}
      else setTimeout(next,l.cmd?340:260);
    })();
  })();
}
})();

/* 背景浮动粒子 */
(function spawnParticles(){
  const wrap=document.createElement('div');
  wrap.className='home-particles';
  const colors=['var(--acc-red)','var(--acc-teal)','var(--acc-orange)','var(--c-gray)'];
  for(let i=0;i<18;i++){
    const d=document.createElement('i');
    const size=2+Math.random()*3;
    d.style.cssText='width:'+size+'px;height:'+size+'px;'
      +'left:'+(Math.random()*100)+'%;'
      +'top:'+(60+Math.random()*40)+'%;'
      +'background:'+colors[i%colors.length]+';'
      +'animation-duration:'+(14+Math.random()*18)+'s;'
      +'animation-delay:'+(-(Math.random()*20))+'s;';
    wrap.appendChild(d);
  }
  document.body.appendChild(wrap);
})();
