import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, createWriteStream, chmodSync } from "node:fs";
import { get } from "node:https";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = dirname(__dirname);

const BUF_VERSION = "1.50.0";
const BIN_DIR = join(PKG_ROOT, "bin");

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

const NODE_MODULES_BIN = join(PKG_ROOT, "node_modules", ".bin");

function getPlatform(): string {
  if (process.platform === "linux") return "Linux";
  if (process.platform === "darwin") return "Darwin";
  if (process.platform === "win32") return "Windows";
  throw new Error(`Unsupported platform: ${process.platform}`);
}

function getArch(): string {
  if (process.arch === "x64") return "x86_64";
  if (process.arch === "arm64") return "arm64";
  throw new Error(`Unsupported arch: ${process.arch}`);
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        downloadFile(res.headers.location, dest).then(resolve, reject);
        return;
      }
      res.pipe(file);
      file.on("close", resolve);
    }).on("error", (err) => {
      file.close();
      reject(err);
    });
  });
}

async function ensureBuf(): Promise<string> {
  try {
    execSync("buf --version", { stdio: "pipe" });
    return "buf";
  } catch {
    // not on PATH, use local binary
  }

  const ext = process.platform === "win32" ? ".exe" : "";
  const bufBin = join(BIN_DIR, `buf-${BUF_VERSION}${ext}`);

  if (existsSync(bufBin)) {
    return bufBin;
  }

  const platform = getPlatform();
  const arch = getArch();
  const url = `https://github.com/bufbuild/buf/releases/download/v${BUF_VERSION}/buf-${platform}-${arch}${ext}`;

  console.log(`Downloading buf ${BUF_VERSION} (${platform} ${arch})...`);
  mkdirSync(BIN_DIR, { recursive: true });

  try {
    await downloadFile(url, bufBin);
  } catch {
    console.error(`Error: failed to download buf from ${url}`);
    process.exit(1);
  }

  if (process.platform !== "win32") {
    chmodSync(bufBin, 0o755);
  }

  return bufBin;
}

async function main(): Promise<void> {
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

  const bufBin = await ensureBuf();
  const binDir = NODE_MODULES_BIN;

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

  try {
    execSync(`"${bufBin}" generate --template "${tmpConfig}"`, {
      cwd: projectPath,
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: `${binDir}${process.platform === "win32" ? ";" : ":"}${process.env.PATH || ""}`,
      },
    });
  } catch {
    console.error("Error: buf generate failed");
    process.exit(1);
  }

  console.log(`Done: generated to src/api/gen/${projectName}/`);
}

main();
