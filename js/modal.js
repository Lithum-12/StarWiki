/* modal.js —— 通用弹窗：正中间弹出 + 背景压暗 */
(function(){
'use strict';
var overlay=null,lastFocus=null;
/* 弹窗自带文案：pages.js 未加载时退回键名 */
var T=function(k,v){ return window.tUI ? window.tUI(k,v) : k; };

function ensure(){
  if(overlay)return overlay;
  overlay=document.createElement('div');
  overlay.className='modal-overlay';
  overlay.innerHTML=
    '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">'+
      '<div class="modal-head">'+
        '<span class="modal-kicker" id="modalKicker">DIALOG</span>'+
        '<button class="modal-close" id="modalClose" type="button" title="'+T('closeBtn')+'" aria-label="'+T('closeModal')+'">×</button>'+
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
  overlay.querySelector('#modalTitle').textContent=opts.title||T('unnamed');
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
      kicker: T('helpKicker'),
      title: T('helpTitle'),
      body:
        '<div class="key-row"><span><kbd>/</kbd></span><span>'+T('keySearch')+'</span></div>'+
        '<div class="key-row"><span><kbd>[</kbd></span><span>'+T('keySide')+'</span></div>'+
        '<div class="key-row"><span><kbd>Esc</kbd></span><span>'+T('keyEsc')+'</span></div>'+
        '<div class="key-row"><span><kbd>?</kbd></span><span>'+T('keyHelp')+'</span></div>'
    });
  }
});
window.WikiModal={open:open,close:close,isOpen:isOpen};
})();