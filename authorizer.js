var _= require('lodash');
var request = require('request');
var Promise = require('bluebird');
var stash = require('./stash');
var Session = require('./session');

/**
 * Fetches information about repository URL form package.json returned
 * from CouchDB or send by client (untrusted package.json).
 * @param _package
 * @returns {string}
 */
function getRepositoryUrl(_package) {
    if (_package.repository && _package.repository.url) {
        return _package.repository.url;
    }
    else if (_package.versions && _package['dist-tags']) {
        var latest = _package['dist-tags'].latest;
        if (!latest) {
            throw new Error('Cannot find repository URL in package.json');
        }
        var pkg = _package.versions[latest];
        if (pkg) {
            return getRepositoryUrl(pkg);
        }
        else {
            throw new Error('Cannot find repository URL in package.json@' + latest);
        }
    } else {
        throw new Error('Cannot find repository URL in package.json: Unknown package.json schema');
    }
}

/**
 * @see https://github.com/bcoe/npme-auth-foo#writing-an-authorizer
 * @param _config
 * @constructor
 */
function Authorizer(_config) {
    _.extend(this, stash, _config);
}

/**
 * The authenticate method receives a _request object and a _cb to execute once authorization is complete.
 * @param _request { path: {String}, method: {String} GET|PUT, body: {Object} package.json, headers: { authorization: {String} token issued by the authenticator } }
 * @param _cb
 * @returns {*}
 */
Authorizer.prototype.authorize = function (_request, _cb) {
    var self = this;
    var logger = this.logger;

    if (!_request) {
        logger.warn('invalid request');
        return _cb(null, false);
    }

    logger.info('auth header', _request.headers.authorization);
    if (!_request.headers.authorization || !_request.headers.authorization.match(/Bearer /)) {
        logger.warn('invalid authorization header');
        return _cb(null, false);
    }

    if (_request.method == 'GET') {
        this.scope = 'read';
    }
    else if (_request.method == 'PUT' || _request.method === 'DELETE') {
        this.scope = 'write';
    }
    else {
        logger.error('unsupported request method');
        return _cb(new Error('unsupported request method'));
    }

    this.packagePath = _request.path;
    this.untrustedPackageJson = _request.body;
    this.token = _request.headers.authorization.replace('Bearer ', '');

    // After the initial package publication, the contents of request.body should not be trusted.
    // Instead, you should use request.path to fetch the last version of the package that was published.
    this.loadPackageJson(this.packagePath).then(function (_package) {
        return typeof _package !== 'undefined'
            ? _package // package.json from front-door
            : self.untrustedPackageJson; // untrusted package.json from request
    }).then(function (_package) {
        logger.debug('using package.json:', _package);
        var repositoryUrl = getRepositoryUrl(_package);

        return self.whoami(self.token).then(function (_whoami) {
            logger.info('identified as user', _whoami.name);
            return self.client.user(_whoami.name)
        }).then(function (_stashUser) {
            logger.info('getting permission for user', _stashUser.auth.user, 'on repository', repositoryUrl, 'for', self.scope);
            return _stashUser.permission(repositoryUrl, self.scope);
        }).then(function (_permission) {
            logger.info('permissions for repository', repositoryUrl, 'for', self.scope, ':', _permission);
            _cb(null, _permission);
        }).catch(function (_error) {
            logger.error(_error);
            _cb(_error);
        });

    }).catch(_cb);
};

/**
 * @see https://github.com/bcoe/npme-auth-foo#looking-up-a-package
 * @param _request
 * @param _cb
 */
Authorizer.prototype.loadPackageJson = function (_packagePath) {
    var self = this;
    var url = this.frontDoorHost + _packagePath.split('?')[0] + '?sharedFetchSecret=' + this.sharedFetchSecret;
    var logger = this.logger;

    return new Promise(function (_resolve, _reject) {
        self.logger.info('fetching package.json', url);
        request.get(url, {
            json: true,
            strictSSL: false
        }, function(_error, _response, _package) {
            if (_error) {
                logger.error(_error);
                _resolve();
            }
            // we don't have an error but 4xx or something else from CouchDB
            if (_response.statusCode !== 200) {
                logger.debug(_response.statusCode, _response.statusMessage, _response.body);
                _resolve();
            }
            else {
                _resolve(_package);
            }
        });
    });
};

Authorizer.prototype.whoami = function(_token) {
    this.logger.info('fetching session for token', _token);
    var session = new Session();

    return new Promise(function (_resolve, _reject) {
        session.get('user-' + _token, function (_error, _sessionData) {
            if (_error) {
                _reject(_error);
            }
            else {
                _resolve(_sessionData);
            }
        });
    });
};

module.exports = Authorizer;
