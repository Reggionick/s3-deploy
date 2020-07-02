import { getInput, setFailed } from '@actions/core';
import deploy from './deploy';

async function run() {
  try {
    const folder = getInput('folder');
    const bucket = getInput('bucket');
    const distId = getInput('dist-id');
    const invalidations = getInput('invalidations');

    await deploy(folder, bucket, distId, invalidations);
  }
  catch (error) {
    setFailed(error.message);
  }
}

run()
