/* Markdown 解析器：纯本地、零依赖。
   用法：MDParser.render(md, { wiki(target, anchor) => href | null }) */
window.MDParser = (function () {
'use strict';
let S = null, opts = null;
/* 解析器自带文案：pages.js 未加载时退回键名 */
const T = (k, v) => (window.tUI ? window.tUI(k, v) : k);

const escapeHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function plain(s){
  return s.replace(/`([^`]*)`/g,'$1').replace(/!\[[^\]]*\]\([^)]*\)/g,'')
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g,'$1').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
    .replace(/[*_~=]/g,'').trim();
}
function isSep(l){ return /^\s*\|?\s*:?-{2,}[\s:|-]*$/.test(l) && l.includes('-'); }
function isBlockStart(l){
  return /^#{1,6}\s/.test(l)||/^\s*```/.test(l)||/^\s*>/.test(l)
    ||/^\s*(?:[-*+]|\d{1,9}[.)])\s+/.test(l)||/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(l);
}
function splitRow(l){
  l=l.trim(); if(l.startsWith('|'))l=l.slice(1); if(l.endsWith('|'))l=l.slice(0,-1);
  return l.split('|').map(c=>c.trim());
}

function inline(text){
  const codes=[];
  const links=[]; // 占位符表：链接 / 图片 / 按钮
  let s=escapeHtml(text);
  
  // 保护行内代码
  s=s.replace(/`([^`\n]+)`/g,(m,c)=>{codes.push(c);return '\u0001'+(codes.length-1)+'\u0001';});
  
  // 保护图片
  s=s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^)]*&quot;)?\)/g,(m,alt,src)=>{
    const html = alt?`<figure><img src="${src}" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`
                    :`<img src="${src}" alt="" loading="lazy">`;
    links.push(html);
    return '\u0003'+(links.length-1)+'\u0003';
  });
  
  // 保护维基链接
  s=s.replace(/\[\[([^\]]+)\]\]/g,(m,inner)=>{
    let target=inner,label=inner; const bar=inner.indexOf('|');
    if(bar>-1){target=inner.slice(0,bar);label=inner.slice(bar+1);}
    let anchor=''; const hash=target.indexOf('#');
    if(hash>-1){anchor=target.slice(hash+1);target=target.slice(0,hash);}
    const href=opts.wiki?opts.wiki(target.trim(),anchor):null;
    const html = href?`<a class="wikilink" href="${href}">${label}</a>`
                     :`<span class="wikilink missing" title="${T('missingWiki')}">${label}</span>`;
    links.push(html);
    return '\u0003'+(links.length-1)+'\u0003';
  });
  
  // 保护普通链接与魔法按钮
  s=s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^)]*&quot;)?\)/g, (m, t, href) => {
    let html;
    if (/^https?:/i.test(href)) html = `<a href="${href}" target="_blank" rel="noopener">${t}</a>`;
    else if (href.startsWith('#modal:')) html = `<button type="button" class="md-btn md-modal" data-modal="${href.slice(7)}">${t}</button>`;
    else html = `<a href="${href}">${t}</a>`;
    links.push(html);
    return '\u0003'+(links.length-1)+'\u0003';
  });
  
  // 保护脚注
  s=s.replace(/\[\^([^\]\s]+)\]/g,(m,id)=>{
    if(S.fn[id]!==undefined){
      if(!S.fnUsed.includes(id))S.fnUsed.push(id);
      const html = `<sup class="fnref"><a href="#fn-${id}" id="fnref-${id}">[${S.fnUsed.indexOf(id)+1}]</a></sup>`;
      links.push(html);
      return '\u0003'+(links.length-1)+'\u0003';
    } 
    return m;
  });

  // 处理粗体、斜体、删除线、高亮 (此时 URL 已被 \u0003 占位符保护，绝对不会被误杀)
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>');
  s=s.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/(^|[^_])_([^_\n]+)_/g,'$1<em>$2</em>');
  s=s.replace(/~~([^~]+)~~/g,'<del>$1</del>').replace(/==([^=\n]+)==/g,'<mark>$1</mark>');
  
  // 还原行内代码
  s=s.replace(/\u0001(\d+)\u0001/g,(m,i)=>`<code>${codes[i]}</code>`);
  
  // 还原所有被保护的链接、图片、按钮
  s=s.replace(/\u0003(\d+)\u0003/g,(m,i)=>links[i]);
  
  return s;
}
function mkCode(lang,code){
  const id='code'+(++S.cb); S.codes[id]=code;
  const lines=code.split('\n').map(l=>`<span class="cl">${escapeHtml(l)||' '}</span>`).join('');
  return `<div class="code-block"><div class="code-bar"><span class="code-lang">${escapeHtml(lang||'text')}</span>`+
         `<button class="copy-btn" data-code="${id}" type="button">${T('copy')}</button></div><pre><code>${lines}</code></pre></div>`;
}
function mkTable(h,al,rows){
  const cell=(c,tag,k)=>`<${tag}${al[k]?` style="text-align:${al[k]}"`:''}>${inline(c||'')}</${tag}>`;
  let t='<div class="tbl-wrap"><table><thead><tr>'+h.map((c,k)=>cell(c,'th',k)).join('')+'</tr></thead><tbody>';
  rows.forEach(r=>{ t+='<tr>'+h.map((_,k)=>cell(r[k],'td',k)).join('')+'</tr>'; });
  return t+'</tbody></table></div>';
}
function parseList(lines,i){
  const baseIndent=lines[i].match(/^\s*/)[0].length, items=[];
  while(i<lines.length){
    const line=lines[i];
    if(/^\s*$/.test(line)){
      const nx=lines[i+1];
      if(nx!==undefined&&!/^\s*$/.test(nx)&&(nx.match(/^\s*/)[0].length>baseIndent
        ||(/^\s*(?:[-*+]|\d{1,9}[.)])\s+/.test(nx)&&nx.match(/^\s*/)[0].length===baseIndent))){i++;continue;}
      break;
    }
    const ind=line.match(/^\s*/)[0].length;
    const m=line.match(/^\s*(?:([-*+])|(\d{1,9})[.)])\s+(.*)$/);
    if(m&&ind===baseIndent){items.push({ordered:!!m[2],text:m[3]});i++;}
    else if(m&&ind>baseIndent){const[sub,ni]=parseList(lines,i);
      if(items.length)items[items.length-1].text+='\n\u0002'+sub;i=ni;}
    else if(ind>baseIndent&&items.length){items[items.length-1].text+='\n'+line.trim();i++;}
    else break;
  }
  const ordered=items.length&&items[0].ordered;
  let html=ordered?'<ol>':'<ul>';
  for(const it of items){
    let t=it.text,cls='',pre='';
    const task=t.match(/^\[( |x|X)\]\s*([\s\S]*)$/);
    if(task){const done=task[1]!==' ';cls=' class="task-li'+(done?' done':'')+'"';
      pre=`<span class="tbox${done?' checked':''}">${done?'✓':''}</span>`;t=task[2];}
    const sm=t.match(/\n?\u0002([\s\S]*)$/); let subHtml='';
    if(sm){subHtml=sm[1];t=t.slice(0,sm.index);}
    html+='<li'+cls+'>'+pre+inline(t).replace(/\n/g,'<br>')+subHtml+'</li>';
  }
  return [html+(ordered?'</ol>':'</ul>'),i];
}
function parseBlocks(lines){
  let out='',i=0,m;
  while(i<lines.length){
    const line=lines[i];
    if(/^\s*$/.test(line)){i++;continue;}
    if(m=line.match(/^\s*```(.*)$/)){
      const lang=m[1].trim(),buf=[];i++;
      while(i<lines.length&&!/^\s*```\s*$/.test(lines[i])){buf.push(lines[i]);i++;}
      i++;out+=mkCode(lang,buf.join('\n'));continue;
    }
    if(m=line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)){
      const lvl=m[1].length,id='sec-'+(++S.h);
      S.toc.push({level:lvl,id,text:plain(m[2])});
      out+=`<h${lvl} id="${id}">${inline(m[2])}</h${lvl}>`;i++;continue;
    }
    if(/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)){out+='<hr>';i++;continue;}
    if(/^\s*>/.test(line)){
      const buf=[];
      while(i<lines.length&&/^\s*>/.test(lines[i])){buf.push(lines[i].replace(/^\s*>\s?/,''));i++;}
      out+='<blockquote>'+parseBlocks(buf)+'</blockquote>';continue;
    }
    if(/^\s*(?:[-*+]|\d{1,9}[.)])\s+/.test(line)){const[h,ni]=parseList(lines,i);out+=h;i=ni;continue;}
    if(line.includes('|')&&i+1<lines.length&&isSep(lines[i+1])){
      const header=splitRow(line);
      const aligns=splitRow(lines[i+1]).map(c=>{c=c.trim();const l=c.startsWith(':'),r=c.endsWith(':');
        return l&&r?'center':r?'right':l?'left':'';});
      i+=2;const rows=[];
      while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()!==''){rows.push(splitRow(lines[i]));i++;}
      out+=mkTable(header,aligns,rows);continue;
    }
    const buf=[line];i++;
    while(i<lines.length&&!/^\s*$/.test(lines[i])&&!isBlockStart(lines[i])
      &&!(lines[i].includes('|')&&i+1<lines.length&&isSep(lines[i+1]))){buf.push(lines[i]);i++;}
    out+='<p>'+inline(buf.join('\n')).replace(/\n/g,'<br>')+'</p>';
  }
  return out;
}

function render(src,o){
  opts=o||{};
  S={toc:[],codes:{},fn:{},fnUsed:[],h:0,cb:0};
  const lines=[];
  String(src).replace(/\r\n?/g,'\n').split('\n').forEach(l=>{
    const m=l.match(/^\[\^([^\]\s]+)\]:\s*(.*)$/);
    if(m)S.fn[m[1]]=m[2]; else lines.push(l);
  });
  let html=parseBlocks(lines);
  if(S.fnUsed.length){
    html+='<section class="footnotes"><div class="fn-title">'+T('footnotes')+'</div><ol>'+
      S.fnUsed.map(id=>`<li id="fn-${id}">${inline(S.fn[id])}<a class="fnback" href="#fnref-${id}" title="${T('fnBack')}">↩</a></li>`).join('')+
      '</ol></section>';
  }
  return {html,toc:S.toc,codes:S.codes};
}
return {render,plain};
})();