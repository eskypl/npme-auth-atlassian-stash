var _ = require('lodash');
var url = require('url');
var request = require('request');
var crypto = require('crypto');

/**
 * @see https://github.com/bcoe/npme-auth-foo
 * @param _userData
 * @returns {{token: string, user: {email: *, name: *}}}
 */
function authenticatorData(_userData) {
    return {
        token: _userData.id,
        user: {
            email: _userData.emailAddress,
            name: _userData.name
        }
    };
}

function User(_stashClient, _userName, _userPassword) {
    var self = this;

    this.auth = {
        user: _userName,
        pass: _userPassword
    };

    this.commonRequestOptions = {
        json: true,
        strictSSL: false,
        auth: self.auth
    };

    this.stashData;
    this.stashGroups;
    this.client = _stashClient;
}


/**
 * Authorize Stash user and save its credentials
 * @returns {Promise}
 */
User.prototype.authorize = function () {

    var self = this;
    var apiUrl = this.client.url('USER', { userSlug: this.auth.user });

    return new Promise(function (_resolve, _reject) {

        if (self.authenticatorData) {
            return _resolve(self.authenticatorData);
        }

        request.get(apiUrl, self.commonRequestOptions, function (_error, _response, _responseBody) {
            self.stashData = _responseBody;

            if (_error) {
                return _reject(_error);
            }

            if (_response.statusCode !== 200) {
                return _reject(new Error('Request Error: ' + _response.statusCode + ' ' + apiUrl));
            }

            if (self.stashData.active === false) {
                return _reject(new Error('User not active'));
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

        request.get(apiUrl, self.commonRequestOptions, function (_error, _response, _responseBody) {
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

function getProjectData(_repositoryUrl) {
    var project = _repositoryUrl.match(/\/projects\/(\w+)/i);
    if (project !== null) {
        return {
            path: project[0],
            name: project[1]
        };
    }
}

function getRepositoryData(_repositoryUrl) {
    var repo = _repositoryUrl.match(/\/repos\/(\w+)/i);
    if (repo !== null) {
        return {
            path: repo[0],
            name: repo[1]
        };
    }
}

function parseRepositoryUrl(_repositoryUrl) {
    var repositoryUrl = url.parse(_repositoryUrl);

    repositoryUrl.project = getProjectData(repositoryUrl.pathname);
    repositoryUrl.repository = getRepositoryData(repositoryUrl.pathname);

    return repositoryUrl;
}

/**
 * Get user or group permission (_permissionType) to the selected repository
 * or project to which repository belongs (_onlyProject).
 * @param _ctx {User} User object instance
 * @param _repository {String} Full repository URL
 * @param _permissionType {String} users or groups
 * @param [_onlyProject] {Boolean}
 * @returns {*}
 */
var permission =  function (_ctx, _repository, _permissionType, _onlyProject) {
    var self = _ctx;
    var onlyProject = _onlyProject === true ? true : false;
    var repository = parseRepositoryUrl(_repository);
    var routeKey = [_permissionType, (onlyProject ? 'project' : 'repository'), 'permissions'].join('_').toUpperCase();
    var apiUrl = self.client.url(routeKey, { projectKey: repository.project.name, repositorySlug: repository.repository.name });
    var pluckPath = (_permissionType === 'user') ? ['user.name', 'permission'] : ['group.name', 'permission'];


    return Promise.all([self.authorize(), self.groups()]).then(function (_data) {

        var user = _data[0];
        var groups = _data[1];

        return new Promise(function (_resolve, _reject) {
            request.get(apiUrl, self.commonRequestOptions, function (_error, _response, _responseBody) {
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

User.prototype.token = function () {
    var token = crypto.createHash('sha256');
    var stashData = _.pick(this.stashData, ['name', 'emailAddress', 'id']);

    token.update(JSON.stringify(stashData));
    return token.digest('hex');
};

/**
 * @see https://github.com/bcoe/npme-auth-foo#the-callback
 */
User.prototype.authenticatorData = function () {
    return {
        token: this.token(),
        user: {
            name: this.stashData.name,
            email: this.stashData.emailAddress
        }
    };
};


module.exports = User;
