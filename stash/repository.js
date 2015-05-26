var url = require('url');

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
    var sshFormat = repositoryUrl.pathname.match(/^\/(\w+)\/(\w+)\.git$/i);

    if (sshFormat === null) {
        repositoryUrl.project = getProjectData(repositoryUrl.pathname);
        repositoryUrl.repository = getRepositoryData(repositoryUrl.pathname);
    }
    else {
        repositoryUrl.project = getProjectData('/projects/' + sshFormat[1]);
        repositoryUrl.repository = getRepositoryData('/repos/' + sshFormat[2]);
    }

    return repositoryUrl;
}

exports.parseUrl = parseRepositoryUrl;
