var _ = require('lodash');
var url = require('url');
var StashUser = require('./user');
var Promise = require('bluebird');
var request = require('request');

var API_BASE_PATH = '/rest/api/1.0/';
var API_ROUTES = {
    USER: 'users/{userSlug}',
    USER_GROUPS: 'admin/users/more-members?context={userSlug}',
    USER_PROJECT_PERMISSIONS: 'projects/{projectKey}/permissions/users',
    USER_REPOSITORY_PERMISSIONS: 'projects/{projectKey}/repos/{repositorySlug}/permissions/users',
    GROUP_PROJECT_PERMISSIONS: 'projects/{projectKey}/permissions/groups',
    GROUP_REPOSITORY_PERMISSIONS: 'projects/{projectKey}/repos/{repositorySlug}/permissions/groups'
};

function StashClient(_host, _user, _pass) {
    var self = this;

    this.baseUrl = url.resolve(_host, API_BASE_PATH);
    this.auth = {
        user: _user,
        pass: _pass
    };

    this.commonRequestOptions = {
        json: true,
        strictSSL: false,
        auth: self.auth
    };
}

function setParams(_route, _params) {
    var route = _route;
    for (var param in _params) {
        route = route.replace('{' + param + '}', _params[param]);
    }

    if (/\\{[a-z]+\\}/i.test(route)) {
        throw new Error('Route params not resolved: ' + route);
    }

    return route;
}

StashClient.prototype.url = function (_route, _params) {
    var route = API_ROUTES[_route.toUpperCase()];

    if (!route) {
        throw new Error('Invalid route name: ' + _route);
    }

    return url.resolve(this.baseUrl, setParams(route, _params));
};

StashClient.prototype.user = function (_name, _password) {
    return new StashUser(this, _name, _password);
};

StashClient.prototype.authorize = function (_userName, _userPassword) {
    var apiUrl = this.url('USER', { userSlug: _userName });
    var requestOptions = _.extend({}, this.commonRequestOptions, {
        auth: {
            user: _userName,
            pass: _userPassword
        }
    });

    return new Promise(function (_resolve, _reject) {
        request.get(apiUrl, requestOptions, function (_error, _response, _responseBody) {
            if (_error) {
                return _reject(_error);
            }

            if (_response.statusCode !== 200) {
                return _reject(new Error('Request Error: ' + _response.statusCode + ' ' + apiUrl));
            }

            if (_responseBody.active === false) {
                return _reject(new Error('User "' + _userName + '" is not active'));
            }

            _resolve(_responseBody);
        });
    });
};

module.exports = StashClient;
