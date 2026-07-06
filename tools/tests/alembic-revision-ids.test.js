const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const versionsDir = path.join(root, 'simlab-training-service', 'alembic', 'versions');

for (const file of fs.readdirSync(versionsDir).filter(name => name.endsWith('.py'))) {
  const text = fs.readFileSync(path.join(versionsDir, file), 'utf8');
  const match = text.match(/^revision\s*=\s*["']([^"']+)["']/m);
  assert.ok(match, `expected ${file} to define revision`);
  assert.ok(
    match[1].length <= 32,
    `${file} revision id "${match[1]}" is ${match[1].length} chars; Alembic version_num is limited to 32`
  );
}

console.log('alembic revision id tests passed');
