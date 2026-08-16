/* home.js —— 独立首页逻辑（支持分组展示） */
(function(){
'use strict';
const PAGES = window.PAGES || [];
const PALETTES = window.PALETTES || {};
const iconOf = window.iconOf || function(){ return ''; };
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/** 根据标签颜色返回对应的强调类名 */
const accCls=c=>({teal:'acc-teal',gray:'acc-gray',orange:'acc-orange'}[c]||'');

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
        <h3 class="proj-group-title">${esc(p.title)}</h3>
        <span class="tag tag-${p.tagColor}">${esc(p.tag)}</span>
        <span class="proj-group-desc">${esc(p.desc||'')}</span>
      </div>
      <div class="proj-grid">`;
    
    // 如果父级本身也有 file，把它作为第一个卡片（概述）
    if (p.file) {
      html += `<a class="proj-card ${groupAccCls}" href="${p.file}"${groupStyle}>
        <span class="proj-top">
          <span class="proj-icon">${iconOf(p,'')}</span>
          <span class="proj-info">
            <span class="proj-row"><span class="proj-date">OVERVIEW · 概述</span></span>
            <span class="proj-title">${esc(p.title)}</span>
          </span>
        </span>
        <span class="proj-desc">查看该主题的整体介绍与入口。</span>
        <span class="proj-more">README <span class="arr">→</span></span>
      </a>`;
    }

    p.children.forEach((c, i) => {
      html += `<a class="proj-card ${groupAccCls}" href="${c.file}"${groupStyle}>
        <span class="proj-top">
          <span class="proj-icon">${iconOf(c,'')}</span>
          <span class="proj-info">
            <span class="proj-row"><span class="proj-date">${String(groupIdx+1).padStart(2,'0')}.${String(i+1).padStart(2,'0')}</span></span>
            <span class="proj-title">${esc(c.title)}</span>
          </span>
        </span>
        <span class="proj-desc">${esc(c.desc||'')}</span>
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
              <span class="tag tag-${p.tagColor}">${esc(p.tag)}</span>
              <span class="proj-date">${esc(p.date||'')}</span>
            </span>
            <span class="proj-title">${esc(p.title)}</span>
          </span>
        </span>
        <span class="proj-desc">${esc(p.desc||'')}</span>
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

const term=$('#termBody');
const LINES=[
  {cmd:true,  t:'whoami'},
  {cmd:false, t:'一个把笔记慢慢攒成 wiki 的普通人'},
  {cmd:true,  t:'ls ./projects'},
  {cmd:false, t:PAGES.map(p=>p.title).join('  ')},
  {cmd:true,  t:'cat motto.txt'},
  {cmd:false, t:'"由兴趣驱动 · 非商业用途 · 欢迎随便看看"'}
];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/**
 * 向终端添加一行输出
 * @param {Object} l - 行数据 { cmd, t }
 * @returns {HTMLElement} 输出元素
 */
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
