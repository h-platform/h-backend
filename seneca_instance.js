var seneca = require('seneca')();
var promise = require('bluebird');

seneca.client({ port:10101, pin:'role:database' })
      .client({ port:10102, pin:'role:auth' });

seneca.actAsync = promise.promisify(seneca.act, {
    multiArgs: false,
    context: seneca
});

module.exports = seneca;