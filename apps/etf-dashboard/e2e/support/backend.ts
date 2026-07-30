import { execFile, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const BACKEND_URL = "http://localhost:8080";
export const BACKEND_HEALTH_URL = `${BACKEND_URL}/`;

// 本文件位于 apps/etf-dashboard/e2e/support/,后端源码在 apps/etf-service。
const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
const RUNTIME_DIR = path.join(E2E_DIR, ".backend");
const STATE_PATH = path.join(RUNTIME_DIR, "state.json");
const BINARY_PATH = path.join(RUNTIME_DIR, "etf-service-e2e.exe");
const LOG_PATH = path.join(RUNTIME_DIR, "backend.log");
const SERVICE_DIR = path.resolve(E2E_DIR, "../../../etf-service");

export interface BackendState {
  /** external: 复用外部已运行的服务,不拥有其生命周期;managed: 由本测试进程拉起并负责回收。 */
  mode: "external" | "managed";
  pid?: number;
  binaryPath?: string;
}

const HEALTH_POLL_INTERVAL_MS = 500;

/** 探测 :8080 是否已有健康的 etf-service。 */
export const isBackendHealthy = async (): Promise<boolean> => {
  try {
    const response = await fetch(BACKEND_HEALTH_URL, {
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as { ok?: boolean };
    return body.ok === true;
  } catch {
    return false;
  }
};

export const waitForBackendHealthy = async (timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isBackendHealthy()) return;
    await new Promise((resolve): void => {
      setTimeout(resolve, HEALTH_POLL_INTERVAL_MS);
    });
  }
  throw new Error(`etf-service 在 ${timeoutMs}ms 内未恢复健康 (${BACKEND_HEALTH_URL})`);
};

export const readBackendState = (): BackendState | null => {
  if (!existsSync(STATE_PATH)) return null;
  return JSON.parse(readFileSync(STATE_PATH, "utf-8")) as BackendState;
};

export const writeBackendState = (state: BackendState): void => {
  mkdirSync(RUNTIME_DIR, { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
};

/** go build 出独立二进制再 spawn,避免 go run 的 fork 子进程难以回收。 */
export const buildBackendBinary = async (): Promise<string> => {
  mkdirSync(RUNTIME_DIR, { recursive: true });
  // 首次构建可能很慢(冷缓存),给足超时。
  await execFileAsync("go", ["build", "-o", BINARY_PATH, "."], {
    cwd: SERVICE_DIR,
    timeout: 600_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  return BINARY_PATH;
};

/** 以 detached 形式启动后端二进制,日志落盘,返回 PID。 */
export const spawnBackend = (binaryPath: string): number => {
  const logFd = openSync(LOG_PATH, "a");
  const child: ChildProcess = spawn(binaryPath, [], {
    cwd: SERVICE_DIR,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    windowsHide: true,
  });
  child.unref();
  if (child.pid === undefined) {
    throw new Error("etf-service 启动失败:未取得 PID");
  }
  return child.pid;
};

/** Windows 下用 taskkill /T /F 结束进程树。 */
export const killBackend = async (pid: number): Promise<void> => {
  try {
    await execFileAsync("taskkill", ["/PID", String(pid), "/T", "/F"], { timeout: 30_000 });
  } catch (error) {
    // 进程可能已退出;仅在没有真正杀掉时报错。taskkill 对不存在的 PID 返回非零。
    if (isPidAlive(pid)) {
      throw error;
    }
  }
};

const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/** Windows 下 taskkill 后 exe 文件锁释放有延迟,重试几次再放弃。 */
export const cleanupBackendRuntime = (): void => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      rmSync(RUNTIME_DIR, { recursive: true, force: true });
      return;
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
  rmSync(RUNTIME_DIR, { recursive: true, force: true });
};
