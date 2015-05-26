var repository = require('../../../stash/repository');

describe('Repository URL parser', function () {
    it('should parse SSH url from package.json', function () {
        var url = repository.parseUrl('ssh://git@stash.domain.com/foo/bar.git');

        expect(url).to.have.deep.property('project.name', 'foo');
        expect(url).to.have.deep.property('project.path', '/projects/foo');

        expect(url).to.have.deep.property('repository.name', 'bar');
        expect(url).to.have.deep.property('repository.path', '/repos/bar');
    });
    it('should parse HTTP url from package.json', function () {
        var url = repository.parseUrl('http://stash.domain.com/projects/foo/repos/bar.git');

        expect(url).to.have.deep.property('project.name', 'foo');
        expect(url).to.have.deep.property('project.path', '/projects/foo');

        expect(url).to.have.deep.property('repository.name', 'bar');
        expect(url).to.have.deep.property('repository.path', '/repos/bar');
    });
});
