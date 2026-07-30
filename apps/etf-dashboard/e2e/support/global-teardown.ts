import { cleanupBackendRuntime, killBackend, readBackendState } from "./backend";

/** 只回收自己拉起的后端;外部管理的服务不属于本进程,不动。 */
const globalTeardown = async (): Promise<void> => {
  const state = readBackendState();
  if (!state || state.mode !== "managed" || state.pid === undefined) {
    cleanupBackendRuntime();
    return;
  }
  console.log(`[e2e] 回收托管 etf-service (pid=${state.pid})`);
  await killBackend(state.pid);
  cleanupBackendRuntime();
};

export default globalTeardown;
