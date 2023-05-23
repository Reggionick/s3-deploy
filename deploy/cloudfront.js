import { AWS } from './utils';
import util from 'util';
import * as MSG from './MSG';

/**
 * Invalidate paths within AWS CloudFront distribution
 * @param  {String} distributionId CloudFront distribution ID
 * @param  {Array} paths An array of pathnames to invalidate
 * @return {Promise} Returns a promise which resolves with a log message of upload status or rejects with an error message
 */

export const invalidate = (distributionId, paths = ['/']) => {
  const cloudfront = new AWS.CloudFront();

  new Promise((resolve, reject) => {
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `s3-deploy-${(Date.now() / 1000) | 0}`,
        Paths: {
          Quantity: paths.length,
          Items: paths.map(v => (v.charAt(0) === '/' ? v : '/' + v))
        }
      }
    };
    cloudfront.createInvalidation(params, (err, data) => {
      if (err) {
        console.log(err);
        return reject(util.format(MSG.INVALIDATE_ERROR, err, err.stack));
      }
      console.log(`Invalidation ${data.Invalidation.Id} is in progress...`);
      return resolve(util.format(MSG.INVALIDATE_SUCCESS, paths));
    });
  });
};
