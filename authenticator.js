/**
 * @see https://github.com/bcoe/npme-auth-foo#writing-an-authenticator
 * @constructor
 */

var _ = require('lodash');
var stash = require('./stash');

function Authenticator() {
    _.extend(this, stash);
};

Authenticator.prototype.authenticate = function (_credentials, _cb) {
    var self = this;
    var credentials = _credentials.body;
    var user = this.client.user(credentials.name, credentials.password);

    if (!credentials) {
        _cb(new Error('Missing credentials'));
    }

    try {
        user.authorize(credentials.name, credentials.password).then(function (_stashData) {
            if (!_stashData) {
                return _cb(new Error('Invalid StashUser object'));
            }
            if (_stashData.user.email !== credentials.email) {
                return _cb(new Error('Invalid StashUser email'));
            }

            self.logger.debug('Authorization success', _stashData);
            _cb(null, _stashData);
        }).catch(_cb);
    } catch (_error) {
        self.logger.error('Authorization failure', _error);
        _cb(_error);
    }
};

module.exports = Authenticator;
