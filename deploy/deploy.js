import util from 'util';
import path from 'path';
import zlib from 'zlib';
import globrex from 'globrex';

import AWS from 'aws-sdk';
import fs from 'co-fs-extra';
import co from 'co';

import  { invalidate } from './cloudfront';
import * as utils from './utils';
import * as MSG from './MSG';

/**
 * Uploads a file to AWS S3 bucket.
 * @param  {Object} client AWS Client object.
 * @param  {Object} file   File details of a file to be uploaded.
 * @param  {Object} opts   Object with additional AWS parameters.
 * @return {Promise}        Returns a promise which resolves with a log message of upload status.
 */
export function upload(client, file, opts, filePrefix, ext, fileName) {
  return new Promise((resolve, reject) => {
    opts = Object.assign({
      ACL: 'public-read'
    }, opts);

    var params = Object.assign({}, utils.buildUploadParams(file, filePrefix, ext, fileName), opts);
    params = utils.handleETag(params);
    var dest = params.Key;

    // Upload the file to s3.
    client.putObject(params, function (err) {
      if (err) {
        return reject(util.format(MSG.ERR_UPLOAD, err, err.stack));
      }

      return resolve(util.format(MSG.UPLOAD_SUCCESS, params.Bucket, dest));
    });
  });
}

const listAllKeys = (client, params, out = []) => new Promise((resolve, reject) => {
  client.listObjectsV2(params).promise()
    .then(({Contents, IsTruncated, NextContinuationToken}) => {
      console.log('listObjects IsTruncated: %s', IsTruncated);
      const s3files = Contents.map(item => item.Key);
      out = out.concat(s3files);
      !IsTruncated ? resolve(out) : resolve(listAllKeys(client, Object.assign(params, {ContinuationToken: NextContinuationToken}), out));
    })
    .catch(reject);
});

export function deleteRemoved(client, files, options) {

  const params = {
    Bucket: options.bucket
  };

  return new Promise((resolve, reject) => {

    listAllKeys(client, params)
      .then(allKeys => {
        console.log('allKeys length: %s', allKeys.length);
        const localFiles = files.map(item => item.substr(options.cwd.length));
        console.log('localFiles length: %s', localFiles.length);
        let toDelete = allKeys.filter(item => !localFiles.includes(item));

        // If deleteRemoved argument is entered, filter files on this pattern
        if (options.deleteRemoved !== true) {
          const matchReg = globrex(options.deleteRemoved, { extended: true, globstar: true }).regex;
          console.log('Filtering files to delete on: ', matchReg);
          toDelete = toDelete.filter(item => matchReg.test(item));
        }

        if (toDelete.length > 0) {

          console.log('Deleting files: %s', toDelete);

          let i, j, tempDeletes;
          const chunk = 1000;
          for(i=0, j=toDelete.length; i < j; i += chunk) {
            tempDeletes = toDelete.slice(i, i+chunk).map(item => {
              return {Key: item};
            });

            console.log('Deleting chunk: %s', tempDeletes.length);

            const params = {
              Bucket: options.bucket,
              Delete: {
                Objects: tempDeletes
              }
            };

            client.deleteObjects(params, function (err, data) {
              if (err) {
                console.log('Error while Deleting: ', err);
                return reject(util.format(MSG.ERR_UPLOAD, err, err.stack));
              }// an error occurred

              return resolve(util.format(MSG.DELETE_SUCCESS, toDelete));
            });
          }
        } else {
          console.log('No files to delete.');
        }
      })
      .catch(console.log);
  });
}


/**
 * Checks if file is already in the S3 bucket.
 * @param  {Object}  client         AWS Client object.
 * @param  {Object}  file           File details of a file to check.
 * @param  {Object}  opts           Object with additional AWS parameters.
 * @param  {Boolean} preventUpdates Prevent updating the object, even if changed
 * @return {Promise}                Returns a promise which rejects if file already exists,
 *                                  and doesn't need update. Otherwise fulfills.
 */
export function sync(client, file, filePrefix, opts, preventUpdates, fileName) {
  return new Promise((resolve, reject) => {
    var expectedHash = utils.createMd5Hash(file.contents);
    var params = {
      IfNoneMatch: expectedHash,
      Bucket: opts.Bucket
    };
    if (!preventUpdates) {
      params.IfUnmodifiedSince = file.stat.mtime;
    }
    Object.assign(params, utils.buildBaseParams(file, filePrefix, fileName));
    client.headObject(params, function (err, data) {
      if (err && (err.statusCode === 304 || err.statusCode === 412)) {
        return reject(util.format(MSG.SKIP_MATCHES, params.Key));
      }

      if (preventUpdates && data) {
        return reject(util.format(MSG.ERR_CHECKSUM, expectedHash, data.ETag, params.Key));
      }

      if (data || err.statusCode === 404) {
        return resolve();
      }

      reject(util.format(MSG.ABORT_UPLOAD, err.code, err.message, params.Key));
    });
  });
}

export function shouldBeZipped(filepath, gzip) {
  if (gzip === true) return true;

  if (Array.isArray(gzip)) {
    const ext = path.extname(filepath); // ext would be ".js" or alike
    if (ext && gzip.includes(ext.substr(1))) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the provided path is a file or directory.
 * If it is a file, it returns file details object.
 * Otherwise it returns undefined.
 */
export const readFile = co.wrap(function *(filepath, cwd, shouldGzip) {
  var stat = fs.statSync(filepath);
  if (stat.isFile()) {
    let fileContents = yield fs.readFile(filepath, {encoding: null});

    if (shouldGzip) {
      fileContents = zlib.gzipSync(fileContents);
    }

    return {
      stat: stat,
      contents: fileContents,
      base: path.join(process.cwd(), cwd),
      path: path.join(process.cwd(), filepath)
    };
  }

  return undefined;
});

/**
 * Handles a path, by obtaining file details for a provided path,
 * checking if file is already in AWS bucket and needs updates,
 * and uploading files that are not there yet, or do need an update.
 */
export const handleFile = co.wrap(function *(filePath, s3Client, s3UploadOpts, {filePrefix, cwd, ext, gzip, index, preventUpdates, console}) {
  const s3UploadOptions = {...s3UploadOpts};
  if (shouldBeZipped(filePath, gzip)) s3UploadOptions.ContentEncoding = 'gzip';
  const fileObject = yield readFile(filePath, cwd, s3UploadOptions.ContentEncoding);

  if (fileObject !== undefined) {
    const aliases = utils.buildIndexes(fileObject, index);
    try {
      yield sync(s3Client, fileObject, filePrefix, s3UploadOptions, preventUpdates);
      if (aliases && aliases.length > 0) {
        for (var i = 0; i < aliases.length; i++) {
          const name = aliases[i];
          yield sync(s3Client, fileObject, filePrefix, s3UploadOptions, preventUpdates, name);
        }
      }
    } catch (e) {
      console.error(e);
      return;
    }

    const fileUploadStatus = yield upload(s3Client, fileObject, s3UploadOptions, filePrefix, ext);
    if (aliases && aliases.length > 0) {
      for (var i = 0; i < aliases.length; i++) {
        const name = aliases[i];
        yield upload(s3Client, fileObject, s3UploadOptions, filePrefix, ext, name);
      }
    }
    console.log(fileUploadStatus);
  }
});

/**
 * Entry point, creates AWS client, prepares AWS options,
 * and handles all provided paths.
 */
export const deploy = co.wrap(function *(options) {
  options.console = options.console || global.console;
  const AWSOptions = {
    region: options.region
  };
  AWS.config.update(Object.assign({
    sslEnabled: true
  }, AWSOptions));
  if (options.profile) {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: options.profile});
  }

  const s3ClientOptions = {};
  if (options.hasOwnProperty('signatureVersion')) {
    s3ClientOptions.signatureVersion = options.signatureVersion;
  }
  var s3Client = new AWS.S3(s3ClientOptions);

  const s3UploadOptions = {
    Bucket: options.bucket,
    CacheControl: options.cacheControl
  };
  if (options.hasOwnProperty('etag')) {
    s3UploadOptions.Metadata = {
      ETag: options.etag
    };
  }
  if (options.private) {
    s3UploadOptions.ACL = 'private';
  }

  yield Promise.all(options.globbedFiles.map(function (filePath) {
    return handleFile(filePath, s3Client, s3UploadOptions, options);
  }));

  const cfOptions = {};
  if (options.hasOwnProperty('distId')) {
    cfOptions.distId = options.distId;
    if (options.hasOwnProperty('invalidate')) {
      cfOptions.invalidate = options.invalidate.split(' ');
    }
  }
  if (cfOptions.distId) {
    invalidate(cfOptions.distId, cfOptions.invalidate);
  }

  if(options.deleteRemoved) {
    deleteRemoved(s3Client, options.globbedFiles, options);
  }
});
