import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const configPath = join(projectRoot, "connectrpc.config.json");
const nodeModulesBin = join(projectRoot, "node_modules", ".bin");
const pathDelimiter = process.platform === "win32" ? ";" : ":";

const toPosixPath = (value) => value.replaceAll("\\", "/");

const readConfig = () => {
  const raw = readFileSync(configPath, "utf8");
  const config = JSON.parse(raw);

  if (!config.backends || typeof config.backends !== "object") {
    throw new Error("connectrpc.config.json must define a backends object");
  }

  const entries = Object.entries(config.backends);
  if (entries.length === 0) {
    throw new Error("connectrpc.config.json backends cannot be empty");
  }

  return entries;
};

const isLocalSource = (source) => {
  if (source.startsWith(".") || source.startsWith("/") || /^[A-Za-z]:[\\/]/.test(source)) {
    return true;
  }

  return existsSync(resolve(projectRoot, source));
};

const assertSafeBackendId = (backendId) => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(backendId)) {
    throw new Error(
      `invalid backend id "${backendId}". Use lowercase letters, digits, and hyphens.`,
    );
  }
};

const assertOutputInsideProject = (backendId, outputDir) => {
  const genRoot = resolve(projectRoot, "src/libs/api/gen");
  const relativeOutput = relative(genRoot, outputDir);

  if (relativeOutput.startsWith("..") || resolve(genRoot, relativeOutput) !== outputDir) {
    throw new Error(`backend "${backendId}" output must stay inside src/libs/api/gen`);
  }
};

const createBufTemplate = (outDir, cwd) => {
  const out = JSON.stringify(toPosixPath(relative(cwd, outDir)));

  return `version: v2
plugins:
  - local: protoc-gen-es
    out: ${out}
    include_imports: true
    opt:
      - target=ts
      - import_extension=.js
  - local: protoc-gen-connect-query
    out: ${out}
    opt:
      - target=ts
      - import_extension=.js
`;
};

const resolveBackend = ([backendId, entry]) => {
  assertSafeBackendId(backendId);

  const backend = typeof entry === "string" ? { idl: entry } : entry;
  if (!backend || typeof backend.idl !== "string" || backend.idl.length === 0) {
    throw new Error(`backend "${backendId}" must define an idl string`);
  }

  const outputDir = resolve(projectRoot, backend.out ?? `src/libs/api/gen/${backendId}`);
  assertOutputInsideProject(backendId, outputDir);

  return {
    id: backendId,
    idl: backend.idl,
    outputDir,
    local: isLocalSource(backend.idl),
  };
};

const runBufGenerate = (backend) => {
  const sourcePath = backend.local ? resolve(projectRoot, backend.idl) : backend.idl;
  if (backend.local && !existsSync(sourcePath)) {
    throw new Error(`backend "${backend.id}" idl path does not exist: ${sourcePath}`);
  }

  const sourceHasBufConfig = backend.local && existsSync(join(sourcePath, "buf.yaml"));
  const cwd = sourceHasBufConfig ? sourcePath : projectRoot;
  const args = sourceHasBufConfig
    ? ["generate", "--template"]
    : ["generate", sourcePath, "--template"];

  const tempDir = mkdtempSync(join(tmpdir(), `connectrpc-gen-${backend.id}-`));
  const templatePath = join(tempDir, "buf.gen.yaml");
  writeFileSync(templatePath, createBufTemplate(backend.outputDir, cwd), "utf8");

  rmSync(backend.outputDir, { recursive: true, force: true });

  console.log(`Generating ${backend.id}`);
  console.log(`  idl: ${backend.idl}`);
  console.log(`  out: ${toPosixPath(relative(projectRoot, backend.outputDir))}`);

  const bufScript = join(projectRoot, "node_modules", "@bufbuild", "buf", "bin", "buf");
  const result = spawnSync(process.execPath, [bufScript, ...args, templatePath], {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `${nodeModulesBin}${pathDelimiter}${process.env.PATH ?? ""}`,
    },
  });

  rmSync(tempDir, { recursive: true, force: true });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`buf generate failed for backend "${backend.id}"`);
  }

  removeExtraTrailingBlankLines(backend.outputDir);
};

const removeExtraTrailingBlankLines = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      removeExtraTrailingBlankLines(path);
      continue;
    }

    if (!entry.isFile() || !path.endsWith(".ts")) {
      continue;
    }

    const content = readFileSync(path, "utf8");
    const normalized = `${content.replace(/\n+$/u, "")}\n`;
    if (normalized !== content) {
      writeFileSync(path, normalized, "utf8");
    }
  }
};

const main = () => {
  const backends = readConfig().map(resolveBackend);
  for (const backend of backends) {
    runBufGenerate(backend);
  }
};

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
