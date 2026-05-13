#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILLS_ROOT = path.resolve(__dirname, '../.agents/skills');
const TARGET_DIR = '/Users/bytedance/.trae-cn/skills';

function main() {
  // 确保目标目录存在
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`Created target directory: ${TARGET_DIR}`);
  }

  // 遍历 skills 下的所有子文件夹（扁平结构）
  const entries = fs.readdirSync(SKILLS_ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // 跳过非 skill 目录
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

    const skillDir = path.join(SKILLS_ROOT, entry.name);
    const skillFile = path.join(skillDir, 'SKILL.md');

    // 只有包含 SKILL.md 的文件夹才是 skill
    if (!fs.existsSync(skillFile)) continue;

    const linkPath = path.join(TARGET_DIR, entry.name);

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

  console.log('\nDone.');
}

main();
