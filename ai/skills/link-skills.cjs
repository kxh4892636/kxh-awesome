#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILLS_ROOT = path.resolve(__dirname);
const TARGET_DIR = '/Users/bytedance/.trae-cn/skills';

function main() {
  // 确保目标目录存在
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`Created target directory: ${TARGET_DIR}`);
  }

  // 遍历 ai/skills 下的所有子文件夹
  const entries = fs.readdirSync(SKILLS_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const groupDir = path.join(SKILLS_ROOT, entry.name);

    // 跳过非 skill-group 目录（如本脚本自身）
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

    // 遍历 skill-group 下的子文件夹，寻找 skill 文件夹
    const groupEntries = fs.readdirSync(groupDir, { withFileTypes: true });

    for (const groupEntry of groupEntries) {
      if (!groupEntry.isDirectory()) continue;

      const skillDir = path.join(groupDir, groupEntry.name);
      const skillFile = path.join(skillDir, 'SKILL.md');

      // 只有包含 SKILL.md 的文件夹才是 skill
      if (!fs.existsSync(skillFile)) continue;

      const linkPath = path.join(TARGET_DIR, groupEntry.name);

      // 如果目标已存在，先删除
      if (fs.existsSync(linkPath)) {
        const stat = fs.lstatSync(linkPath);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(linkPath);
          console.log(`Removed existing symlink: ${linkPath}`);
        } else {
          console.warn(`Warning: ${linkPath} exists and is not a symlink, skipping`);
          continue;
        }
      }

      // 创建软链接
      fs.symlinkSync(skillDir, linkPath, 'dir');
      console.log(`Linked: ${skillDir} -> ${linkPath}`);
    }
  }

  console.log('\nDone.');
}

main();
