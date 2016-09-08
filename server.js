var Hapi = require('hapi');
var config = require('config');
var glob = require("glob");
var l = require('./logger.js');
var _ = require('lodash');

// Create a new server
var server = new Hapi.Server();

// Setup the server with a host and port
server.connection({
    port: parseInt(process.env.PORT, 10) || config.get('server.port') || 3000,
    host: '0.0.0.0'
});


//Session authentication scheme
server.register(require('hapi-auth-cookie'), (err) => {

    if (err) {
        throw err;
    }

    const cache = server.cache({ segment: 'sessions', expiresIn: 3 * 24 * 60 * 60 * 1000 });
    server.app.cache = cache;

    server.auth.strategy('session', 'cookie', true, {  
        password: 'b252cbedbe1b81efc660cc15df003aa6',
        isSecure: false,
        isHttpOnly: true,
        cookie: 'sid',
        redirectOnTry: false,
        redirectTo: '/user/login',
        appendNext: true
    });
});


//Session authentication scheme
server.register(require('bell'), (err) => {

    if (err) {
        throw err;
    }

    server.auth.strategy('facebook', 'bell', {  
        provider: 'facebook',
        isSecure: false,
        password: 'b252cbedbe1b81efc660cc15df003aa6',
        clientId: '193712611002614',
        clientSecret: 'e2f85f697f00637d4740176f6eabd78d'
    });
});


// Export the server to be required elsewhere.
module.exports = server;

/*
    Load all plugins and then start the server.
    First: community/npm plugins are loaded
    Second: project specific plugins are loaded
 */
server.register([
    {
        register: require("good"),
        options: {
            opsInterval: 5000,
            reporters: [{
                reporter: require('good-console'),
                args:[{ ops: '*', request: '*', log: '*', response: '*', 'error': '*' }]
            }]
        }
    },
    {
        register: require('inert'),
    },
    {
        register: require("hapi-cache-buster")
    },
    {
        register: require('./pods/main/routes.js')
    },
    {
        register: require('./pods/login/routes.js')
    }
    // {
    //     register: require('./models/queue.js')
    // },
    // {
    //     register: require('./models/post.js')
    // }
], function (err) {

    if (err) {
        throw err;
    }

    glob("./models/*.js", {}, function (er, files) {
      // files is an array of filenames.
      _.each(files, function(file){
        var model_name = _.camelCase(file);
        model_name = _.replace(model_name, "models","");
        model_name = _.replace(model_name, "Js", "");
        model_name = _.snakeCase(model_name);
        l.info("found model: ", model_name, "from", file);
        server.register([{register: require(file)}]);
      });
    });

    //Start the server
    server.start(function() {
        //Log to the console the host and port info
        console.log('Server started at: ' + server.info.uri);
    });
});
