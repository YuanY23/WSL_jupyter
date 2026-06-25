const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile-nbgrader'), 'utf8');

assert.ok(dockerfile.includes('ARG JULIA_VERSION=1.12.6'));
assert.ok(dockerfile.includes('ARG JULIA_MAJOR_MINOR=1.12'));
assert.ok(dockerfile.includes('https://julialang-s3.julialang.org/bin/linux/x64/${JULIA_MAJOR_MINOR}/julia-${JULIA_VERSION}-linux-x86_64.tar.gz'));
assert.ok(dockerfile.includes('JUPYTER_DATA_DIR=/opt/conda/share/jupyter julia -e'));
assert.ok(dockerfile.includes('Pkg.add("IJulia")'));
assert.ok(dockerfile.includes('Pkg.build("IJulia")'));
assert.ok(dockerfile.includes('jupyter kernelspec list | grep -E "julia-1\\\\.12|julia"'));

console.log('julia kernel Dockerfile tests passed');
