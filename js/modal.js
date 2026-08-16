/* modal.js —— 通用弹窗：正中间弹出 + 背景压暗 */
(function(){
'use strict';
var overlay=null,lastFocus=null;

function ensure(){
  if(overlay)return overlay;
  overlay=document.createElement('div');
  overlay.className='modal-overlay';
  overlay.innerHTML=
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">'+
      '<div class="modal-head">'+
        '<span class="modal-kicker" id="modalKicker">DIALOG</span>'+
        '<button class="modal-close" id="modalClose" type="button" title="关闭 (Esc)" aria-label="关闭弹窗">×</button>'+
      '</div>'+
      '<h2 class="modal-title" id="modalTitle"></h2>'+
      '<div class="modal-body" id="modalBody"></div>'+
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
  overlay.querySelector('#modalClose').addEventListener('click',close);
  return overlay;
}
function isOpen(){return !!overlay&&overlay.classList.contains('show');}
function open(opts){
  opts=opts||{};
  ensure();
  overlay.querySelector('#modalKicker').textContent=opts.kicker||'DIALOG';
  overlay.querySelector('#modalTitle').textContent=opts.title||'未命名';
  var body=overlay.querySelector('#modalBody');
  if(opts.body instanceof HTMLElement){body.innerHTML='';body.appendChild(opts.body);}
  else body.innerHTML=opts.body||'';
  lastFocus=document.activeElement;
  overlay.classList.add('show');
  document.body.classList.add('modal-open');
  overlay.querySelector('#modalClose').focus();
}
function close(){
  if(!isOpen())return;
  overlay.classList.remove('show');
  document.body.classList.remove('modal-open');
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
/* Esc 优先关弹窗（捕获阶段拦截，不会误触侧栏逻辑） */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&isOpen()){e.stopPropagation();close();}
},true);
/* 演示：按 ? 打开快捷键弹窗 */
document.addEventListener('keydown',function(e){
  var tag=(document.activeElement&&document.activeElement.tagName)||'';
  if(/INPUT|TEXTAREA/.test(tag))return;
  if(e.key==='?'){
    e.preventDefault();
    open({
      kicker:'HELP · KEYBOARD',
      title:'快捷键一览',
      body:
        '<div class="key-row"><span><kbd>/</kbd></span><span>聚焦搜索框</span></div>'+
        '<div class="key-row"><span><kbd>[</kbd></span><span>收起 / 展开侧栏</span></div>'+
        '<div class="key-row"><span><kbd>Esc</kbd></span><span>关闭弹窗 / 侧栏 / 搜索焦点</span></div>'+
        '<div class="key-row"><span><kbd>?</kbd></span><span>打开本帮助</span></div>'
    });
  }
});
window.WikiModal={open:open,close:close,isOpen:isOpen};
})();