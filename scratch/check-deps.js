const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const allDeps = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
  'react', 'react-dom', 'next' // core deps
]);

// built-in node modules
const builtIns = new Set([
  'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console',
  'constants', 'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'fs/promises',
  'http', 'http2', 'https', 'inspector', 'module', 'net', 'os', 'path', 'path/posix',
  'path/win32', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline',
  'repl', 'stream', 'stream/promises', 'string_decoder', 'sys', 'timers',
  'timers/promises', 'tls', 'trace_events', 'tty', 'url', 'util', 'util/types',
  'v8', 'vm', 'worker_threads', 'zlib'
]);

function getTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        getTsFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getTsFiles(path.join(__dirname, '..'));
const importedPackages = new Set();

const importRegex = /import(?:(?:(?:[ \n\t]+[^ *\n\t\{\},]+[ \n\t]*(?:,|[ \n\t]+))?([ \n\t]*\{(?:[ \n\t]*[^ \n\t"'\{\}]+[ \n\t]*,?)+\})?[ \n\t]*)|[ \n\t]*\*[ \n\t]*as[ \n\t]+[^ \n\t\{\}]+[ \n\t]+)from[ \n\t]*(?:['"])([^'"\n]+)(?:['"])/g;
const dynamicImportRegex = /import\((?:['"])([^'"\n]+)(?:['"])\)/g;

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    let pkg = match[2];
    if (!pkg.startsWith('.') && !pkg.startsWith('@/')) {
        // extract base package name
        if (pkg.startsWith('@')) {
            const parts = pkg.split('/');
            pkg = parts.slice(0, 2).join('/');
        } else {
            pkg = pkg.split('/')[0];
        }
        importedPackages.add(pkg);
    }
  }
  while ((match = dynamicImportRegex.exec(content)) !== null) {
      let pkg = match[1];
      if (!pkg.startsWith('.') && !pkg.startsWith('@/')) {
        if (pkg.startsWith('@')) {
            const parts = pkg.split('/');
            pkg = parts.slice(0, 2).join('/');
        } else {
            pkg = pkg.split('/')[0];
        }
        importedPackages.add(pkg);
      }
  }
}

const missing = [];
for (const pkg of importedPackages) {
  if (!allDeps.has(pkg) && !builtIns.has(pkg)) {
    missing.push(pkg);
  }
}

console.log("Missing Dependencies:", missing.join(', ') || 'None found');
