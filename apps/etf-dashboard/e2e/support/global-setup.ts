import {
  buildBackendBinary,
  isBackendHealthy,
  killBackend,
  spawnBackend,
  waitForBackendHealthy,
  writeBackendState,
} from "./backend";

/**
 * 后端编排入口:优先复用 :8080 上已有的健康服务(标记 external,S4 将跳过);
 * 否则自行构建二进制并拉起(标记 managed,由 globalTeardown 回收)。
 */
const globalSetup = async (): Promise<void> => {
  if (await isBackendHealthy()) {
    writeBackendState({ mode: "external" });
    console.log("[e2e] 复用外部 etf-service (:8080 已健康)");
    return;
  }

  console.log("[e2e] :8080 无健康服务,开始构建 etf-service 二进制 ...");
  const binaryPath = await buildBackendBinary();
  const pid = spawnBackend(binaryPath);
  writeBackendState({ mode: "managed", pid, binaryPath });
  console.log(`[e2e] etf-service 已启动 (pid=${pid}),等待健康检查 ...`);
  try {
    await waitForBackendHealthy(60_000);
  } catch (error) {
    // 启动失败时回收进程,避免残留。
    await killBackend(pid);
    throw error;
  }
  console.log("[e2e] etf-service 健康检查通过");
};

export default globalSetup;
