var _ = require('lodash');
var l = require('../logger');
var config = {model: 'category'};
var routes = require('../lib/route-generator')(config);

exports.register = function(server, options, next){
    server.route(routes);
    next();
};

exports.register.attributes = {
    name: config.model+'_api'
};