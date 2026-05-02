# bun

## 基础

### 安装

```bash
# mac & linux
curl -fsSL https://bun.sh/install | bash
# windows
powershell -c "irm bun.sh/install.ps1|iex"
```

### 更新

```bash
bun upgrade
```

## Monorepo

### 新建项目

```bash
# 新建一个空项目
bun init

# 根据组件/npm/github/本地模板创建项目
bun create
```

### 项目结构

```bash
├── README.md
├── bun.lock
├── package.json
├── tsconfig.json
└── apps # web 应用
    ├── app-a
    │   ├── index.ts
    │   ├── package.json
    │   └── tsconfig.json
└── packages # 内部使用包
    ├── pkg-a
    │   ├── index.ts
    │   ├── package.json
    │   └── tsconfig.json
└── libs # 外部使用包
    ├── lib-a
    │   ├── index.ts
    │   ├── package.json
    │   └── tsconfig.json
```

### Workspace

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "workspaces": [
    "packages/**",
    "!packages/**/test/**",
    "!packages/**/template/**"
  ],
  "devDependencies": {
    "example-package-in-monorepo": "workspace:*"
  }
}
```

### 包管理

#### 安装依赖

```bash
# 安装依赖
bun install
# 全局包
bun install -g <package>
# monorepo package 过滤
bun install --filter './packages/pkg-a'
```

#### 添加依赖

```bash
# 添加依赖
bun add <package>
# 全局包
bun add -g <package> # 等同于 bun install -g <package>
# devDependencies
bun add --dev <package>
# peerDependencies
bun add --peer <package>
# optionalDependencies
bun add --optional <package>
# monorepo package 过滤
bun add --filter './packages/pkg-a' <package>
```

#### 移除依赖

```bash
# 移除依赖
bun remove <package>
# 全局包
bun remove -g <package> # 等同于 bun uninstall -g <package>
```

#### 更新依赖

```bash
# 更新全部依赖
bun update
# 更新制定依赖
bun update <package>
# 交互式
bun update --interactive # -i
# monorepo 全部 package 更新
bun update --recursive # -r
```

#### 自动安装并运行

```bash
# 自动安装并运行
bunx cowsay "Hello world!"
```

### 运行项目

```bash
# 运行
bun run index.ts
# watch mode
bun --watch run index.ts
# package.json 命令
bun [bun flags] run <script> [script flags]
# monorepo package 过滤
bun run --filter 'ba*' <script>
```

### 调试项目

#### 调试命令

```bash
# 调试
bun --inspect index.ts
```

#### vscode 拓展

- [Bun for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)

#### 调试网络请求

- App.tsx 添加环境变量;

```bash
process.env.BUN_CONFIG_VERBOSE_FETCH = "curl";
```

### 打包项目

#### js 打包

```javascript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./build",
});
```

#### cli 打包

```bash
bun build ./index.tsx --outdir ./build
```

#### Tag

- [打包 tag](https://bun.com/docs/bundler#cli)

### 工程化

#### husky & commitlint & biome & lint-staged

```bash
# husky
bun add --dev husky
bunx husky init

# commitlint
bun add -d @commitlint/cli @commitlint/config-conventional
echo "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
echo "bunx commitlint --edit \$1" > .husky/commit-msg

# biome
bun add -D -E @biomejs/biome

# lint-staged
bun add --dev lint-staged
echo "bunx lint-staged" > .husky/pre-commit
```

#### 配置

##### biome

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.9/schema.json",
  "files": {
    "ignoreUnknown": false
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "nursery": {
        "useSortedClasses": "error"
      }
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  }
}
```

##### lint-staged

```javascript
/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc}": [
    "biome check --write --no-errors-on-unmatched", // Format, sort imports, lint, and apply safe fixes
  ],
};
```
