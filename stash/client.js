var url = require('url');
var StashUser = require('./user');

var API_BASE_PATH = '/rest/api/1.0/';
var API_ROUTES = {
    USER: 'users/{userSlug}',
    USER_GROUPS: 'admin/users/more-members?context={userSlug}',
    USER_PROJECT_PERMISSIONS: 'projects/{projectKey}/permissions/users',
    USER_REPOSITORY_PERMISSIONS: 'projects/{projectKey}/repos/{repositorySlug}/permissions/users',
    GROUP_PROJECT_PERMISSIONS: 'projects/{projectKey}/permissions/groups',
    GROUP_REPOSITORY_PERMISSIONS: 'projects/{projectKey}/repos/{repositorySlug}/permissions/groups'
};

function StashClient(_host) {
    this.baseUrl = url.resolve(_host, API_BASE_PATH);
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
    if (!this.user.instance) {
        Object.defineProperty(this.user, 'instance', {
            enumerable: false,
            configurable: false,
            value: new StashUser(this, _name, _password)
        });
    }
    return this.user.instance;
};

module.exports = StashClient;
