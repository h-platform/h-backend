var Hapi = require('hapi');
var config = require('config');
var glob = require("glob");
var l = require('./logger.js');
var _ = require('lodash');
var JWT_SECRET  = process.env.JWT_SECRET || "o8fup9w8#$GW%Y#$^U&35y3%Yw35yE#Y#Yu4pf9pjw98epfaw8ofioawufe@#eFSADFASDFAS";

// Create a new server
var server = new Hapi.Server();

// Setup the server with a host and port
server.connection({
    port: parseInt(process.env.PORT, 10) || config.get('server.port') || 3000,
    host: '0.0.0.0'
});


/*
    Load all plugins and then start the server.
    First: community/npm plugins are loaded
    Second: project specific plugins are loaded
*/
server.register([
    {
        register: require('good'),
        options: {
            ops: {
                interval: 1000
            },
            reporters: {
                myConsoleReporter: [{
                    module: 'good-squeeze',
                    name: 'Squeeze',
                    args: [{ log: '*', response: '*' }]
                }, {
                    module: 'good-console'
                }, 'stdout']
            }
        }
    }, {
        register: require('./pods/main/routes'),
    }, {
        register: require('inert'),
    }, {
        register: require('hapi-auth-jwt2')
    }, {
        register: require('./pods/user-managment/routes.js')
    },
], function (err) {

    if (err) {
        server.log('error', 'failed to install plugins')
        throw err;
    }


    // server.register(require('./pods/user-managment/routes.js'));
    // server.register(require('./pods/main/routes.js'));

    //Generate routes for models in "/models" folder
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

// Export the server to be required elsewhere.
module.exports = server;
