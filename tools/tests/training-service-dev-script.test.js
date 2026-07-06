const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const scriptPath = path.join(root, 'tools', 'training-service-dev-up.sh');

assert.ok(fs.existsSync(scriptPath), 'expected tools/training-service-dev-up.sh to exist');

const script = fs.readFileSync(scriptPath, 'utf8');

assert.ok(script.includes('docker image inspect "$SERVICE_IMAGE"'), 'dev script should require an existing service image');
assert.ok(!script.includes('docker build'), 'dev script must not rebuild the service image');
assert.ok(script.includes('${PROJECT_ROOT}/simlab-training-service/simlab_training_service:/app/simlab_training_service'), 'dev script should mount service source');
assert.ok(script.includes('${PROJECT_ROOT}/simlab-training-service/alembic:/app/alembic'), 'dev script should mount migrations');
assert.ok(script.includes('alembic upgrade head'), 'dev script should run migrations on startup');
assert.ok(script.includes('uvicorn simlab_training_service.app:app'), 'dev script should run the training app');
assert.ok(script.includes('--reload'), 'dev script should enable uvicorn reload');
assert.ok(script.includes('--reload-dir /app/simlab_training_service'), 'dev script should watch service source');
assert.ok(script.includes('simlab-training-dev-net'), 'dev script should use a separate default dev network');

console.log('training service dev script tests passed');
