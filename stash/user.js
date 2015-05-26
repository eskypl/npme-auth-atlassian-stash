var _ = require('lodash');
var repository = require('./repository');
var request = require('request');
var crypto = require('crypto');
var Promise = require('bluebird');

function User(_stashClient, _userName, _userPassword) {
    this.auth = {
        user: _userName,
        pass: _userPassword
    };

    this.client = _stashClient;
    this.requestOptions = _stashClient.commonRequestOptions;

    this.stashData;
    this.stashGroups;
}



/**
 * Authorize Stash user
 * @returns {Promise}
 */
User.prototype.authorize = function () {
    // This will authorize user with its own credentials during Basic authentication.
    // When done, user data is stored in redis cache.
    return this.client.authorize(this.auth.user, this.auth.pass).then(function (_stashData) {
        return {
            token: token(_stashData),
            user: {
                name: _stashData.name,
                email: _stashData.emailAddress
            }
        };
    });

};

/**
 * Check user account in Stash
 * @returns {Promise}
 */
User.prototype.account = function () {

    var self = this;
    var apiUrl = this.client.url('USER', { userSlug: this.auth.user });

    return new Promise(function (_resolve, _reject) {

        if (self.stashData) {
            return _resolve(self.stashData);
        }

        request.get(apiUrl, self.requestOptions, function (_error, _response, _responseBody) {
            self.stashData = _responseBody;

            if (_error) {
                return _reject(_error);
            }

            if (_response.statusCode !== 200) {
                return _reject(new Error('Request Error: ' + _response.statusCode + ' ' + apiUrl));
            }

            if (self.stashData.active === false) {
                return _reject(new Error('User "' + self.auth.user + '" is not active'));
            }

            _resolve(self.stashData);
        });
    });
};

User.prototype.groups = function () {

    var self = this;
    var apiUrl = this.client.url('USER_GROUPS', { userSlug: this.auth.user });;

    return new Promise(function (_resolve, _reject) {

        if (self.stashGroups) {
            return _resolve(self.stashGroups);
        }

        request.get(apiUrl, self.requestOptions, function (_error, _response, _responseBody) {
            if (_error) {
                return _reject(_error);
            }

            if (_response.statusCode !== 200) {
                return _reject(new Error('Request Error: ' + _response.statusCode + ' ' + apiUrl));
            }

            if (_responseBody) {
                self.stashGroups = _.pluck(_responseBody.values, 'name');
                _resolve(self.stashGroups);
            }
            else {
                _reject(new Error('Invalid response body'));
            }

        })
    });
};



/**
 * Get user or group permission (_permissionType) to the selected repository
 * or project to which repository belongs (_onlyProject).
 * @param _ctx {User} User object instance
 * @param _repository {String} Full repository URL
 * @param _permissionType {String} users or groups
 * @param [_onlyProject] {Boolean}
 * @returns {*}
 */
var permission = function (_ctx, _repository, _permissionType, _onlyProject) {
    var self = _ctx;
    var onlyProject = _onlyProject === true ? true : false;
    var repo = repository.parseUrl(_repository);
    var routeKey = [_permissionType, (onlyProject ? 'project' : 'repository'), 'permissions'].join('_').toUpperCase();
    var apiUrl = self.client.url(routeKey, { projectKey: repo.project.name, repositorySlug: repo.repository.name });
    var pluckPath = (_permissionType === 'user') ? ['user.name', 'permission'] : ['group.name', 'permission'];


    return Promise.all([self.account(), self.groups()]).then(function (_data) {

        var user = _data[0];
        var groups = _data[1];

        return new Promise(function (_resolve, _reject) {
            request.get(apiUrl, self.requestOptions, function (_error, _response, _responseBody) {
                if (_error) {
                    return _reject(_error);
                }

                if (_response.statusCode !== 200) {
                    return _reject(new Error('Request Error: ' + _response.statusCode + ' ' + apiUrl));
                }

                if (_responseBody) {
                    var result = {};
                    var names = _.pluck(_responseBody.values, pluckPath[0]);
                    var permissions = _.pluck(_responseBody.values, pluckPath[1]);

                    names.forEach(function (_value, _i) {
                        if (_value === user.name || groups.indexOf(_value) !== -1) {
                            result[_value] = permissions[_i];
                        }
                    });

                    _resolve(result);
                }
                else {
                    _reject(new Error('Invalid response body'));
                }

            });
        });
    });
};

/**
 *
 * @param _ctx
 * @param _repository
 * @param [_onlyProject]
 * @returns {*}
 */
var permissions = function (_ctx, _repository, _onlyProject) {
    return Promise.all([
        permission(_ctx, _repository, 'user', _onlyProject),
        permission(_ctx, _repository, 'group', _onlyProject)
    ]).then(function (_result) {
        //console.log(_result);
        return _.merge.apply(_, _result);
    });
};

User.prototype.permissions = function(_repository) {
    return Promise.all([
        permissions(this, _repository),
        permissions(this, _repository, true)
    ]).then(function (_result) {
        //console.log(_result);
        return _(_result).map(_.values).flatten().unique().value();
    });
};

var stashPermissions = {
    read: ['REPO_READ', 'REPO_WRITE', 'REPO_ADMIN'],
    write: ['REPO_WRITE', 'REPO_ADMIN']
}

function getPermissionsMap(_permissionType) {
    switch (_permissionType) {
        case 'read':
            return stashPermissions.read;
        case 'write':
            return stashPermissions.write;
        default:
            if (_permissionType instanceof Array === false) {
                return [_permissionType];
            }
            else {
                return _permissionType;
            }
    }
}


User.prototype.permission = function (_repository, _permissionType) {
    return this.permissions(_repository).then(function (_permissions) {
        var permissions = getPermissionsMap(_permissionType);

        return _(permissions).map(function(_value) {
            return _permissions.indexOf(_value) !== -1;
        }).includes(true);
    });
};

function token(_stashData) {
    var token = crypto.createHash('sha256');
    var stashData = _.pick(_stashData, ['name', 'emailAddress', 'id']);

    token.update(JSON.stringify(stashData));
    return token.digest('hex');
};


module.exports = User;
