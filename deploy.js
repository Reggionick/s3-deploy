const path = require("path");
const exec = require("@actions/exec");

let deploy = function (folder, bucket, distId, invalidation) {
  return new Promise((resolve, reject) => {
    try {
      const command = `npx s3-deploy@1.4.0 ./** \
                        --bucket ${bucket} \
                        --cwd . \
                        --distId ${distId} \
                        --etag \
                        --gzip xml,html,htm,js,css,ttf,otf,svg,txt \
                        --invalidate "${invalidation}" \
                        --noCache `;

      const cwd = path.resolve(folder);
      exec.exec(command, [], { cwd }).then(resolve).catch(reject);
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = deploy;
