const chai = require('chai');
const spies = require('chai-spies');
const AWSMock = require('aws-sdk-mock');
const { AWS } = require('../../deploy/utils');
const { invalidate } = require('../../deploy/cloudfront');

AWSMock.setSDKInstance(AWS);

chai.use(spies);

const expect = chai.expect;
const spy = chai.spy;

spy.on(Date, 'now', () => 1001);

describe('#invalidate()', async () => {
  let createInvalidationSpy, createInvalidationCbSpy, success, error;

  beforeEach(() => {
    createInvalidationSpy = spy.returns((params, cb) => {
      cb(null, 'Callback');
    });
    AWSMock.mock('CloudFront', 'createInvalidation', createInvalidationSpy);
  });

  it('should call aws cloudfront with given params', async () => {
    await invalidate('Test123', ['/', 'index.html', '/build/static/test.png']);
    expect(createInvalidationSpy).to.have.been.called.with({
      DistributionId: 'Test123',
      InvalidationBatch: {
        CallerReference: 's3-deploy-1',
        Paths: {
          Quantity: 3,
          Items: ['/', '/index.html', '/build/static/test.png'],
        },
      },
    });
  });
});
