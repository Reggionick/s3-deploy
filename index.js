const core = require('@actions/core');
const deploy = require('./deploy');

async function run() {
  try {
    const folder = core.getInput('folder');
    const bucket = core.getInput('bucket');
    const bucketRegion = core.getInput('bucket-region');
    const distId = core.getInput('dist-id');
    const invalidation = core.getInput('invalidation') || '/';

    await deploy(folder, bucket, bucketRegion, distId, invalidation);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
