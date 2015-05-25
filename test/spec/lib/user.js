var StashClient = require('../../../stash/client');
require('../../../index');

describe('Stash User', function () {

    this.timeout(5000);
    this.client;
    this.user;

    beforeEach(function () {
        this.client = new StashClient('http://localhost:3000');
        this.user = this.client.user('cconrad', 'password');
    }, 'create new user');

    it('should pass authorization', function () {
       return this.user.authorize().then(function (res) {
           expect(res.name).to.equal('cconrad');
           expect(res.emailAddress).to.equal('chrisconrad@doamin.com');
       });
    });

    it('should be able to fetch groups to which client belongs', function () {
       return this.user.groups().then(function (res) {
           expect(res).to.eql([ 'team/js', 'team/php', 'team/qa' ]);
       });
    });

    it('should get permissions form specified repository and repository\'s project', function () {
       return this.user.permissions('https://stash.eskyspace.com/projects/foo/repos/bar').then(function (res) {
           expect(res).to.eql([ 'REPO_ADMIN', 'REPO_WRITE', 'PROJECT_ADMIN', 'PROJECT_WRITE' ]);
       });
    });

    it('should get information if client has specific permission(s)', function () {
       return this.user.permission('https://stash.eskyspace.com/projects/foo/repos/bar', 'REPO_ADMIN').then(function (res) {
           expect(res).to.be.truthy;
       });
    });

    it('should provide data for authenticator using Stash user data', function () {
        // https://github.com/bcoe/npme-auth-foo#the-credentials-object
        expect(this.user.token()).to.equal('8a75dd8e9061f819430b7f2a05bee19a5b18e3f926b8916503f24c28f5b12d44');
    });

});
