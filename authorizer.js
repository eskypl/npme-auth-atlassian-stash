var request = require('request');

function Authorizer(_config) {

};

Authorizer.prototype.authorize = function (_request, _cb) {
    return _cb(null, true); // authorization was successful.
};

Authorizer.prototype.loadPackageJson = function(_request, _cb) {
    request.get(this.frontDoorHost + request.path.split('?')[0] + '?sharedFetchSecret=' + this.sharedFetchSecret, {
        json: true
    }, function(_error, _response, _package) {
        if (_error) {
            return _cb(_error);
        }
        else {
            return _cb(null, _response, _package);
        }
    });
};

module.exports = Authorizer;
