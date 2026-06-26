---
name: code-spec
description: 代码规范与专项开发指南。执行 html/css/js/ts/react/vue 前端开发、React 组件、接口请求、Zod 校验、TanStack Query/react-query、Vite+/vp、Ant Design/antd、第三方依赖或代码注释规范任务时触发；当前通用规范以前端为主，包含增量代码说明性注释比例约束，专项规范通过 references 下的参考模块渐进披露。关键词：代码规范、注释规范、说明性注释、前端、React、Vue、TypeScript、接口请求、Zod、zod、TanStack Query、react-query、useQuery、useMutation、Vite+、vp、Ant Design、antd。
---

# code-spec

## 使用方式与渐进式披露

先判断“什么算完成”，再选择需要读取的规范层级：

1. 所有代码开发任务先读本文件，确认本次任务属于前端通用规范、组件体系专项规范、数据校验专项规范、服务端状态专项规范还是工具链规范。
2. 前端开发任务使用本文的项目结构、命名、组件、请求和检查规范；当前通用规范以前端 TypeScript 项目为主。
3. 任务涉及 Vite+/vp 时，先看本文的 Vite+ 工具链规范；只有具体命令、配置或故障细节不确定时，再读 `references/vite-plus/README.md` 和对应参考。
4. 任务涉及 Ant Design/antd 组件、主题、Form/Table、语义化 DOM、`classNames` 或 `styles` 时，读取 `references/antd/README.md`，再按需读取 `references/antd/references/component-map.md`、`references/antd/references/semantic-map.md` 和对应拆分文档。
5. 任务涉及 Zod schema、运行时校验、parse/safeParse、错误格式化、JSON Schema、codec、transform 或 Zod 迁移时，读取 `references/zod/README.md`，再按需读取 `references/zod/references/doc-map.md` 和具体官方 docs 快照。
6. 任务涉及 TanStack Query / React Query、QueryClient、useQuery、useMutation、queryKey、invalidateQueries、SSR/hydration、Suspense、乐观更新或服务端状态缓存时，读取 `references/react-query/README.md`，再按需读取 `references/react-query/references/doc-map.md` 和具体官方 docs 快照。
7. 只有任务涉及 React 组件、Hook、状态、数据请求、bundle、首屏渲染、交互性能或代码评审时，读取 `references/react/README.md`，再按需读取单条 React 规则。
8. 外部官方文档只在 API 不确定、版本差异可能影响实现、或用户明确要求查证时读取；内部依赖优先搜索项目内现有用法。

## 规范分层

- 本文件承载对外唯一暴露的 `code-spec` skill 入口和前端规范主体；后续新增通用后端规范时直接补充在本 skill 中。
- `references/zod/` 是 Zod 数据校验专项参考模块，保留官方 docs 快照、路由索引和刷新脚本。
- `references/react-query/` 是 TanStack Query React 服务端状态专项参考模块，保留官方 docs 快照、路由索引和刷新脚本。
- `references/vite-plus/` 是工具链参考模块；`references/antd/` 是组件体系参考模块，父文件只保留常用规则和路由入口。

以下项目结构提供前端 TypeScript 项目的默认组织方式；命名、代码、React、HTTP 请求和检查规范仍以前端 TypeScript 项目为主。

## 项目结构

### 前端项目结构

```
src/
├── main.tsx          # React DOM 入口，挂载 <App />
├── app.tsx           # 应用外壳：全局 Provider（QueryClient、Router 等）
├── index.css         # 全局样式（如 @import "tailwindcss"）
├── assets/           # 静态资源（图片、SVG、字体等）
├── common/           # 共享常量、类型、枚举、配置等
├── components/       # 可复用 UI 组件
├── hooks/            # 自定义 Hook（数据请求、业务逻辑封装）
├── pages/            # 页面级组件
│   └── [page-name]/  # 页面组件，每个页面对应一个路由
│       ├── index.tsx  # 页面组件文件
│       ├── components/ # 页面内部私有组件目录
│       └── ...        # 与 src 目录结构一致
├── routes/           # 路由定义（每个路由文件导出对应页面组件）
├── stores/           # 状态管理（Zustand store 等）
├── api/              # 外部网络请求（如 fetch、axios 等）
├── libs/              # 第三方组件体系需要的共享工具
└── utils/            # 纯工具函数
```

## 命名规范

- 文件命名使用 `kebab-case`;
- 变量/函数：`camelCase`
- 类/接口/枚举/泛型参数：`PascalCase`
- React 组件：`PascalCase`
- 常量：`UPPER_SNAKE_CASE`
- CSS 类名选择器：`kebab-case`
- 布尔变量：`is/has/should` 前缀
- React 组件事件属性：`on` + 元素名 + 事件动词
- React 组件事件处理函数：`handle` + 元素名 + 事件动词

## 代码规范

### 文件限制;

- 单个文件不超过 377 行, 超过进行拆分;

### TypeScript 规范

- 使用 TypeScript 编写代码;
- 不允许使用 `any`，可使用 `ISafeAny` 代替;

```typescript
type ISafeAny = any;
```

### 函数规范

- 函数只能使用箭头函数, 不能使用普通函数;
- 函数参数和返回值必须使用类型注解, 函数参数统一定义为 `params`, 并在函数参数中使用解构赋值;
- 单个函数不超过 89 行, 超过 89 行进行代码拆分;

### 注释规范

- 注释只写说明性注释, 解释代码背后的原因、约束、取舍和风险, 即说明 Why;
- 禁止用注释复述代码正在做什么或如何执行, 即不写 What 和 How 类型的功能性注释;
- 注释比例只约束本次新增或修改的增量代码, 存量代码不受限制;
- 增量代码的注释行数占代码行数比例必须在 13% 到 21% 之间, 不需要为了接近上限而补注释;
- 计算比例时不统计空行、纯括号/分隔符行、import/export 声明和仅格式化导致的行变化;
- 注释行只统计本次新增或修改的说明性代码注释, 不统计文档块、TODO、lint 禁用指令或生成代码注释;
- 小于 8 行的增量代码允许不强制满足注释比例, 但仍禁止冗余功能性注释;

### 杂项

- 禁止使用 enum, 使用 const = {} as const 替代;
  - 枚举和枚举值的命名均使用 PascalCase;
- 模块导出/导入时, 除非框架需要默认导出/导入, 否则一律使用命名导出/导入;
- 任何数据类型, 使用其属性/方法, 必须使用 `?` 可选链操作符, 避免空指针异常;
- 使用第三方数据时, 例如 API 调用, 数据库查询, SDK 调用等, 必须使用 try-catch 包裹, 并在 catch 中使用 console.error 记录异常;

## React 规范

### 组件规范

- 组件属性必须有接口声明，命名为 `[ComponentName]Props`
  - 组件属性只使用 props 来定义, 组件内部使用解构赋值来获取 props;
- 使用 tailwindcss 或者 css modules;
  - 查询 package.json, 确认是否引入 tailwindcss, 优先使用 tailwindcss;
- 单个组件行数不超过 233 行, 超过进行组件拆分;
- 使用函数组件, 命名导出, 组件最外层目录使用 index.ts 统一导出组件;
- 组件内部的代码顺序如下:

```typescript
interface MyComponentProps {prop1: string; prop2: number;}

export const MyComponent: React.FC<MyComponentProps> = (props: MyComponentProps) => {
    // 属性解构
    const { prop1, prop2 } = props;

    // 功能逻辑块 1
    // 1. 状态变量, 如 useState, useRef, zustand;
    // 2. 自定义 hook, 如业务逻辑, 网络请求等;
    // 3. useEffect 依赖的函数, 按需使用 useMemo, useCallback 缓存;
    // 4. 副作用/生命周期 (useEffect);
    // 5. useEffect 无依赖的内部函数 (工具函数/事件处理), 按需使用 useMemo, useCallback 缓存;

    // 功能逻辑块 2
    // ...

    // UI 渲染逻辑
    return (<div></div>);
}
```

### 组件库规范

- 已经统一使用 Ant Design 的既有项目继续使用 `antd`；涉及组件 API、主题 token、Form/Table 复杂行为、`classNames`/`styles` 或语义化 DOM 时读取 `references/antd/README.md` 和本地中文官方文档快照;
- 已经统一使用内部 PC 组件库的既有项目可继续使用 `@ecom/auxo`，但不要在同一应用中再引入另一套 PC 组件库;
- H5 应用使用 `@ecom/auxo-mobile` 或者 `@arco-design/mobile-react`;
- 高级组件：`@ecom/auxo-pro-table`、`@ecom/auxo-pro-form`;
- 禁止在同一应用中混用不同的组件库;

## Vite+ 工具链规范

- Vite+ 是前端项目的统一入口，`vp` 负责依赖、开发、构建、检查、测试和任务执行；不要把 Vite+ 项目当作普通 Vite 项目绕过;
- 常规开发命令：`vp install` 安装依赖，`vp dev` 启动开发，`vp check` 格式化/lint/type check，`vp test` 跑测试，`vp build` 构建产物;
- Vite+ 配置统一放在 `vite.config.ts` 的 `defineConfig` 中，优先使用静态对象配置；不要新增 `vitest.config.ts`、`oxlintrc.json`、`oxfmtrc.json` 或 `tsdown.config.ts` 来分散配置;
- 内置命令不能覆盖；需要运行项目脚本或自定义任务时使用 `vp run <script>` 或 `vpr <script>`;
- 测试工具从 `vite-plus/test` 导入，不直接从 `vitest` 导入，除非当前项目明确不是 Vite+ 项目;
- 代码任务完成后按项目上下文执行 `vp check` 和 `vp test`，并检查是否需要通过 `vp run <script>` 运行 `package.json` 或 `vite.config.ts` 中的任务;
- 需要命令、配置、迁移、CI、IDE 或排障细节时，先读 `references/vite-plus/references/source-map.md`，再打开 `references/vite-plus/references/source-docs/guide/` 或 `references/vite-plus/references/source-docs/config/` 下的对应上游快照文件。

### React 性能规范

- 执行 React 组件、Hook、状态、数据请求、bundle 体积、首屏渲染、交互性能相关任务时，按需读取 `references/react/README.md`;
- `references/react/` 是本 skill 的 React 子参考内容，不是独立 skill；其结构为 `README.md`、`rules/_sections.md`、`rules/_template.md`、一条规则一个 Markdown 文件;
- `references/react/` 只包含通用 React / Vite 前端规则，源规则中只适用于特定框架的内容已删除;
- 实现时先遵守本文件已有的项目结构、命名、组件和请求规范，再使用 `references/react/rules/*.md` 中的详细规则补充性能、重渲染和渲染细节;

## 数据校验与服务端状态专项规范

当前 Zod 与 TanStack Query 规范通过 references 渐进披露，父文件只保留常用分流入口。

| 任务 | 先读 | 继续按需读取 |
|------|------|--------------|
| Zod schema、运行时校验、parse/safeParse、ZodError、refine/superRefine、transform、codec、JSON Schema 或 Zod 迁移 | `references/zod/README.md` | `references/zod/references/doc-map.md` 和 `references/zod/references/source-docs/` 中的相关文件 |
| TanStack Query / React Query、QueryClient、useQuery、useMutation、useInfiniteQuery、queryKey、invalidateQueries、SSR/hydration、Suspense、乐观更新或持久化 | `references/react-query/README.md` | `references/react-query/references/doc-map.md` 和 `references/react-query/references/source-docs/` 中的相关文件 |

- Zod 任务先确认校验发生在请求、表单、环境变量、外部 API 响应还是持久化 JSON 边界，再决定 schema 与错误形态。
- React Query 任务先确认现有 `QueryClient`、query key 约定、请求封装、错误处理和 SSR 框架，再新增 hook 或缓存策略。

## HTTP 请求规范

### 规则

- 优先用 ConnectRPC 生成的调用接口；
- 其次优先使用 BAM 调用接口；
- 只有在缺少对应 API 或临时接入时才使用 `request(...)/fetch` 调用 HTTP 接口;
- 搜索同一项目中的网络请求函数, 仿照其实现方式;

### 请求流程

1. 使用 ConnectRPC 或者 BAM 或者 request(...)/fetch() 封装 HTTP 接口请求函数;
2. 基于封装后的请求函数, 使用 `ahook` 或者 `react-query` 生成对应的 hook;
3. 在组件中使用 hook 来调用接口;

涉及 React Query 具体 API、query key、mutation/invalidation、SSR/hydration、Suspense 或缓存策略时，先读取 `references/react-query/README.md`，不要只凭示例扩展复杂行为。

### hook 示例

#### 规则

- 使用 try-catch 包裹请求函数, 并在 catch 中使用 console.error 记录异常, 并返回与返回值类型相同的空值;
- 明确 hook 的参数和返回值类型;

#### react-query

```tsx
export const useGetCaseList = (params: CaseItemEnumReq) => {
  const caseQueryClient = useQuery({
    queryKey: ["case", params],
    queryFn: async () => {
      try {
        const res = await getCaseList(params);
        return res?.case_list || [];
      } catch (error) {
        console.error("getCaseList error", error);
        throw error;
      }
    },
  });

  return {
    ...caseQueryClient,
  };
};
```

#### ahook

```tsx
import { GetItemList } from "@govern-public/api-ippro";
import { useRequest } from "ahooks";

export const useGetItemList = (params: GetItemListReq) => {
  const requestClient = useRequest(() => {
    try {
      return GetItemList(params) || [];
    } catch (error) {
      console.error("getItemList error", error);
      throw error;
    }
  });

  return {
    ...requestClient,
  };
};
```

#### ConnectRPC

```tsx
import { useQuery } from "@tanstack/react-query";
import { postsClient } from "../api/client";

export const usePosts = (random = true) => {
  const query = useQuery({
    queryKey: ["posts", random],
    queryFn: () => {
      try {
        return postsClient.getPosts({ random });
      } catch (error) {
        console.error("getPosts error", error);
        throw error;
      }
    },
  });
  const { data, ...rest } = query;

  return {
    ...rest,
    data: data?.posts,
  };
};
```

## 外部依赖官方文档

遇到以下依赖的使用问题或 API 查询时，优先查阅对应的官方文档：

| 依赖 | 官方文档 |
|------|----------|
| React | https://react.dev/ |
| TypeScript | https://www.typescriptlang.org/docs/ |
| Tailwind CSS | https://tailwindcss.com/docs |
| Ant Design / antd | 先看 `references/antd/README.md` 和本地中文官方文档快照，再查 https://ant.design/components/overview-cn/ |
| Zustand | https://zustand.docs.pmnd.rs/ |
| Zod | 先看 `references/zod/README.md` 和本地 docs 快照，再查 https://zod.dev/ |
| @tanstack/react-query | 先看 `references/react-query/README.md` 和本地 React docs 快照，再查 https://tanstack.com/query/latest/docs |
| @tanstack/react-router | https://tanstack.com/router/latest/docs |
| dayjs | https://day.js.org/ |
| es-toolkit | https://es-toolkit.slash.page/ |
| ahooks | https://ahooks.js.org/ |
| @arco-design/mobile-react | https://arco.design/mobile/react |
| Vite | https://vite.dev/ |
| Vitest | https://vitest.dev/ |
| Vite+ (vp) | 先看本文的 Vite+ 工具链规范，再查 `node_modules/vite-plus/docs` 或 https://viteplus.dev/guide/ |
| Docusaurus | https://docusaurus.io/docs |
| ConnectRPC | https://connectrpc.com/docs/web/getting-started |
| @connectrpc/connect | https://www.npmjs.com/package/@connectrpc/connect |
| @bufbuild/protobuf | https://buf.build/docs/protobuf-es |

> **内部依赖**（无公开文档）：@ecom/auxo、@ecom/auxo-mobile、@ecom/auxo-pro-table、@ecom/auxo-pro-form、BAM。遇到这些库的问题时，搜索项目内现有用法作为参考。

## 检查与修复

- 代码开发任务执行完成后, 必须执行代码检查和修复;
- 只对 git change 中的代码进行检查和修复, 禁止检查其他代码;
