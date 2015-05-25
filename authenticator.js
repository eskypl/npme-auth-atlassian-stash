/**
 * @see https://github.com/bcoe/npme-auth-foo#writing-an-authenticator
 * @constructor
 */

var StashClient = require('./stash/client');

function Authenticator() {
    this.client = new StashClient('https://stash.eskyspace.com');
};

Authenticator.prototype.authenticate = function (_credentials, _cb) {
    var credentials = _credentials.body;

    if (!credentials) {
        _cb(new Error('Missing credentials'));
    }

    this.client.user(credentials.name, credentials.password).then(function (_stashUser) {
        if (!_stashUser) {
            return _cb(new Error('Invalid StashUser object'));
        }
        if (_stashUser.emailAddress !== credentials.email) {
            return _cb(new Error('Invalid StashUser email'));
        }
        _cb(null, _stashUser.getAuthenticatorData());
    }).catch(_cb);
};

module.exports = Authenticator;
