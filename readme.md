# 星图百科 · 离线个人 Wiki

> 由兴趣驱动 · 非商业用途 · 欢迎随便看看

一座零依赖、纯静态的个人知识库：Markdown 在浏览器本地解析，无需服务器与构建工具，双击 `index.html` 即可阅读。

## ✦ 功能一览

- **本地解析**：自研 `parser.js`，支持标题 / 列表 / 表格 / 代码块 / 引用 / 脚注 / ==高亮== / `[[维基链接]]`
- **树形目录**：侧栏条目支持 `children` 子项目；图标悬停变箭头，丝滑折叠
- **双主题**：深 / 浅一键切换并记忆；每个条目可绑定独立强调色（红 / 青 / 橙）
- **弹窗系统**：`WikiModal.open()` 正中弹窗 + 背景压暗
- **阅读体验**：顶部进度条、右侧大纲高亮、上一篇 / 下一篇、代码一键复制
- **线路切换**：右上角插头按钮，在热铁盒（中国大陆网速快）与 GitHub Pages（内容最新最全）之间跳转，自动对齐同一页路径；线路表在 `js/pages.js` 的 `HOSTS` 里维护
- **404 页**：输错地址展示同风格缺页（需 HTTP 环境）

## ✦ 目录结构

```text
index.html          首页（分组卡片 + 终端动画 + 粒子）
404.html            同风格缺页
README.md           本文件（也是站内帮助文本）
css/style.css       全站样式与变量
css/home.css        首页专用样式
js/theme.js         主题预载（防闪烁）
js/pages.js         条目注册表 + 配色预设 + 托管线路表
js/parser.js        Markdown 解析器
js/app.js           条目页外壳与交互
js/home.js          首页逻辑
js/modal.js         通用弹窗
pages/*.html        每个条目一页（正文写在 text/markdown 块里）
img/                插图与图标
```

## ✦ 新增条目三步

1. 复制任意 `pages/*.html`，修改 `data-page` 与 `<script type="text/markdown">` 里的正文；
2. 在 `js/pages.js` 的 `PAGES` 中登记：`key / file / title / tag / tagColor / palette / desc`；
3. 可选：`children:[...]` 挂子项目；`icon:'img/xx.png'` 自定义图标（图片缺失自动回退默认 SVG）。

## ✦ 快捷键

| 按键 | 功能 |
| :-: | --- |
| `/` | 聚焦搜索框 |
| `[` | 收起 / 展开侧栏 |
| `Esc` | 关闭弹窗 / 侧栏 / 搜索焦点 |
| `?` | 打开本帮助 |

## ✦ 本地运行

- 双击 `index.html` 即可（`file://` 协议）；
- 需要自定义 404 时：`node server.js` 或 `npx serve`，或部署到 GitHub Pages / Netlify。

## ✦ 说明

- 全站无框架、无统计、无网络请求；本地导入功能默认关闭（`IMPORT_ENABLED=false`）。
- 个人项目，仅供学习交流，不用于任何商业用途。