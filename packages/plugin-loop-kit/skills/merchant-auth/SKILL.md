---
name: merchant-auth
description: 商家态准备与登录 skill。用户需要抖店测试商家登录、fake login、切换或进入指定 shopId、线上真实商家附身、附身抖店、附身罗盘经营、验收前准备商家登录态时使用。本 skill 负责判断商家类型、读取目标 app 的验证配置、执行测试商家登录或线上附身，并输出可供 E2E/验收报告引用的商家态结果。
---

# Merchant Auth

本 skill 负责在验收、联调或页面走查前进入正确商家态。先判断商家类型，再读取对应 reference。

## 路由规则

| 场景 | 读取 |
| --- | --- |
| 测试商家、测试 `shopId`、fake login、抖店测试商家登录 | [test-merchant-login.md](references/test-merchant-login.md) |
| 线上真实商家、商家附身、附身抖店 | [production-merchant-impersonation.md](references/production-merchant-impersonation.md) |

## shopId 与页面配置

测试商家的 `shopId`、访问域名、路由前缀和验证文档优先从目标 app 的 `AGENTS.md` 获取：

1. 根据修改文件定位 app，例如 `apps/<app-name>/...`。
2. 读取 `apps/<app-name>/AGENTS.md` 的「测试与验证配置」节。
3. 组合目标 URL：`访问域名 + 路由前缀 + 路由 path`。
4. 用户明确指定 `shopId`、域名或 URL 时，以用户输入为准。
5. 项目配置和用户输入都缺失时，先询问用户，不要猜测商家。

## 输出记录

记录以下信息，供验收报告引用：

- 商家类型：测试商家 / 线上真实商家
- `shopId`
- 登录或附身目标：抖店 / 罗盘经营
- 最终 URL
- 是否需要权限申请
- 异常提示和重试次数
