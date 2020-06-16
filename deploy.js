const cp = require('child_process');

let deploy = function(folder, bucket, distId) {
  return new Promise((resolve, reject) => {
    try {
      const command = `npx s3-deploy@1.4.0 './${folder}/**' \
                        --bucket ${bucket} \
                        --cwd './${folder}' \
                        --distId ${distId} \
                        --etag \
                        --gzip xml,html,htm,js,css,ttf,otf,svg,txt \
                        --invalidate '/' \
                        --noCache `;

      const output = cp.execSync(command).toString();
      resolve(output)
      } catch (e) {
        reject(e)
      }
  });
};

module.exports = deploy;
