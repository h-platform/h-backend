// Base routes for default index/root path, about page, 404 error pages, and others..
var config = require('config');
var Boom = require('boom');
var seneca = require('seneca')();
var promise = require('bluebird');

var controller = require('./controller');
var l = require('../../logger');

var client = seneca.client('10102');

client.actAsync = promise.promisify(client.act, {
    multiArgs: false,
    context: client
});

exports.register = function(server, options, next){
    server.route([
        {
            method: 'POST',
            path: '/user/login/local',
            config: {
                auth: {
                    mode: 'try',
                    strategy: 'session'
                },
                handler: controller.loginLocal
            }
        },{  
            method: 'GET',
            path: '/user/me',
            config: {
                auth: {
                    strategy: 'session'
                },
                handler: controller.profile
            }
        }, {  
            method: 'GET',
            path: '/user/logout',
            config: {
                auth: {
                    strategy: 'session',
                    mode: 'try'
                },
                handler: controller.logout
            }
        }
    ]);

    next();
};

exports.register.attributes = {
    name: 'login'
};