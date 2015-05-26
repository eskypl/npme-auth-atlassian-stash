var Authenticator = require('../../authenticator');

describe('authenticator', function () {
    //this.timeout(1000);

    var authenticator = new Authenticator();

    it('should pass valid data after authentication', function (done) {
        authenticator.authenticate({
            body: {
                name: 'cconrad',
                password: 'password',
                email: 'chrisconrad@doamin.com'
            }
        }, function (error, data) {
            expect(error).to.be.null;
            expect(data).to.have.property('token', '8a75dd8e9061f819430b7f2a05bee19a5b18e3f926b8916503f24c28f5b12d44');
            done();
        });
    });
});
