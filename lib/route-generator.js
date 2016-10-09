var _ = require('lodash');
var l = require('../logger');
var inflect = require('i')();
var global_config = require('config');

module.exports = function(config){
    var controller = require('./controllers')(config);
    var model_endpoint = inflect.pluralize(config.model);
    return [{
        method: 'OPTIONS',
        path: global_config.get('api.api_url') + '/models/' + model_endpoint,
        config: {
            auth: false,
            handler: controller.handleOptionsRequest
        }
    }, {
        method: 'GET',
        path: global_config.get('api.api_url') + '/models/' + model_endpoint,
        config: {
            auth: false,
            handler: controller.handleGetRequest
        }
    }, {
        method: 'POST',
        path: global_config.get('api.api_url') + '/models/' + model_endpoint,
        config: {
            auth: false,
            handler: controller.handlePostRequest
        }
    }, {
        method: 'DELETE',
        path: global_config.get('api.api_url') + '/models/' + model_endpoint,
        config: {
            auth: false,
            handler: controller.handleDeleteRequest
        }
    }, {
        method: 'OPTIONS',
        path: global_config.get('api.api_url') + '/models/' + model_endpoint + '/{id}',
        config: {
            auth: false,
            handler: controller.handleOptionsRequestForId
        }
    }, {
        method: 'GET',
        path: global_config.get('api.api_url') + '/models/' + model_endpoint + '/{id}',
        config: {
            auth: false,
            handler: controller.handleGetRequestForId
        }
    }, {
        method: 'PUT',
        path: global_config.get('api.api_url') + '/models/' + model_endpoint + '/{id}',
        config: {
            auth: false,
            handler: controller.handlePutRequestForId
        }
    }, {
        method: 'DELETE',
        path: global_config.get('api.api_url') + '/models/' + model_endpoint + '/{id}',
        config: {
            auth: false,
            handler: controller.handleDeleteRequestForId
        }
    }];
};