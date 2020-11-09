const path = require('path');
const exec = require('@actions/exec');

let deploy = function (params) {
  return new Promise((resolve, reject) => {
    const { folder, bucket, bucketRegion, distId, invalidation, deleteRemoved, noCache, private } = params;

    const deleteRemovedArg = deleteRemoved && !/false/i.test(deleteRemoved)
      ? /true/i.test(deleteRemoved)
        ? `--deleteRemoved`
        : `--deleteRemoved ${deleteRemoved}`
      : '';
    const noCacheArg = noCache ? '--noCache' : '';
    const privateArg = private ? '--private' : '';

    try {
      const command = `npx s3-deploy@1.4.0 ./** \
                        --bucket ${bucket} \
                        --region ${bucketRegion} \
                        --cwd ./ \
                        --distId ${distId} \
                        --etag \
                        --gzip xml,html,htm,js,css,ttf,otf,svg,txt \
                        --invalidate "${invalidation}" \
                        ${deleteRemovedArg} \
                        ${noCacheArg} \
                        ${privateArg} `;

      const cwd = path.resolve(folder);
      exec.exec(command, [], { cwd }).then(resolve).catch(reject);
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = deploy;
