var _ = require('lodash');
var redis = require('redis-url');

function Session(_options) {
    _.extend(this, {
        client: redis.connect(process.env.LOGIN_CACHE_REDIS)
    }, _options)
}

Session.prototype.get = function(key, cb) {
    this.client.get(key, function(err, data) {
        if (err) cb(err);
        else cb(undefined, JSON.parse(data));
    });
};

Session.prototype.set = function(key, session, cb) {
    this.client.set(key, JSON.stringify(session), cb);
};

module.exports = Session;
