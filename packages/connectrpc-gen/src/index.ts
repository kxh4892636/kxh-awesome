import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = dirname(__dirname);

const NODE_MODULES_BIN = join(PKG_ROOT, "node_modules", ".bin");

function findRepoRoot(): string {
  let dir = process.cwd();
  while (dir !== "/") {
    if (existsSync(join(dir, "connectrpc.config.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("not in a kxh-awesome repo (connectrpc.config.json not found)");
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: connectrpc-gen <project-name>");
    process.exit(1);
  }

  const projectName = args[0];
  const repoRoot = findRepoRoot();

  let config: { projects: Record<string, string> };
  try {
    config = JSON.parse(readFileSync(join(repoRoot, "connectrpc.config.json"), "utf-8"));
  } catch {
    console.error("Error: failed to parse connectrpc.config.json");
    process.exit(1);
  }

  if (!config.projects || !config.projects[projectName]) {
    const available = Object.keys(config.projects || {}).join(", ") || "none";
    console.error(`Error: unknown project "${projectName}". Available: ${available}`);
    process.exit(1);
  }

  const projectPath = resolve(repoRoot, config.projects[projectName]);
  const protoDir = join(projectPath, "proto");
  if (!existsSync(protoDir)) {
    console.error(`Error: proto directory not found: ${protoDir}`);
    process.exit(1);
  }

  const outputDir = resolve(process.cwd(), "src/api/gen", projectName);
  const relOutput = relative(projectPath, outputDir);

  const bufYaml = `version: v2
plugins:
  - local: protoc-gen-es
    out: ${relOutput}
    opt:
      - target=ts
      - import_extension=.js
  - local: protoc-gen-connect-query
    out: ${relOutput}
    opt:
      - target=ts
      - import_extension=.js
`;

  const tmpConfig = join(tmpdir(), `buf-gen-${projectName}.yaml`);
  writeFileSync(tmpConfig, bufYaml);

  console.log(`Generating API code for "${projectName}"...`);
  console.log(`  Proto:  ${protoDir}`);
  console.log(`  Output: ${outputDir}`);

  const sep = process.platform === "win32" ? ";" : ":";
  try {
    execSync(`buf generate --template "${tmpConfig}"`, {
      cwd: projectPath,
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: `${NODE_MODULES_BIN}${sep}${process.env.PATH || ""}`,
      },
    });
  } catch {
    console.error("Error: buf generate failed");
    process.exit(1);
  }

  console.log(`Done: generated to src/api/gen/${projectName}/`);
}

main();
