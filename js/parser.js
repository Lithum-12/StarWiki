/* Markdown 解析器：纯本地、零依赖。
   用法：MDParser.render(md, { wiki(target, anchor) => href | null }) */
window.MDParser = (function () {
'use strict';
let S = null, opts = null;

/** HTML 转义 */
const escapeHtml = s => s.replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');

/**
 * 提取纯文本（去除 Markdown 标记）
 * @param {string} s - 原始文本
 * @returns {string} 纯文本
 */
function plain(s){
  return s.replace(/`([^`]*)`/g,'$1').replace(/!\[[^\]]*\]\([^)]*\)/g,'')
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g,'$1').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
    .replace(/[*_~=]/g,'').trim();
}
/** 判断是否为表格分隔行 */
function isSep(l){ return /^\s*\|?\s*:?-{2,}[\s:|-]*$/.test(l) && l.includes('-'); }
/** 判断是否为块级元素起始行 */
function isBlockStart(l){
  return /^#{1,6}\s/.test(l)||/^\s*```/.test(l)||/^\s*>/.test(l)
    ||/^\s*(?:[-*+]|\d{1,9}[.)])\s+/.test(l)||/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(l);
}
/** 拆分表格行 */
function splitRow(l){
  l=l.trim(); if(l.startsWith('|'))l=l.slice(1); if(l.endsWith('|'))l=l.slice(0,-1);
  return l.split('|').map(c=>c.trim());
}

/**
 * 行内样式解析（粗体、斜体、链接、代码等）
 * @param {string} text - 行内文本
 * @returns {string} 解析后的 HTML
 */
function inline(text){
  const codes=[]; let s=escapeHtml(text);
  s=s.replace(/`([^`\n]+)`/g,(m,c)=>{codes.push(c);return '\u0001'+(codes.length-1)+'\u0001';});
  s=s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^)]*&quot;)?\)/g,(m,alt,src)=>
    alt?`<figure><img src="${src}" alt="${alt}" loading="lazy"><figcaption>${alt}</figcaption></figure>`
       :`<img src="${src}" alt="" loading="lazy">`);
  /* [[维基链接]] / [[条目|别名]] / [[条目#锚点]] —— 由外部 resolver 给出 href */
  s=s.replace(/\[\[([^\]]+)\]\]/g,(m,inner)=>{
    let target=inner,label=inner; const bar=inner.indexOf('|');
    if(bar>-1){target=inner.slice(0,bar);label=inner.slice(bar+1);}
    let anchor=''; const hash=target.indexOf('#');
    if(hash>-1){anchor=target.slice(hash+1);target=target.slice(0,hash);}
    const href=opts.wiki?opts.wiki(target.trim(),anchor):null;
    return href?`<a class="wikilink" href="${href}">${label}</a>`
               :`<span class="wikilink missing" title="未收录的条目">${label}</span>`;
  });
  s=s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^)]*&quot;)?\)/g,(m,t,href)=>
    /^https?:/i.test(href)?`<a href="${href}" target="_blank" rel="noopener">${t}</a>`:`<a href="${href}">${t}</a>`);
  s=s.replace(/\[\^([^\]\s]+)\]/g,(m,id)=>{
    if(S.fn[id]!==undefined){
      if(!S.fnUsed.includes(id))S.fnUsed.push(id);
      return `<sup class="fnref"><a href="#fn-${id}" id="fnref-${id}">[${S.fnUsed.indexOf(id)+1}]</a></sup>`;
    } return m;
  });
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>');
  s=s.replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/(^|[^_])_([^_\n]+)_/g,'$1<em>$2</em>');
  s=s.replace(/~~([^~]+)~~/g,'<del>$1</del>').replace(/==([^=\n]+)==/g,'<mark>$1</mark>');
  s=s.replace(/\u0001(\d+)\u0001/g,(m,i)=>`<code>${codes[i]}</code>`);
  return s;
}

/**
 * 生成代码块 HTML
 * @param {string} lang - 代码语言
 * @param {string} code - 代码内容
 * @returns {string} 代码块 HTML
 */
function mkCode(lang,code){
  const id='code'+(++S.cb); S.codes[id]=code;
  const lines=code.split('\n').map(l=>`<span class="cl">${escapeHtml(l)||' '}</span>`).join('');
  return `<div class="code-block"><div class="code-bar"><span class="code-lang">${escapeHtml(lang||'text')}</span>`+
         `<button class="copy-btn" data-code="${id}" type="button">复制</button></div><pre><code>${lines}</code></pre></div>`;
}
/**
 * 生成表格 HTML
 * @param {Array} h - 表头数组
 * @param {Array} al - 对齐方式数组
 * @param {Array} rows - 行数据数组
 * @returns {string} 表格 HTML
 */
function mkTable(h,al,rows){
  const cell=(c,tag,k)=>`<${tag}${al[k]?` style="text-align:${al[k]}"`:''}>${inline(c||'')}</${tag}>`;
  let t='<div class="tbl-wrap"><table><thead><tr>'+h.map((c,k)=>cell(c,'th',k)).join('')+'</tr></thead><tbody>';
  rows.forEach(r=>{ t+='<tr>'+h.map((_,k)=>cell(r[k],'td',k)).join('')+'</tr>'; });
  return t+'</tbody></table></div>';
}
/**
 * 解析列表（支持嵌套与任务清单）
 * @param {Array} lines - 行数组
 * @param {number} i - 起始行索引
 * @returns {Array} [HTML, 结束索引]
 */
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
/**
 * 解析块级元素（标题、代码块、引用、表格等）
 * @param {Array} lines - 行数组
 * @returns {string} 解析后的 HTML
 */
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

/**
 * 渲染 Markdown 为 HTML
 * @param {string} src - Markdown 源文本
 * @param {Object} o - 选项（wiki 解析器等）
 * @returns {Object} { html, toc, codes }
 */
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
    html+='<section class="footnotes"><div class="fn-title">参考脚注</div><ol>'+
      S.fnUsed.map(id=>`<li id="fn-${id}">${inline(S.fn[id])}<a class="fnback" href="#fnref-${id}" title="返回正文">↩</a></li>`).join('')+
      '</ol></section>';
  }
  return {html,toc:S.toc,codes:S.codes};
}
return {render,plain};
})();