const path = require('path');
const exec = require('@actions/exec');

let deploy = function (params) {
  return new Promise((resolve, reject) => {
    const { folder, bucket, bucketRegion, distId, invalidation, deleteRemoved, cache } = params;

    const deleteRemovedArg = deleteRemoved ? `--deleteRemoved ${deleteRemoved}` : '';
    const cacheArg = cache ? '' : `--noCache`;

    try {
      const command = `npx s3-deploy@1.4.0 ./** \
                        --bucket ${bucket} \
                        --region ${bucketRegion} \
                        --cwd . \
                        --distId ${distId} \
                        --etag \
                        --gzip xml,html,htm,js,css,ttf,otf,svg,txt \
                        --invalidate "${invalidation}" \
                        ${cacheArg} \
                        ${deleteRemovedArg} `;

      const cwd = path.resolve(folder);
      exec.exec(command, [], { cwd }).then(resolve).catch(reject);
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = deploy;
