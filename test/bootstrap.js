var chai = require('chai');

chai.use(require('sinon-chai'));
chai.use(require('chai-http'));
chai.request.addPromises(Promise);
chai.config.includeStack = true;

global.expect = chai.expect;
global.assert = chai.assert;
global.request = chai.request;
