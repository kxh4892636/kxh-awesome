#!/usr/bin/env node

import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const sourceDir = join(repoRoot, "packages", "skills-kit");

const localTargetParent =
  process.env.SKILLS_KIT_LOCAL_TARGET ?? "/Users/bytedance/.agents/skills";
const localTargetDir = join(localTargetParent, "skills-kit");

const remoteHost = process.env.SKILLS_KIT_REMOTE_HOST ?? "10.37.247.107";
const remoteUser = process.env.SKILLS_KIT_REMOTE_USER ?? "kongxiaohan.xiaoyu";
const remoteTargetParent =
  process.env.SKILLS_KIT_REMOTE_TARGET ??
  "/home/kongxiaohan.xiaoyu/.agents/skills";
const remoteTargetDir = `${remoteTargetParent}/skills-kit`;
const remote = remoteUser ? `${remoteUser}@${remoteHost}` : remoteHost;

async function ensureSourceExists() {
  const info = await stat(sourceDir);
  if (!info.isDirectory()) {
    throw new Error(`Source is not a directory: ${sourceDir}`);
  }
}

async function syncLocal() {
  await rm(localTargetDir, { recursive: true, force: true });
  await mkdir(localTargetParent, { recursive: true });
  await cp(sourceDir, localTargetDir, { recursive: true });
  console.log(`Synced local: ${localTargetDir}`);
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

async function syncRemote() {
  const prepareRemote = [
    "rm",
    "-rf",
    shellQuote(remoteTargetDir),
    "&&",
    "mkdir",
    "-p",
    shellQuote(remoteTargetParent),
  ].join(" ");

  await run("ssh", [remote, prepareRemote]);

  await new Promise((resolveRun, reject) => {
    const tarCreate = spawn("tar", ["-C", join(repoRoot, "packages"), "-cf", "-", "skills-kit"], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    const tarExtract = spawn("ssh", [
      remote,
      `tar -C ${shellQuote(remoteTargetParent)} -xf -`,
    ], {
      stdio: ["pipe", "inherit", "inherit"],
    });

    tarCreate.stdout.pipe(tarExtract.stdin);

    let tarCreateCode;
    let tarExtractCode;

    const maybeDone = () => {
      if (tarCreateCode === undefined || tarExtractCode === undefined) {
        return;
      }

      if (tarCreateCode === 0 && tarExtractCode === 0) {
        resolveRun();
        return;
      }

      reject(
        new Error(
          `Remote sync failed: tar=${tarCreateCode}, ssh/tar=${tarExtractCode}`,
        ),
      );
    };

    tarCreate.on("error", reject);
    tarExtract.on("error", reject);
    tarCreate.on("close", (code) => {
      tarCreateCode = code;
      maybeDone();
    });
    tarExtract.on("close", (code) => {
      tarExtractCode = code;
      maybeDone();
    });
  });

  console.log(`Synced remote: ${remote}:${remoteTargetDir}`);
}

async function main() {
  await ensureSourceExists();
  await syncLocal();
  await syncRemote();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
