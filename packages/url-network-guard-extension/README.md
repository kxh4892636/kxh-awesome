# URL Network Guard

一个无框架 Chrome/Chromium Manifest V3 扩展。它根据当前标签页 URL 判断是否阻断该标签页页面发起的网络请求。

## 功能

- 支持全局开启和关闭；关闭时保留规则配置，但移除所有当前阻断规则。
- 黑名单和白名单都支持多个字符串。
- 分隔符支持空格、Tab、回车、换行和英文逗号。
- 使用 URL 字符串包含关系匹配。
- 白名单优先级高于黑名单。
- 命中黑名单且未命中白名单时，扩展为当前 tab 添加 `declarativeNetRequest` session rule。
- 命中白名单、未命中规则、跳转离开或关闭 tab 时，扩展会移除对应阻断规则。

## 加载

1. 打开 `chrome://extensions`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本目录：`packages/url-network-guard-extension`。

## 手动验证

### 黑名单阻断

1. 打开 `https://example.com/`。
2. 打开扩展 popup，在黑名单输入 `example.com`，白名单留空，点击“保存”。
3. 打开 DevTools Console，执行：

```js
fetch("https://example.org/?t=" + Date.now(), { mode: "no-cors" }).catch(console.error);
const image = new Image();
image.src =
  "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png?t=" +
  Date.now();
document.body.append(image);
```

预期：Network 面板中请求被扩展或客户端阻断，通常可看到 `net::ERR_BLOCKED_BY_CLIENT`。

### 白名单覆盖黑名单

1. 保持当前页为 `https://example.com/`。
2. 黑名单输入 `example.com`，白名单也输入 `example.com`，点击“保存”。
3. 重新执行上面的 Console 代码。

预期：请求允许发出，popup 状态显示“允许：example.com”。

### 功能关闭

1. 黑名单输入 `example.com`，白名单清空，点击“保存”。
2. 关闭 popup 中的开关。
3. 重新执行上面的 Console 代码。

预期：popup 状态显示“已关闭”，请求允许发出；再次打开开关后，按当前黑白名单重新阻断。

### 跳转清理

1. 黑名单保留 `example.com`，白名单清空。
2. 从 `https://example.com/` 跳转到 `https://www.wikipedia.org/`。
3. 打开 popup。

预期：状态显示“未命中”，该 tab 不再保留阻断规则。

## 边界

- 第一版不阻断页面主导航本身，主要阻断页面已加载后发起的子资源、fetch/XHR、脚本、图片、媒体、WebSocket 等请求。
- Manifest V3 service worker 在导航后安装规则，极早发起的请求可能早于规则生效。
- 非普通网页 URL，例如 `chrome://`、`edge://`、`about:` 和扩展自身页面，不会安装阻断规则。
