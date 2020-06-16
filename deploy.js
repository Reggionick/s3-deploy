const exec = require("@actions/exec");

let deploy = function (folder, bucket, distId) {
  return new Promise((resolve, reject) => {
    try {
      const args = [
        `./${folder}/**`,
        `--bucket ${bucket}`,
        `--cwd './${folder}'`,
        `--distId ${distId}`,
        `--etag`,
        `--gzip xml,html,htm,js,css,ttf,otf,svg,txt`,
        `--invalidate '/'`,
        `--noCache`,
      ];
      exec.exec("npx s3-deploy@1.4.0", args).then(resolve).catch(reject);
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = deploy;
