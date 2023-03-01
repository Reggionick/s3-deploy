const core = require('@actions/core');
const deploy = require('./deploy');

function getBooleanInput(name) {
  return core.getInput(name).toLowerCase() === 'true';
}

async function run() {
  try {
    const folder = core.getInput('folder');
    const bucket = core.getInput('bucket');
    const bucketRegion = core.getInput('bucket-region');
    const distId = core.getInput('dist-id');
    const invalidation = core.getInput('invalidation') || '/';
    const deleteRemoved = core.getInput('delete-removed') || false;
    const noCache = getBooleanInput('no-cache');
    const private = getBooleanInput('private');
    const immutable = getBooleanInput('immutable');
    const cache   = core.getInput('cache') || null;
    const filesToInclude = core.getInput('files-to-include') || null;

    await deploy({ folder, bucket, bucketRegion, distId, invalidation, deleteRemoved, noCache, private, cache, immutable, filesToInclude });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
