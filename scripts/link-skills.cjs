#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILLS_ROOT = path.resolve(__dirname, '../.agents/skills');
const TARGET_DIRS = [
  '/Users/bytedance/.trae-cn/skills',
  '/Users/bytedance/.agents/skills',
];

function main() {
  for (const TARGET_DIR of TARGET_DIRS) {
    console.log(`\n--- Processing target: ${TARGET_DIR} ---`);

    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
      console.log(`Created target directory: ${TARGET_DIR}`);
    }

    const entries = fs.readdirSync(SKILLS_ROOT, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

      const skillDir = path.join(SKILLS_ROOT, entry.name);
      const skillFile = path.join(skillDir, 'SKILL.md');

      if (!fs.existsSync(skillFile)) continue;

      const linkPath = path.join(TARGET_DIR, entry.name);

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

      fs.symlinkSync(skillDir, linkPath, 'dir');
      console.log(`Linked: ${skillDir} -> ${linkPath}`);
    }
  }

  console.log('\nDone.');
}

main();
