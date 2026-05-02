# Plasmo

## 基础

### 安装

```bash
npm install plasmo
```

### 模板

```bash
bun create plasmo
```

### 基本命令

```bash
# 运行项目
bun dev
# 打包项目
bun build
# 打包为 zip 文件
bun package
```

## 扩展页面

### 插件弹窗

- popup.tsx or popup/index.tsx;

### 侧边栏

- sidepanel.tsx or sidepanel/index.tsx;

## 内容脚本

### 内容脚本

- 页面上下文的 js 脚本;
- content.ts or contents/xxx.ts;

### 脚本配置

- Plasmo 的默认将所有源文件视为模块;
- content.ts 必须添加 `export default {}` 导出空对象;

### 页面限制配置

```typescript
import type { PlasmoCSConfig } from "plasmo"
 
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}
```

### 注入 window 对象

#### 定义 word 属性

```typescript
import type { PlasmoCSConfig } from "plasmo"
 
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN"
}
```

#### 添加权限

```json
{
  ...
  "manifest" : {
    "permissions": ["scripting"]
  }
}
```

#### 注入

```typescript
chrome.scripting.executeScript(
  {
    target: {
      tabId // the tab you want to inject into
    },
    world: "MAIN", // MAIN to access the window object
    func: windowChanger // function to inject
  },
  () => {
    console.log("Background script got callback after injection")
  }
)
```

### 内容脚本 UI

#### 定义 UI 组件

- 页面上下文的弹窗 UI;
- content.tsx or contents/xxx.tsx;

#### 定义 UI 样式

- 使用 data-text schema 导入 css 文本;
- 使用 getStyle 注入 css 样式;

```typescript
import cssText from "data-text:~/contents/plasmo-overlay.css"
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.plasmo.com/*"],
  css: ["font.css"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const PlasmoOverlay = () => {
  return (
    <span
      className="hw-top"
      style={{
        padding: 12
      }}>
      CSUI OVERLAY FIXED POSITION
    </span>
  )
}

export default PlasmoOverlay
```

## 背景脚本

### 背景脚本

- service worker 中的 js 脚本, 无跨域问题;
- background.ts or background/index.ts;

### 脚本配置

- Plasmo 的默认将所有源文件视为模块;
- background.ts 必须添加 `export default {}` 导出空对象;

## Messaging API

### Messaging API

- chrome.runtime.onMessage 和 chrome.runtime.sendMessage 的封装;

### 安装

```bash
bun add @plasmohq/messaging
```

### 目录约束

- background 文件夹中;
- message 默认存在 name 属性, 使用文件名作为 name;

```bash
├── background
│   ├── index.ts
│   └── messages
│       └── ping.ts
```

### 使用示例

```typescript
import type { PlasmoMessaging } from "@plasmohq/messaging"
 
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const message = await querySomeApi(req.body.id)
  res.send({
    message
  })
}
 
export default handler
```

```typescript
import type { PlasmoMessaging } from "@plasmohq/messaging"
import { sendToBackground } from "@plasmohq/messaging"
 
const resp = await sendToBackground({
  name: "ping",
  body: {
    id: 123
  }
})
```

## Storage API

### Storage API

- chrome.storage API 的封装;


### 安装

```bash
bun add @plasmohq/storage
```

### 基本使用

#### crud

```typescript
import { Storage } from "@plasmohq/storage"
 
const storage = new Storage()
 
await storage.set("key", "value")
const data = await storage.get("key") // "value"
 
await storage.set("capt", { color: "red" })
const data2 = await storage.get("capt") // { color: "red" }
```

#### 监听

```typescript
storage.watch({
  "serial-number": (c) => {
    console.log(c.newValue)
  },
  make: (c) => {
    console.log(c.newValue)
  }
})
```

### hook 形式

```typescript
import { useStorage } from "@plasmohq/storage/hook"

const [hailingFrequency, setHailingFrequency, {
  setRenderValue,
  setStoreValue,
  remove
}] = useStorage("hailing")
 
return <>
  <input value={hailingFrequency} onChange={(e) => setRenderValue(e.target.value)}/>
  <button onClick={() => setStoreValue()}>
    Save
  </button>
  <button onClick={() => remove()}>
    Remove
  </button>
</>
```

## 导入 Schemas

- raw: 文件分配一个 hash;
- url: 针对文件进行优化, 分配一个 hash;
- data-text: 导入文件内容作为字符串, 并对文件进行优化;
- data-base64: 导入文件内容作为 base64 字符串, 并对文件进行优化;
- react:*.svg: 导入 svg 文件内容作为 react 组件;

```typescript
// raw
import imageUrl from "raw:~/assets/image.png"
console.log(imageUrl) // chrome-extension://<extension-id>/image.<hashA>.png

// url
import styleAUrl from "url:~/a/style.scss"
import styleBUrl from "url:~/b/style.scss"
import codeUrl from "url:~/c/index.ts"
console.log(styleAUrl) // chrome-extension://<extension-id>/style.<hashA>.css
console.log(styleBUrl) // chrome-extension://<extension-id>/style.<hashB>.css
console.log(codeUrl) // chrome-extension://<extension-id>/file.<hashB>.js

// data-text
import styleText from "data-text:~/assets/style.scss"
console.log(styleText)
// {
//   "color": "red",
// }

// data-base64
import imageBase64 from "data-base64:~/assets/image.png"
console.log(imageBase64)
// data:image/png;base64,etc...

// react:*.svg
import Logo from "react:~/assets/logo.svg"
const Hello = () => <Logo />
```

## 插件图标

- assets/icon.png 文件;
- dev 环境转换为灰度图;