#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const readInput = () => {
  const raw = fs.readFileSync(0, "utf8");
  if (!raw.trim()) {
    return {};
  }

  try {
    // 插件钩子通过标准输入传入事件数据；格式错误时按空事件处理，
    // 避免影响无关的会话启动流程。
    const payload = JSON.parse(raw);
    return payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  } catch {
    return {};
  }
};

const projectRoot = (cwd) => {
  const resolved = path.resolve(cwd);

  try {
    // 优先通过版本库解析项目根目录，确保从子目录启动的会话仍写入项目根的计划文档。
    const root = execFileSync("git", ["-C", resolved, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim();
    return root ? path.resolve(root) : resolved;
  } catch {
    return resolved;
  }
};

const planDocumentPath = ({ cwd, sessionId }) =>
  path.join(projectRoot(cwd), "docs", "plan", `${sessionId}.md`);

const startupContext = ({ cwd, sessionId }) => {
  const currentPlanDocumentPath = planDocumentPath({ cwd, sessionId });
  return [
    "<meta-context>",
    `- Current session_id: ${sessionId}`,
    `- Plan document path: ${currentPlanDocumentPath}`,
    "- If the user invokes the grilling skill for planning, resolve decision dependencies before creating a TaskList.",
    "- When the to-plan skill is used, create or update the plan document at the path above.",
    "</meta-context>",
  ].join("\n");
};

const compactContext = ({ cwd, sessionId }) => {
  const currentPlanDocumentPath = planDocumentPath({ cwd, sessionId });
  if (!fs.existsSync(currentPlanDocumentPath)) {
    // 压缩恢复是可选增强；没有既有计划文档时不注入额外上下文，
    // 也不把会话启动钩子视为失败。
    return undefined;
  }

  let document;
  try {
    document = fs.readFileSync(currentPlanDocumentPath, "utf8").replace(/^\uFEFF/, "");
  } catch {
    return undefined;
  }

  return [
    "<meta-context>",
    `- Current session_id: ${sessionId}`,
    `- Plan document path: ${currentPlanDocumentPath}`,
    "- If the user invokes the grilling skill for planning, resolve decision dependencies before creating a TaskList.",
    "- When the to-plan skill is used, create or update the plan document at the path above.",
    "You must immediately use the to-plan skill and read the plan document.",
    "After any TaskList task is completed, update the corresponding plan document sections.",
    "<plan_document>",
    document.trimEnd(),
    "</plan_document>",
    "</meta-context>",
  ].join("\n");
};

const emitContext = (context) => {
  // 运行时只从这个会话启动输出结构读取附加上下文。
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: context,
      },
    }),
  );
};

const main = () => {
  const payload = readInput();
  const source = String(payload.source ?? "");
  const cwd = String(payload.cwd ?? process.cwd());
  const sessionId = String(payload.session_id ?? "").trim();

  if (!sessionId) {
    // 会话标识是插件运行时契约，不再从本地索引推断。
    throw new Error("SessionStart payload is missing session_id.");
  }

  const context =
    source === "startup"
      ? startupContext({ cwd, sessionId })
      : source === "compact"
        ? compactContext({ cwd, sessionId })
        : undefined;

  if (context) {
    emitContext(context);
  }
};

main();
