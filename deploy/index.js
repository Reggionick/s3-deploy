import 'babel-polyfill';
import glob from 'glob';
import _ from 'lodash';
import minimist from 'minimist';
import co from 'co';

import { deploy } from './deploy';

export function parseCliArgsToOptions(processArgv = process.argv) {
  // Get arguments that were passed from the command line.
  const argv = minimist(processArgv.slice(2));

  // Create options object, based on command line arguments.
  const options = {
    bucket: argv.bucket,
    region: argv.r || argv.region || 'us-east-1',
    cwd: argv.cwd || '',
    profile: argv.profile,
    index: argv.index || null,
  };

  if(argv.hasOwnProperty('gzip')) {
    options.gzip = typeof argv.gzip === 'string' ? argv.gzip.split(',') : argv.gzip;
  }

  if(argv.hasOwnProperty('filePrefix')) {
    options.filePrefix = argv.filePrefix || '';
  }

  if(argv.hasOwnProperty('cache')) {
    options.cache = argv.cache;
  }

  if(argv.hasOwnProperty('cacheControl')) {
    options.cacheControl = argv.cacheControl;
  }

  if(argv.hasOwnProperty('noCache')) {
    options.noCache = true;
  }

  if(argv.hasOwnProperty('immutable')) {
    options.immutable = true;
  }

  if(argv.hasOwnProperty('preventUpdates')) {
    options.preventUpdates = true;
  }

  if(argv.hasOwnProperty('etag')) {
    options.etag = argv.etag;
  }

  if(argv.hasOwnProperty('private')) {
    options.private = true;
  }

  if(argv.hasOwnProperty('ext')) {
    options.ext = argv.ext;
  }

  if(argv.hasOwnProperty('signatureVersion')) {
    options.signatureVersion = argv.signatureVersion;
  }

  if(argv.hasOwnProperty('deleteRemoved')) {
    options.deleteRemoved = argv.deleteRemoved;
  }

  if(argv.hasOwnProperty('index')) {
    options.index = argv.index;
  }

  if(argv.hasOwnProperty('distId')) {
    options.distId = argv.distId;
    options.invalidate = argv.invalidate;
  }

  // Get paths of all files from the glob pattern(s) that were passed as the
  // unnamed command line arguments.
  options.globbedFiles = _.flatten(argv._.filter(Boolean).map(function(pattern) {
    return glob.sync(pattern);
  }));

  let cacheControl = undefined;
  if (!options.cacheControl) {
    if (options.noCache) {
      cacheControl = 'no-cache, no-store, must-revalidate';
    } else if (options.hasOwnProperty('cache')) {
      cacheControl = 'max-age=' + options.cache;
    } else if (options.immutable) {
      cacheControl = 'immutable';
    }
    options.cacheControl = cacheControl;
  }

  return options;
}

function printOptions(options) {
  console.log('Deploying files: %s', options.globbedFiles);
  console.log('► Target S3 bucket: %s (%s region)', options.bucket, options.region);
  if (options.filePrefix) console.log('► Target file prefix: %s', options.filePrefix);
  if (options.gzip) console.log('► Gzip:', options.gzip);
  if (options.preventUpdates) console.log('► Prevent Updates:', options.preventUpdates);
  if (options.cacheControl) console.log('► Cache-Control:', options.cacheControl);
  if (options.etag) console.log('► E-Tag:', options.etag);
  console.log('► Private:', options.private ? true : false);
  if (options.ext) console.log('> Ext:', options.ext);
  if (options.index) console.log('> Index:', options.index);
  if (options.deleteRemoved) {
    console.log('► Deleting removed files');
    if (options.deleteRemoved !== true) {
      console.log('  ▹ Only matching pattern: %s', options.deleteRemoved);
    }
  }
  if (options.distId) {
    console.log('▼ CloudFront');
    console.log('  ▹ Distribution ID:', options.distId);
    if (options.invalidate) console.log('  ▹ Invalidate files:', options.invalidate);
  }
}

co(function *() {
  const options = parseCliArgsToOptions();
  printOptions(options);

  // Starts the deployment of all found files.
  return yield deploy(options);
})
  .then(() => {
    console.log('Upload finished');
  })
  .catch(err => {
    if (err.stack) {
      console.error(err.stack);
    } else {
      console.error(String(err));
    }

  process.exit(1); // eslint-disable-line
  });
