#!/usr/bin/env node
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const cwd = path.resolve();

function run(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = exec(cmd, { cwd, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout, stderr });
    });
    p.stdout?.pipe(process.stdout);
    p.stderr?.pipe(process.stderr);
  });
}

async function main() {
  try {
    rl.question('Kérlek add meg a neved: ', async (username) => {
      const dataDir = path.join(os.homedir(), '.cli-ai-assistant');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(path.join(dataDir, 'user.txt'), username + '\n');
      rl.close();

      console.log('Installing npm dependencies...');
      await run('npm install');

      // Ensure index.js is executable in installed location; when published as a package,
      // npm will symlink the `bin` target. Shebang in index.js is required.
      const indexPath = path.join(cwd, 'index.js');
      if (fs.existsSync(indexPath)) {
        try {
          fs.chmodSync(indexPath, 0o755);
        } catch (e) {
          // ignore permission errors on some file systems
        }
      }

      console.log('Installation complete. You can run the assistant with `cli-ai-assistant` after a global install:');
      console.log('  npm install -g .');
    });
  } catch (err) {
    console.error('Install failed:', err);
    process.exit(1);
  }
}

main();
