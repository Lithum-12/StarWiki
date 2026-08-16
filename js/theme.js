/* theme.js —— 主题初始化：优先读取本地存储，其次跟随系统偏好 */
(function () {
  try {
    var t = localStorage.getItem('wikiTheme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
