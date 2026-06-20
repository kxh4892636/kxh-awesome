# url-network-guard-extension

## 技术栈与架构入口

- Chrome Manifest V3 extension。
- `manifest.json` 是扩展入口，声明权限、popup 和 background service worker。
- `background.js` 是后台规则管理入口。
- `popup.html`、`popup.js`、`popup.css` 组成扩展弹窗 UI。

## 关键模块

- `manifest.json`：权限、最低 Chrome 版本、action popup 和 service worker 配置。
- `background.js`：读取黑白名单、计算当前 tab 状态、维护 declarativeNetRequest session rules 和 badge。
- `popup.js`：读取/保存配置、预览当前 URL 命中状态、向 background 发送刷新消息。
- `popup.html`：弹窗 DOM 结构，与 `popup.js` 的 selector 强绑定。
- `popup.css`：弹窗布局和状态样式。

## 项目命令

- 本目录没有 `package.json`，不要硬套 `vp`。
- 常规验证通过 Chrome/Edge 的 Load unpacked 加载本目录完成。

## 生成物

- 当前没有构建产物目录。
- 浏览器加载扩展产生的本地状态不提交到仓库。

## 验证方式

- 改 `manifest.json` 后先验证 JSON 格式，再在浏览器扩展页重新加载。
- 改 background 规则逻辑时，手动测试 blacklist 命中、whitelist 覆盖、禁用开关和 tab 切换。
- 改 popup 时，手动测试保存、计数、状态预览和与 background 的消息交互。
