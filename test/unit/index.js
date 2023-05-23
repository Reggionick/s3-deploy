const chai = require('chai');
const expect = chai.expect;

const { parseCliArgsToOptions } = require('../../deploy/index');

describe('#parseCliArgsToOptions()', () => {
  describe('--gzip', async () => {
    it('should be true if present', () => {
      expect(parseCliArgsToOptions([0, 0, '--gzip']).gzip).to.equal(true);
    });

    it('should be array if arg is given', () => {
      expect(parseCliArgsToOptions([0, 0, '--gzip', 'js,css,html']).gzip).to.deep.equal(['js', 'css', 'html']);
    });

    it('should accept a --cache argument to set the max-age Cache-Control header', () => {
      const argv = [0, 0, '--cache', 64];
      const parsedOptions = parseCliArgsToOptions(argv);
      expect(parsedOptions.cacheControl).to.equal('max-age=64');
    });

    it('should accept a --noCache argument to disable caching in the Cache-Control header', () => {
      const argv = [0, 0, '--noCache', '--otherParam'];
      const parsedOptions = parseCliArgsToOptions(argv);
      expect(parsedOptions.cacheControl).to.equal('no-cache, no-store, must-revalidate');
    });

    it('should accept an --immutable argument to set the immutable Cache-Control header', () => {
      const argv = [0, 0, '--otherParam', '--immutable'];
      const parsedOptions = parseCliArgsToOptions(argv);
      expect(parsedOptions.cacheControl).to.equal('immutable');
    });

    it('should accept a --cacheControl argument to set the Cache-Control header specifically', () => {
      const argv = [0, 0, '--cacheControl', 'public,max-age=60,s-maxage=3600'];
      const parsedOptions = parseCliArgsToOptions(argv);
      expect(parsedOptions.cacheControl).to.equal('public,max-age=60,s-maxage=3600');
    });

    it('should not accept more than one caching argument', () => {
      const argv = [0, 0, '--noCache', '--cache', 34];
      const parsedOptions = parseCliArgsToOptions(argv);
      expect(parsedOptions.cacheControl).to.equal('no-cache, no-store, must-revalidate');
    });
  });
});
