#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const AGENTS_ROOT = path.resolve(__dirname, '../.agents');
const SKILLS_ROOT = path.join(AGENTS_ROOT, 'skills');
const LOCAL_TARGET_DIRS = [
  '/Users/bytedance/.trae-cn/skills',
  '/Users/bytedance/.agents/skills',
];
const DEFAULT_REMOTE_TARGETS = [
  'kongxiaohan.xiaoyu@10.37.19.84:~/.agents',
];
const REMOTE_EXCLUDES = ['node_modules', '.DS_Store'];

function main() {
  const options = readOptions(process.argv.slice(2));

  if (options.help) {
    showHelp();
    return;
  }

  if (options.local) {
    linkLocalSkills();
  }

  if (options.remote) {
    syncRemoteAgents(options);
  }

  console.log('\nDone.');
}

function readOptions(args) {
  const options = {
    deleteRemote: false,
    help: false,
    local: true,
    remote: false,
    remoteTargets: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--local') {
      options.local = true;
    } else if (arg === '--no-local') {
      options.local = false;
    } else if (arg === '--remote') {
      options.remote = true;
    } else if (arg === '--remote-only') {
      options.local = false;
      options.remote = true;
    } else if (arg === '--delete-remote') {
      options.deleteRemote = true;
    } else if (arg === '--remote-target') {
      const target = args[index + 1];
      if (!target) {
        throw new Error('--remote-target requires a value like user@host:~/.agents');
      }

      options.remote = true;
      options.remoteTargets.push(target);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.remoteTargets.length === 0) {
    options.remoteTargets = DEFAULT_REMOTE_TARGETS;
  }

  return options;
}

function showHelp() {
  console.log(`
Usage:
  node scripts/link-skills.cjs [options]

Options:
  --local                 Link repo skills into local skill directories. Default.
  --no-local              Skip local linking.
  --remote                Sync .agents to configured remote targets over SSH.
  --remote-only           Sync remote targets without local linking.
  --remote-target <dest>  Sync to a remote destination like user@host:~/.agents.
  --delete-remote         Delete remote files that no longer exist locally.
  -h, --help              Show this help.

Examples:
  node scripts/link-skills.cjs
  node scripts/link-skills.cjs --remote-only
  node scripts/link-skills.cjs --remote-target user@host:~/.agents
`);
}

function linkLocalSkills() {
  for (const targetDir of LOCAL_TARGET_DIRS) {
    console.log(`\n--- Processing target: ${targetDir} ---`);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`Created target directory: ${targetDir}`);
    }

    for (const entry of fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

      const skillDir = path.join(SKILLS_ROOT, entry.name);
      const skillFile = path.join(skillDir, 'SKILL.md');

      if (!fs.existsSync(skillFile)) continue;

      const linkPath = path.join(targetDir, entry.name);

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
}

function syncRemoteAgents(options) {
  if (!fs.existsSync(AGENTS_ROOT)) {
    throw new Error(`Missing agents directory: ${AGENTS_ROOT}`);
  }

  for (const remoteTarget of options.remoteTargets) {
    const { remotePath, sshTarget } = splitRemoteTarget(remoteTarget);
    const rsyncArgs = ['-az', '-e', 'ssh'];

    if (options.deleteRemote) {
      rsyncArgs.push('--delete');
    }

    for (const pattern of REMOTE_EXCLUDES) {
      rsyncArgs.push('--exclude', pattern);
    }

    console.log(`\n--- Syncing agents to remote: ${remoteTarget} ---`);
    run('ssh', [sshTarget, `mkdir -p -- ${remotePathForShell(remotePath)}`]);
    run('rsync', [...rsyncArgs, `${AGENTS_ROOT}/`, withTrailingSlash(remoteTarget)]);
  }
}

function splitRemoteTarget(remoteTarget) {
  const separatorIndex = remoteTarget.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex === remoteTarget.length - 1) {
    throw new Error(`Invalid remote target: ${remoteTarget}`);
  }

  return {
    remotePath: remoteTarget.slice(separatorIndex + 1),
    sshTarget: remoteTarget.slice(0, separatorIndex),
  };
}

function remotePathForShell(remotePath) {
  if (remotePath === '~') return '$HOME';
  if (remotePath.startsWith('~/')) return `$HOME/${shellQuote(remotePath.slice(2))}`;
  return shellQuote(remotePath);
}

function withTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function run(command, args) {
  console.log(`$ ${[command, ...args].map(formatShellArg).join(' ')}`);

  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

function formatShellArg(value) {
  if (/^[A-Za-z0-9_./:=@~+-]+$/.test(value)) return value;
  return shellQuote(value);
}

function shellQuote(value) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

main();
