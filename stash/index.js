var _ = require('lodash');
var rc = require('rc');
var winston = require('winston');
var StashClient = require('./client');
var config = rc('stash', {
    logFile: '/etc/npme/logs/npme-auth-atlassian-stash.log',
    logLevel: 'warn',
    host: null,
    user: null,
    pass: null
});

_.extend(exports, config);

exports.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({
            json: false,
            prettyPrint: true,
            level: config.logLevel,
            filename: config.logFile
        })
    ]
});

exports.client = new StashClient(config.host, config.user, config.pass);
