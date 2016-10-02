var seneca = require('seneca')();
var client = seneca.client();
var Boom = require("boom");
var promise = require('bluebird');
var Joi = require('joi');
var global_config = require('config');

var _ = require('lodash');
var l = require('../logger');

client.actAsync = promise.promisify(client.act, {
    multiArgs: false,
    context: client
});

module.exports = function(config){
  return {
    handleOptionsRequest: function(request, reply){
        reply({})
        .header('Access-Control-Allow-Origin','*')
        .header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,DELETE,BATCH')
        .header('Access-Control-Allow-Headers', 'Content-Type');
    },

    handleOptionsRequestForId: function(request, reply){
        reply({})
        .header('Access-Control-Allow-Origin','*')
        .header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,DELETE')
        .header('Access-Control-Allow-Headers', 'Content-Type');
    },


    handleGetRequest: function(request, reply){
      console.log('----------------------->', config, request.url.path, request.query);
      var tray = {};
      seneca.client();
      var seneca_request = { role:'database', model: config.model, cmd:'queryRecords', url: request.url.path, serialize: 'jsonapi', where:[]};
      if(_.has(request.query, 'filter[queue]')) {
        console.log('----------------------->', request.query['filter[queue]']);
        seneca_request.where.push({col:'queue_id', op:'=', val:request.query['filter[queue]']});
      }
      console.log('----------------------->', seneca_request);
      client.actAsync(seneca_request)
      .then(function(res){
          console.log(request.url.path);
          reply(res)
          .header('Access-Control-Allow-Origin','*')
          .header('Content-Type', 'application/vnd.api+json');
      });
    },


    handlePostRequest: function(request, reply){
        reply({'error':'not implemented'});
    },

    handleDeleteRequest: function(request, reply){
        reply({'error':'not implemented'});
    },

    handleGetRequestForId: function(request, reply){
      var tray = {};
      seneca.client();
      client.actAsync({ role:'database', model: config.model, cmd:'getRecord', id: request.params.id, url: request.url.path, serialize: 'jsonapi'  })
      .then(function(res){
          reply(res)
          .header('Access-Control-Allow-Origin','*')
          .header('Content-Type', 'application/vnd.api+json');
      });
    },

    handlePutRequestForId: function(request, reply){
        reply({'error':'not implemented'});
    },

    handleDeleteRequestForId: function(request, reply){
        reply({'error':'not implemented'});
    }
  };
};