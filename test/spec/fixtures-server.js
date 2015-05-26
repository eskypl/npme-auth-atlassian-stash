var fs = require('fs');
var path = require('path');
var http = require('http');

function loadFixtures(_dir) {
    var dir = path.resolve(__dirname, _dir);
    var fixtures = fs.readdirSync(dir);

    return fixtures.map(function (_file) {
        var filePath = path.resolve(dir, _file);
        var fileUrl = _file.replace(/\.js$/, '').replace(/\./g, '/');

        return {
            filePath: filePath,
            fileUrl: fileUrl,
            data: require(filePath)
        };
    });
}

var fixtures = loadFixtures('../fixtures');
var fixturesMap = {};

fixtures.forEach(function (_fixture) {
    fixturesMap['/rest/api/1.0/' + _fixture.fileUrl] = _fixture.data;

    if (_fixture.fileUrl === 'admin/users/more-members') {
        fixturesMap['/rest/api/1.0/' + _fixture.fileUrl + '?context=cconrad'] = _fixture.data;
        fixturesMap['/rest/api/1.0/' + _fixture.fileUrl + '?context=mmorin'] = {
            size: 3,
            limit: 25,
            isLastPage: true,
            values: [],
            start: 0
        };
    }
});

var fixturesServer = http.createServer();

fixturesServer.on('error', function (_error) {
    console.error(_error);
});

fixturesServer.on('request', function (_request, _response) {
    if (fixturesMap[_request.url]) {
        _response.end(JSON.stringify(fixturesMap[_request.url]), 'utf8');
    } else {
        _response.statusCode = 404;
        _response.end();
    }
});

before(function (done) {
    fixturesServer.listen(3000, done);
});
