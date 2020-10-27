const core = require('@actions/core');
const deploy = require('./deploy');

async function run() {
  try {
    const folder = core.getInput('folder');
    const bucket = core.getInput('bucket');
    const bucketRegion = core.getInput('bucket-region');
    const distId = core.getInput('dist-id');
    const invalidation = core.getInput('invalidation') || '/';
    const deleteRemoved = core.getInput('delete-removed') || false;
    const private = core.getInput('private') || false;

    await deploy({ folder, bucket, bucketRegion, distId, invalidation, deleteRemoved });
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
