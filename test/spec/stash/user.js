var StashClient = require('../../../stash/client');

describe('Stash User', function () {

    this.client;
    this.user;

    beforeEach(function () {
        this.client = new StashClient('http://localhost:3000', 'npme', 'password');
        this.user = this.client.user('cconrad', 'password');
    }, 'create new user');

    it('should pass authorization', function () {
       return this.user.authorize().then(function (res) {
           expect(res.user.name).to.equal('cconrad');
           expect(res.user.email).to.equal('chrisconrad@doamin.com');
       });
    });

    it('should be able to fetch groups to which client belongs', function () {
       return this.user.groups().then(function (res) {
           expect(res).to.eql([ 'team/js', 'team/php', 'team/qa' ]);
       });
    });

    it('should get permissions form specified repository and repository\'s project', function () {
       return this.user.permissions('http://localhost:3000/projects/foo/repos/bar').then(function (res) {
           expect(res).to.eql([ 'REPO_ADMIN', 'REPO_WRITE', 'PROJECT_ADMIN', 'PROJECT_WRITE' ]);
       });
    });

    it('should get information if client has specific permission(s)', function () {
        var user = this.client.user('cconrad');
        return user.permission('http://localhost:3000/projects/foo/repos/bar', 'write').then(function (res) {
           expect(res).to.equal(true);
        });
    });

    it('should get information if client has specific permission(s)', function () {
        var user = this.client.user('mmorin');
        return user.permission('http://localhost:3000/projects/foo/repos/bar', 'write').then(function (res) {
           expect(res).to.equal(false);
        });
    });

    it('should provide data for authenticator using Stash user data', function () {
        var user = this.user;
        // https://github.com/bcoe/npme-auth-foo#the-credentials-object
        return user.authorize().then(function (res) {
            expect(res).to.have.property('token', '8a75dd8e9061f819430b7f2a05bee19a5b18e3f926b8916503f24c28f5b12d44');
        });
    });

});
